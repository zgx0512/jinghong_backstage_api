import mongoose from "mongoose";
// 引入自增ID方法
import { getNextSequence } from "./counter";

// sku的ts类型
interface ISku extends mongoose.Document {
  sku_id: number;
  sku_name: string;
  sku_thumb_url: string; // 规格图片
  min_group_price: number; // 最低价
  min_normal_price: number; // 划线价
  is_default: number; // 是否默认规格
  stock_num: number; // 库存
  spec: {
    spec_id: number;
    spec_name: string;
    spec_value: string;
    is_add_thumb: number; // 是否添加图片
  }[];
}

// 定义商品模型的ts类型
interface IGoods extends mongoose.Document {
  goods_id: number;
  tm_id: string; // 品牌ID
  goods_name: string;
  min_normal_price: number; // 划线价
  min_group_price: number; // 最低价
  note: string; // 备注
  category_id: number;
  is_onsale: number; // 上架状态
  is_delete: number; // 删除状态
  sales_num: number; // 销量
  goods_thumbnail_url: string; // 商品主图
  image_list: string[];
  sku_list: ISku[];
  create_time: Date;
  update_time: Date;
}

// 定义SKU的Schema
const skuSchema = new mongoose.Schema<ISku>({
  sku_id: { type: Number, unique: true },
  sku_name: { type: String, required: true },
  sku_thumb_url: { type: String, required: false, default: "" }, // 规格图片
  min_group_price: { type: Number, required: true }, // 最低价
  min_normal_price: { type: Number, required: true }, // 划线价
  is_default: { type: Number, required: true, default: 0 }, // 是否默认规格
  stock_num: { type: Number, required: true }, // 库存
  spec: {
    spec_id: { type: Number, unique: true },
    spec_name: { type: String, required: true },
    spec_value: { type: String, required: true },
    is_add_thumb: { type: Number, required: true }, // 是否添加图片
  },
});

// 定义商品模型Schema
const goodsSchema = new mongoose.Schema<IGoods>({
  goods_id: { type: Number, unique: true },
  tm_id: { type: String, required: true },
  goods_name: { type: String, required: true },
  min_normal_price: { type: Number, required: true },
  min_group_price: { type: Number, required: true },
  note: { type: String, required: false },
  category_id: { type: Number, required: true },
  is_onsale: { type: Number, required: true },
  is_delete: { type: Number, required: false, default: 0 },
  sales_num: { type: Number, required: true },
  goods_thumbnail_url: { type: String, required: false, default: "" },
  image_list: { type: [String], required: true },
  sku_list: { type: [skuSchema], required: true },
  create_time: {
    type: Date,
    default: () => new Date(Date.now() + 8 * 60 * 60 * 1000),
  },
  update_time: {
    type: Date,
    default: () => new Date(Date.now() + 8 * 60 * 60 * 1000),
  },
});

goodsSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      this.goods_id = await getNextSequence("goods_id");
    } catch (error) {
      throw error;
    }
  }
  next();
});

export const Goods = mongoose.model<IGoods>("Goods", goodsSchema);
