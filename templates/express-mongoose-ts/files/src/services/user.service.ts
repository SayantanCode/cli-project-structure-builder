import { User, UserDocument } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { StatusCodes } from "http-status-codes";

export async function listUsers(): Promise<UserDocument[]> {
  return User.find().lean();
}

export async function getUserById(id: string): Promise<UserDocument> {
  const doc = await User.findById(id).lean();
  if (!doc) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  return doc;
}

export async function createUser(payload: Partial<UserDocument>): Promise<UserDocument> {
  const exists = await User.findOne({ email: payload.email });
  if (exists) throw new ApiError(StatusCodes.CONFLICT, "Email already in use");
  const doc = await User.create(payload);
  return doc.toObject();
}

export async function updateUser(id: string, payload: Partial<UserDocument>): Promise<UserDocument> {
  const doc = await User.findByIdAndUpdate(id, payload, { new: true, runValidators: true }).lean();
  if (!doc) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  return doc;
}

export async function deleteUser(id: string): Promise<boolean> {
  const res = await User.findByIdAndDelete(id);
  if (!res) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  return true;
}
