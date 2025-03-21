import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { getNextSequence } from "./counter";

// 定义用户模型的接口
export interface IUser extends mongoose.Document {
  userId: number; // 用户ID，从10000开始
  username: string;
  password: string;
  email: string;
  createTime: Date;
  updateTime: Date;
  role?: string;
  avatar?: string;
  comparePassword: (password: string) => Promise<boolean>; // 密码校验函数
}

// 定义用户模型的 Schema
const userSchema = new mongoose.Schema<IUser>({
  userId: {
    type: Number,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 12,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  role: [
    {
      type: String,
      ref: "Role",
      required: false,
    },
  ],
  avatar: {
    type: String,
    required: false,
  },
  createTime: {
    type: Date,
    default: () => new Date(Date.now() + 8 * 60 * 60 * 1000),
  },
  updateTime: {
    type: Date,
    default: () => new Date(Date.now() + 8 * 60 * 60 * 1000),
  },
});

// 在保存用户前自动生成userId
userSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      this.userId = await getNextSequence("userId");
    } catch (error) {
      console.error("生成 userId 失败:", error);
      throw error;
    }
  }
  next();
});

// 在保存用户前加密密码
userSchema.pre("save", async function (next) {
  // 只有在创建用户或者修改密码时才需要加密
  if (this.isNew || this.isModified("password")) {
    const salt = await bcrypt.genSalt(10); // 生成盐值，参数代表轮数，越大越安全，但越耗时
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// 定义密码校验函数
userSchema.methods.comparePassword = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

// 在保存用户前随机生成 avatar
userSchema.pre("save", async function (next) {
  // 新增采用生成头像
  if (this.isNew) {
    // 从 2 - 1000 获取一个随机整数
    const randomNum = Math.floor(Math.random() * 1000) + 2;
    this.avatar = `https://api.dicebear.com/6.x/bottts/svg?seed=${randomNum}`;
  }
  next();
});

export const User = mongoose.model<IUser>("User", userSchema);
