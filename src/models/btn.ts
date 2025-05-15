/* 
整个系统的按钮模型
 */

import mongoose from "mongoose";

// 引入自增ID方法
import { getNextSequence } from "./counter";

// 定义按钮模型接口类型
interface IBtn extends mongoose.Document {
  btnId: number;
  name: string;
  acl: string;
  btnIcon: string;
  menuId: number;
  createTime: Date | string;
  updateTime: Date | string;
}

// 定义按钮模型的Schema
const btnSchema = new mongoose.Schema<IBtn>({
  btnId: { type: Number, unique: true }, // id唯一
  name: { type: String, required: true }, // 按钮名称
  acl: { type: String, required: true }, // 按钮ACL
  btnIcon: { type: String, required: false }, // 按钮图标
  menuId: { type: Number, required: true }, // 所属菜单ID
  createTime: {
    type: Date,
    default: new Date(Date.now() + 8 * 60 * 60 * 1000),
  }, // 创建时间
  updateTime: {
    type: Date,
    default: new Date(Date.now() + 8 * 60 * 60 * 1000),
  }, // 更新时间
});

// 在保存时自动生成id
btnSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      this.btnId = await getNextSequence("btnId");
    } catch (error) {
      throw new Error("获取btnId失败");
    }
  }
  next();
});

export const Btn = mongoose.model<IBtn>("Btn", btnSchema);
