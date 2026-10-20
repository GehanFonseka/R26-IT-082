import { getDatabase } from "../config/mongo.js";

const collection = async () => (await getDatabase()).collection("interviewAnalyses");
const clean = (record) => {
  if (!record) return null;
  const { _id, ...data } = record;
  return data;
};

export const analysisRepository = {
  async save(result) {
    const analyses = await collection();
    const current = await analyses.findOne({ interviewId: result.interviewId });
    const record = {
      ...result,
      analysisVersion: Number(current?.analysisVersion || 0) + 1,
      updatedAt: new Date(),
    };
    await analyses.updateOne({ interviewId: result.interviewId }, { $set: record }, { upsert: true });
    return clean(record);
  },

  async get(interviewId) {
    return clean(await (await collection()).findOne({ interviewId }));
  },
};
