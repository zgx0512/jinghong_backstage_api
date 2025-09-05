// 规格类型模型
import mongoose from "mongoose";

import { getNextSequence } from "./counter";

// 定义规格类型模型接口类型
interface ISpec extends mongoose.Document {
  spec_name: string;
  spec_id: number;
  create_time: Date;
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
  create_time: {
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
  next();
});

const Spec = mongoose.model<ISpec>("Spec", SpecSchema);

export default Spec;
