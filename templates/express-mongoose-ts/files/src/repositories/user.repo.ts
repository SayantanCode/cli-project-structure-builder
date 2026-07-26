import { User, UserDocument } from "../models/user.model";
import { IRepository } from "./base.repo";

// A simple repository pattern for Mongoose models.
// It provides a thin, generic layer for CRUD operations.

export const userRepository: IRepository = {
  findById: (id: string) => User.findById(id).lean(),
  find: (query: any) => User.find(query).lean(),
  create: (payload: any) => User.create(payload),
  update: (id: string, payload: any) => User.findByIdAndUpdate(id, payload, { new: true }).lean(),
  delete: (id: string) => User.findByIdAndDelete(id).lean(),
};

interface IRepository {
  findById: (id: string) => Promise<UserDocument | null>;
  find: (query: any) => Promise<UserDocument[]>;
  create: (payload: any) => Promise<UserDocument>;
  update: (id: string, payload: any) => Promise<UserDocument | null>;
  delete: (id: string) => Promise<UserDocument | null>;
}
