import { StatusCodes } from "http-status-codes";

export function notFound(_req, res, _next) {
  res.status(StatusCodes.NOT_FOUND).json({ error: "Not Found" });
}

export function errorHandler(err, _req, res, _next) {
  const status = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message || "Internal Server Error";
  const meta = process.env.NODE_ENV !== "production" ? { stack: err.stack } : undefined;
  res.status(status).json({ error: message, ...(meta && { meta }) });
}
