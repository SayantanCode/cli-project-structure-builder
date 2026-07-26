import { StatusCodes } from "http-status-codes";

export const apiResponse = {
  success: (res, data, status = StatusCodes.OK) => {
    res.status(status).json({ success: true, data });
  },
  error: (res, message, status = StatusCodes.INTERNAL_SERVER_ERROR) => {
    res.status(status).json({ success: false, error: message });
  },
};
