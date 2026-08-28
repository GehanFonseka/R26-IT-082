export const notFound = (req, res) => res.status(404).json({ success: false, message: "Resume explanation route not found", requestId: req.requestId });

export const errorHandler = (error, req, res, _next) => {
  const status = error.statusCode ?? 500;
  res.status(status).json({ success: false, message: status >= 500 ? "Resume explanation failed" : error.message, requestId: req.requestId });
};
