import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";

export async function listUsers() {
  return User.find().lean();
}

export async function getUserById(id) {
  const doc = await User.findById(id).lean();
  if (!doc) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  return doc;
}

export async function createUser(payload) {
  const exists = await User.findOne({ email: payload.email });
  if (exists) throw new ApiError(StatusCodes.CONFLICT, "Email already in use");
  const doc = await User.create(payload);
  return doc.toObject();
}

export async function updateUser(id, payload) {
  const doc = await User.findByIdAndUpdate(id, payload, { new: true, runValidators: true }).lean();
  if (!doc) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  return doc;
}

export async function deleteUser(id) {
  const res = await User.findByIdAndDelete(id);
  if (!res) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  return true;
}
