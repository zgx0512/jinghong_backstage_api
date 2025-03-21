/* 
菜单模型
 */
import mongoose from "mongoose";

// 定义菜单模型接口类型
export interface IMenu extends mongoose.Document {
  menuId: number;
  menuName: string;
  menuIcon: string;
  createTime: Date;
  updateTime: Date;
}

// 定义菜单模型的schema
export const MenuSchema = new mongoose.Schema({
  menuId: { type: Number, required: true, unique: true },
  menuName: { type: String, required: true, unique: true },
  menuIcon: { type: String, required: true },
  createTime: {
    type: Date,
    default: () => new Date(Date.now() + 8 * 60 * 60 * 1000),
  },
  updateTime: {
    type: Date,
    default: () => new Date(Date.now() + 8 * 60 * 60 * 1000),
  },
});

// 定义菜单模型
export const Menu = mongoose.model<IMenu>("Menu", MenuSchema);