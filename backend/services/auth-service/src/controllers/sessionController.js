import { requireActiveSession } from "../services/sessionService.js";

export const validateSession = async (req, res) => res.json({
  success: true, data: await requireActiveSession(req.header("authorization")), requestId: req.requestId,
});
