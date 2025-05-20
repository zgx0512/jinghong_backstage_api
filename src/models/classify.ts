/* 
商品分类模型
 */

import mongoose from "mongoose";

// 引入自增ID方法
import { getNextSequence } from "./counter";

// 定义商品分类模型接口类型
interface IClassify extends mongoose.Document {
  name: string;
  id: number;
  level: number;
  parentId: number | null;
  createTime: Date;
  updateTime: Date;
}

// 定义商品分类模型的Schema
const ClassifySchema = new mongoose.Schema<IClassify>({
  name: { type: String, required: true },
  id: { type: Number, unique: true },
  level: { type: Number, required: true },
  parentId: { type: Number, default: null },
  createTime: {
    type: Date,
    default: new Date(Date.now() + 8 * 60 * 60 * 1000),
  }, // 创建时间
  updateTime: {
    type: Date,
    default: new Date(Date.now() + 8 * 60 * 60 * 1000),
  }, // 更新时间
})

ClassifySchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      this.id = await getNextSequence("id");
    } catch (error) {
      throw new Error("获取id失败");
    }
  }
  next();
})

export const Classify = mongoose.model<IClassify>("Classify", ClassifySchema);