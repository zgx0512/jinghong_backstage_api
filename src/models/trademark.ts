/* 
品牌模型
 */
import mongoose from "mongoose";
// 引入计数器
import { getNextSequence } from "./counter";

// 定义品牌的ts类型
interface ITrademark extends mongoose.Document {
  id: number;
  tmName: string;
  logoUrl: string;
  createTime: Date;
  updateTime: Date;
}

// 定义品牌的schema
const trademarkSchema = new mongoose.Schema<ITrademark>({
  id: { type: Number, unique: true },
  tmName: { type: String, required: true },
  logoUrl: { type: String, required: true },
  createTime: {
    type: Date,
    default: () => new Date(Date.now() + 8 * 60 * 60 * 1000),
  },
  updateTime: {
    type: Date,
    default: () => new Date(Date.now() + 8 * 60 * 60 * 1000),
  },
});

// 在保存品牌前自动生成id
trademarkSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      this.id = await getNextSequence("id");
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  next();
});

export const Trademark = mongoose.model<ITrademark>("Trademark", trademarkSchema);
