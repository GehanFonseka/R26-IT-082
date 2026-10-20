export const notFound = (req, res) => res.status(404).json({
  success: false,
  message: "Gateway route not found",
  requestId: req.requestId,
});

export const errorHandler = (error, req, res, _next) => {
  const status = error.code === "LIMIT_FILE_SIZE" ? 413 : (error.statusCode ?? 500);
  const message = error.code === "LIMIT_FILE_SIZE"
    ? "CV file is too large. Maximum size is 15 MB."
    : (status >= 500 ? "Gateway request failed" : error.message);
  res.status(status).json({
    success: false,
    message,
    ...(error.technicalError && process.env.NODE_ENV !== "production" ? { error: error.technicalError } : {}),
    requestId: req.requestId,
  });
};
