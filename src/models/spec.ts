// 规格类型模型
import mongoose from "mongoose";

import { getNextSequence } from "./counter";

// 定义规格类型模型接口类型
interface ISpec extends mongoose.Document {
  spec_name: string;
  spec_id: number;
  spec_values: string[]; // 规格值数组
  sort_order: number; // 排序
  is_active: number; // 是否启用
  create_time: Date;
  update_time: Date;
}

// 定义规格类型的Schema
const SpecSchema = new mongoose.Schema<ISpec>({
  spec_name: {
    type: String,
    required: true,
  },
  spec_id: {
    type: Number,
    unique: true,
  },
  spec_values: {
    type: [String],
    required: false,
    default: [],
  },
  sort_order: {
    type: Number,
    required: false,
    default: 0,
  },
  is_active: {
    type: Number,
    required: false,
    default: 1,
  },
  create_time: {
    type: Date,
    default: () => new Date(Date.now() + 8 * 60 * 60 * 1000),
  },
  update_time: {
    type: Date,
    default: () => new Date(Date.now() + 8 * 60 * 60 * 1000),
  },
});

SpecSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      this.spec_id = await getNextSequence("spec_id");
    } catch (error) {
      throw error;
    }
  }
  this.update_time = new Date(Date.now() + 8 * 60 * 60 * 1000);
  next();
});

export const Spec = mongoose.model<ISpec>("Spec", SpecSchema);