export const notFound = (req, res) => res.status(404).json({
  success: false, message: "CV matching route not found", requestId: req.requestId,
});

export const errorHandler = (error, req, res, _next) => {
  const status = error.statusCode ?? 500;
  res.status(status).json({
    success: false,
    message: status >= 500 ? "CV matching inference failed" : error.message,
    ...(process.env.NODE_ENV !== "production" && status >= 500 ? { error: error.message } : {}),
    requestId: req.requestId,
  });
};
