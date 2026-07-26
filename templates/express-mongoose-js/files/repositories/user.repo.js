import { User } from "../models/user.model.js";

// A simple repository pattern for Mongoose models.
// It provides a thin, generic layer for CRUD operations.

export const userRepository = {
  findById: (id) => User.findById(id).lean(),
  find: (query) => User.find(query).lean(),
  create: (payload) => User.create(payload),
  update: (id, payload) => User.findByIdAndUpdate(id, payload, { new: true }).lean(),
  delete: (id) => User.findByIdAndDelete(id).lean(),
};
