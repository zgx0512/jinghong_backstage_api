import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI as string;

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB 连接成功");
  } catch (error) {
    console.error("MongoDB 连接失败:", error);
    process.exit(1);
  }
};
