/* 
计数器模型
 */

import mongoose from "mongoose";

const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // 计数器标识符
  seq: { type: Number, default: 10000 }, // 计数器初始值
});

export const Counter = mongoose.model("Counter", CounterSchema);

// 获取自增ID的公共方法
export const getNextSequence = async (
  sequenceName: string
): Promise<number> => {
  try {
    let counter = await Counter.findById(sequenceName);

    if (!counter) {
      counter = await Counter.create({
        _id: sequenceName,
        seq: 10000,
      });
    } else {
      counter = await Counter.findByIdAndUpdate(
        sequenceName,
        { $inc: { seq: 1 } },
        { new: true }
      );
    }

    return counter!.seq;
  } catch (error) {
    console.error(`生成 ${sequenceName} 失败:`, error);
    throw error;
  }
};
