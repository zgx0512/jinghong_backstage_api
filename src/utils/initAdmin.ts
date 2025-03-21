import { connectDB } from "../config/db";
import { User } from "../models/user";

const initAdmin = async () => {
  try {
    await connectDB();

    // 检查是否已存在管理员
    const adminExists = await User.findOne({ username: "super-admin" });
    if (adminExists) {
      console.log("超级管理员已存在，无需初始化");
      return;
    }

    // 创建超级管理员
    await User.create({
      email: "2324461523@qq.com",
      password: "A123456",
      username: "super-admin",
      role: ["superAdmin"],
    });

    console.log("超级管理员创建成功");
  } catch (error) {
    console.error("初始化管理员失败:", error);
  } finally {
    process.exit();
  }
};

initAdmin();
