import { getDatabase } from "../config/mongo.js";

const collection = async () => (await getDatabase()).collection("cvProfileAnalyses");
const clean = (record) => { if (!record) return null; const { _id, userId, ...data } = record; return data; };

export const analysisRepository = {
  async save(userId, analysis) {
    const record = { userId, ...analysis, updatedAt: new Date() };
    await (await collection()).updateOne({ userId }, { $set: record }, { upsert: true });
    return clean(record);
  },
  async get(userId) { return clean(await (await collection()).findOne({ userId })); },
};
