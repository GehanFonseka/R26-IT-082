export const notFound = (_req, res) => res.status(404).json({
  success: false,
  message: "Analysis endpoint not found",
});

export const errorHandler = (error, req, res, _next) => {
  const status = Number(error.statusCode) || 500;
  const body = {
    success: false,
    message: status >= 500 ? "Interview analysis failed" : error.message,
    requestId: req.requestId,
  };
  if (status < 500 && error.technicalError) body.error = error.technicalError;
  res.status(status).json(body);
};
