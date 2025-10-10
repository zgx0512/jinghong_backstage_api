import mongoose from "mongoose";
import { getNextSequence } from "./counter";

// 定义商品SKU模型的ts类型
interface IGoodsSku extends mongoose.Document {
  sku_id: number;
  goods_id: number; // 关联商品ID
  is_default: number; // 是否默认SKU (0/1)
  min_group_price: mongoose.Types.Decimal128; // 最低团购价
  min_normal_price: mongoose.Types.Decimal128; // 最低正常价
  out_sku_sn: string; // 外部SKU编号
  spec?: any[]; // 规格信息（可选）
  create_time: Date;
  update_time: Date;
}

// 定义商品SKU的Schema
const goodsSkuSchema = new mongoose.Schema<IGoodsSku>({
  sku_id: { type: Number, unique: true, sparse: true },
  goods_id: { type: Number, required: true },
  is_default: { type: Number, required: true, default: 0 },
  min_group_price: { type: mongoose.Schema.Types.Decimal128, required: true },
  min_normal_price: { type: mongoose.Schema.Types.Decimal128, required: true },
  out_sku_sn: { type: String, required: false, default: "" },
  spec: { type: [mongoose.Schema.Types.Mixed], default: [] },
  create_time: {
    type: Date,
    default: () => new Date(Date.now() + 8 * 60 * 60 * 1000),
  },
  update_time: {
    type: Date,
    default: () => new Date(Date.now() + 8 * 60 * 60 * 1000),
  },
});

// 添加索引
goodsSkuSchema.index({ goods_id: 1 });
goodsSkuSchema.index(
  { goods_id: 1, is_default: 1 },
  { unique: true, partialFilterExpression: { is_default: 1 } }
);

goodsSkuSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      this.sku_id = await getNextSequence("sku_id");
    } catch (error) {
      throw error;
    }
  }
  this.update_time = new Date(Date.now() + 8 * 60 * 60 * 1000);
  next();
});

export const GoodsSku = mongoose.model<IGoodsSku>("GoodsSku", goodsSkuSchema);