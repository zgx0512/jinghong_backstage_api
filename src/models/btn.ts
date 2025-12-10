/* 
整个系统的按钮模型
 */

import mongoose from "mongoose";


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

// 在保存时自动生成id（与菜单共用一套自增ID）
btnSchema.pre("save", async function (next) {
  if (!this.isNew) {
    return next();
  }

  try {
    const MenuModel = mongoose.models.Menu as mongoose.Model<any> | undefined;
    const BtnModel = mongoose.models.Btn as mongoose.Model<any> | undefined;

    const [maxMenuDoc, maxBtnDoc] = await Promise.all([
      MenuModel
        ? MenuModel.findOne().sort({ menuId: -1 }).select("menuId").lean()
        : null,
      BtnModel
        ? BtnModel.findOne().sort({ btnId: -1 }).select("btnId").lean()
        : null,
    ]);

    const baseId = 10000;
    const maxMenuId = (maxMenuDoc as any)?.menuId ?? baseId;
    const maxBtnId = (maxBtnDoc as any)?.btnId ?? baseId;
    const nextId = Math.max(maxMenuId, maxBtnId) + 1;

    this.btnId = nextId;
    next();
  } catch (error) {
    next(error as any);
  }
});

export const Btn = mongoose.model<IBtn>("Btn", btnSchema);
