import { Response } from "express";
import { StatusCodes } from "http-status-codes";

export const apiResponse = {
  success: (res: Response, data: any, status: StatusCodes = StatusCodes.OK) => {
    res.status(status).json({ success: true, data });
  },
  error: (res: Response, message: string, status: StatusCodes = StatusCodes.INTERNAL_SERVER_ERROR) => {
    res.status(status).json({ success: false, error: message });
  },
};
