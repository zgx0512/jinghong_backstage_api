/* 
菜单模型
 */
import mongoose from "mongoose";
// 引入ID自增方法
import { getNextSequence } from "./counter";

// 定义菜单模型接口类型
export interface IMenu extends mongoose.Document {
  menuId: number; // 菜单ID
  menuName: string; // 菜单名称
  menuIcon: string; // 菜单图标
  menuPath: string; // 菜单路径
  acl: string; // 权限
  createTime: Date; // 创建时间
  updateTime: Date; // 更新时间
  parentId: number | null; // 父菜单ID
  level: number; // 菜单层级
  isLeaf: boolean; // 是否为叶子节点
  hasBtnsAcl: boolean; // 是否有按钮权限
}

// 定义菜单模型的schema
export const menuSchema = new mongoose.Schema<IMenu>({
  menuId: { type: Number, unique: true },
  menuName: { type: String, required: true, unique: true },
  menuIcon: { type: String, required: true },
  menuPath: { type: String, required: true },
  acl: { type: String, required: true },
  level: { type: Number, required: true },
  parentId: { type: Number, ref: "Menu", required: false, default: null },
  isLeaf: { type: Boolean, default: true },
  hasBtnsAcl: { type: Boolean, default: false },
  createTime: {
    type: Date,
    default: () => new Date(Date.now() + 8 * 60 * 60 * 1000),
  },
  updateTime: {
    type: Date,
    default: () => new Date(Date.now() + 8 * 60 * 60 * 1000),
  },
});

// 在保存菜单时自动生成menuId
menuSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      this.menuId = await getNextSequence("menuId");
    } catch (error) {
      throw error;
    }
  }
  next();
});
// 定义菜单模型
export const Menu = mongoose.model<IMenu>("Menu", menuSchema);
