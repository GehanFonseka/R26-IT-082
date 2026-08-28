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
        await database.collection("jobs").createIndex({ id: 1 }, { unique: true });
        await database.collection("applications").createIndex({ id: 1 }, { unique: true });
        await database.collection("applications").createIndex({ jobId: 1, userId: 1 }, { unique: true });
        await database.collection("interviews").createIndex({ id: 1 }, { unique: true });
        await database.collection("interviews").createIndex({ jobId: 1, scheduledAt: 1 });
        await database.collection("interviewRooms").createIndex({ interviewId: 1 }, { unique: true });
        await database.collection("interviewTranscripts").createIndex({ interviewId: 1, createdAt: 1 });
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
