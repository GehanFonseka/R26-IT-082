export const notFound = (_req, res) => res.status(404).json({ success: false, message: "CV analysis route not found" });

export const errorHandler = (error, req, res, _next) => {
  const status = Number(error.statusCode) || 500;
  res.status(status).json({
    success: false,
    message: status >= 500 ? "CV profile analysis failed" : error.message,
    ...(status < 500 && error.technicalError ? { error: error.technicalError } : {}),
    requestId: req.requestId,
  });
};
