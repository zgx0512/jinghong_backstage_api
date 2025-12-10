/* 
角色模型
 */
import mongoose from "mongoose";
// 引入计数器
import { getNextSequence } from "./counter";

// 定义角色模型的类型
export interface IRole extends mongoose.Document {
  roleId: number;
  roleName: string;
  permissions: number[];
  role_ids: number[];
  createTime: Date;
  updateTime: Date;
}

// 定义角色模型的schema
export const roleSchema = new mongoose.Schema<IRole>({
  roleId: { type: Number, unique: true },
  roleName: { type: String, unique: true, required: true },
  permissions: { type: [Number], default: [] },
  role_ids: { type: [Number], default: [] },
  createTime: {
    type: Date,
    default: () => new Date(Date.now() + 8 * 60 * 60 * 1000),
  },
  updateTime: {
    type: Date,
    default: () => new Date(Date.now() + 8 * 60 * 60 * 1000),
  },
});

// 在保存角色前自动生成roleId
roleSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      this.roleId = await getNextSequence("roleId"); 
    } catch (error) {
      console.error(error);
      throw error
    };
  }
  next();
})

// 创建角色模型
export const Role = mongoose.model<IRole>("Role", roleSchema);
