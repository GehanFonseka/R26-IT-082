#!/usr/bin/env node
/**
 * Lanka Talent Insights — Legacy Admin Tenant Migration Tool
 *
 * Scans MongoDB Atlas auth_users for legacy admin accounts created without
 * a companyId and maps them to an explicit company tenant.
 *
 * Safety Guarantees:
 * - Runs in DRY-RUN mode by default (zero writes).
 * - Requires explicit --execute flag and --company-name to perform writes.
 * - Masks email addresses to prevent exposing PII in console logs.
 * - Does NOT run automatically on startup.
 *
 * Usage:
 *   # Inspect existing legacy admin accounts (Safe Read-Only Dry Run):
 *   node scripts/migrate-legacy-admin.mjs
 *
 *   # Apply company assignment to legacy accounts:
 *   node scripts/migrate-legacy-admin.mjs --execute --company-name="Lanka Talent Corp"
 */

import { MongoClient } from "mongodb";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const args = process.argv.slice(2);
const isExecute = args.includes("--execute");
const isDryRun = !isExecute;

const getArgValue = (prefix) => {
  const match = args.find((a) => a.startsWith(prefix));
  return match ? match.split("=")[1]?.replace(/^["']|["']$/g, "") : null;
};

const companyName = getArgValue("--company-name=");
const companyId = getArgValue("--company-id=") || randomUUID();
const mongoUri = getArgValue("--uri=") || process.env.MONGODB_URI;
const dbName = getArgValue("--db=") || process.env.MONGODB_DB_NAME || "lanka_talent";

const maskEmail = (email) => {
  if (!email || !email.includes("@")) return "***";
  const [local, domain] = email.split("@");
  const visible = local.length > 2 ? `${local[0]}***${local[local.length - 1]}` : `${local[0]}***`;
  return `${visible}@${domain}`;
};

async function main() {
  console.log("============================================================");
  console.log(" Lanka Talent Insights — Legacy Admin Migration Utility    ");
  console.log(" Mode: " + (isDryRun ? "DRY-RUN (Safe Read-Only)" : "EXECUTE (Live Write)"));
  console.log("============================================================\n");

  if (!mongoUri) {
    console.error("Error: MONGODB_URI is not set in environment or supplied via --uri=");
    process.exit(1);
  }

  if (isExecute && !companyName) {
    console.error("Error: --company-name=\"<name>\" is required when executing migration.");
    console.error("Example: node scripts/migrate-legacy-admin.mjs --execute --company-name=\"My Company\"");
    process.exit(1);
  }

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db(dbName);
    const usersCollection = db.collection("auth_users");

    const query = {
      role: "admin",
      $or: [
        { companyId: null },
        { companyId: { $exists: false } },
        { companyId: "" },
      ],
    };

    const legacyAdmins = await usersCollection.find(query).toArray();

    if (legacyAdmins.length === 0) {
      console.log("✓ No unassigned legacy admin accounts found.");
      console.log("  All administrator accounts already have company associations.\n");
      await client.close();
      process.exit(0);
    }

    console.log(`Found ${legacyAdmins.length} legacy admin account(s) needing company assignment:\n`);

    const summary = legacyAdmins.map((user) => ({
      userId: user.id || String(user._id),
      maskedEmail: maskEmail(user.email),
      currentRole: user.role,
      currentAccountType: user.accountType || "(none)",
      targetCompanyId: companyId,
      targetCompanyName: companyName || "(pending --company-name)",
    }));

    console.table(summary);

    if (isDryRun) {
      console.log("\n[DRY RUN SUMMARY]");
      console.log("No modifications were made to the database.");
      console.log("To apply these changes, rerun with:");
      console.log(`  node scripts/migrate-legacy-admin.mjs --execute --company-name="<Company Name>"`);
      console.log(`  (Optionally add --company-id="<UUID>" to specify an existing company ID)\n`);
    } else {
      console.log("\nExecuting database update...");
      let updatedCount = 0;

      for (const admin of legacyAdmins) {
        const result = await usersCollection.updateOne(
          { _id: admin._id },
          {
            $set: {
              companyId,
              companyName,
              accountType: "company",
              updatedAt: new Date(),
            },
          }
        );
        if (result.modifiedCount > 0) {
          updatedCount++;
        }
      }

      console.log(`✓ Migration complete: ${updatedCount} account(s) updated successfully.`);
      console.log(`  Assigned Company ID:   ${companyId}`);
      console.log(`  Assigned Company Name: ${companyName}\n`);
    }
  } catch (error) {
    console.error("Migration error:", error.message);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

main();
