import { MongoClient } from "mongodb";
import { env } from "./env.js";

let databasePromise;

export const connectDatabase = async () => {
  if (!env.mongoUri) throw new Error("MONGODB_URI is not configured");
  if (!databasePromise) {
    const client = new MongoClient(env.mongoUri);
    databasePromise = client.connect()
      .then(() => client.db(env.mongoDbName))
      .then(async (database) => {
        await database.collection("auth_users").createIndex({ email: 1 }, { unique: true });
        return database;
      })
      .catch((error) => {
        databasePromise = undefined;
        throw error;
      });
  }
  return databasePromise;
};

export const getDatabase = () => connectDatabase();
