export const notFound = (req, res) => res.status(404).json({
  success: false, message: "Attrition route not found", requestId: req.requestId,
});
export const errorHandler = (error, req, res, _next) => res.status(error.statusCode ?? 500).json({
  success: false, message: error.statusCode ? error.message : "Attrition service request failed",
  requestId: req.requestId,
});
