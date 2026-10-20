import { MongoClient } from "mongodb";
import { env } from "./env.js";

let databasePromise;

export const getDatabase = async () => {
  if (!env.mongoUri) throw Object.assign(new Error("MONGODB_URI is not configured"), { statusCode: 503 });
  if (!databasePromise) {
    const client = new MongoClient(env.mongoUri);
    databasePromise = client.connect().then(() => client.db(env.mongoDbName)).then(async (database) => {
      await database.collection("cvProfileAnalyses").createIndex({ userId: 1 }, { unique: true });
      return database;
    }).catch((error) => { databasePromise = undefined; throw error; });
  }
  return databasePromise;
};
