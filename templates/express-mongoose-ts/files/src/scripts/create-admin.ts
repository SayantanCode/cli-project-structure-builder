import mongoose from "mongoose";
import { User } from "../models/user.model";

const createAdmin = async () => {
  try {
    const email = process.argv[2];
    if (!email) {
      console.error("Usage: ts-node src/scripts/create-admin.ts <email>");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/your-app-db");
    console.log("Connected to MongoDB.");

    const user = await User.findOneAndUpdate(
      { email },
      { role: "admin" },
      { new: true, upsert: true }
    );

    console.log(`User ${user.email} is now an admin.`);
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
};

createAdmin();
