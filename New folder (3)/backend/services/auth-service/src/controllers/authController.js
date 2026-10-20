import { loginRecruiter, registerRecruiter } from "../services/authService.js";

export const register = async (req, res) => res.status(201).json({
  success: true, data: await registerRecruiter(req.body), requestId: req.requestId,
});

export const login = async (req, res) => res.json({
  success: true, data: await loginRecruiter(req.body), requestId: req.requestId,
});

export const refresh = (req, res) => res.status(501).json({
  success: false, message: "Refresh-token persistence is not configured", requestId: req.requestId,
});

export const logout = (req, res) => res.status(204).send();
