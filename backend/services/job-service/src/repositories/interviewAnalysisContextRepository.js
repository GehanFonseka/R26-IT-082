import { getDatabase } from "../config/mongo.js";

const collection = async (name) => (await getDatabase()).collection(name);
const clean = (record) => {
  if (!record) return null;
  const { _id, ...data } = record;
  return data;
};

const requireAccess = async (interviewId, userId, role) => {
  const interview = await (await collection("interviews")).findOne({ id: interviewId });
  if (!interview) throw Object.assign(new Error("Interview not found"), { statusCode: 404 });
  const query = role === "admin" ? { id: interview.applicationId } : { id: interview.applicationId, userId };
  const application = await (await collection("applications")).findOne(query);
  if (!application) throw Object.assign(new Error("You are not a participant in this interview"), { statusCode: 403 });
  return { interview, application };
};

export const getInterviewAnalysisContext = async (interviewId, userId, role) => {
  const { interview, application } = await requireAccess(interviewId, userId, role);
  const [job, transcript] = await Promise.all([
    (await collection("jobs")).findOne({ id: interview.jobId }),
    (await collection("interviewTranscripts")).find({ interviewId }).sort({ createdAt: 1 }).limit(1000).toArray(),
  ]);
  return {
    interview: { id: interview.id, jobId: interview.jobId, applicationId: interview.applicationId, status: interview.status },
    job: clean(job),
    candidate: application.candidate || {},
    transcript: transcript.map(clean),
  };
};
