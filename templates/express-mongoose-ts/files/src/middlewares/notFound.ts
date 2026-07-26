import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

export function notFound(_req: Request, res: Response, _next: NextFunction) {
  res.status(StatusCodes.NOT_FOUND).json({ error: "Not Found" });
}
