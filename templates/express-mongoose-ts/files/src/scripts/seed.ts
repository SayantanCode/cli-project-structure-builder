import mongoose from "mongoose";
import { User } from "../models/user.model";

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/your-app-db");
    console.log("Connected to MongoDB for seeding.");

    const usersToSeed = [
      { name: "Admin User", email: "admin@example.com", role: "admin" },
      { name: "Normal User", email: "user@example.com", role: "user" },
    ];

    await User.deleteMany({});
    await User.insertMany(usersToSeed);

    console.log("Database seeded successfully with 2 users.");
    process.exit(0);
  } catch (error) {
    console.error("Error during seeding:", error);
    process.exit(1);
  }
};

seed();
