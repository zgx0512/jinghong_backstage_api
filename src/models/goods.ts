import mongoose from "mongoose";
// 引入自增ID方法
import { getNextSequence } from "./counter";

// 定义商品模型的ts类型
interface IGoods extends mongoose.Document {
  goods_id: number;
  tm_id?: number; // 品牌ID - 改为number类型
  goods_name: string;
  note: string; // 备注
  category_id: number;
  is_onsale: number; // 上架状态
  is_delete: number; // 删除状态
  sales_num: number; // 销量
  stock: number; // 总库存
  image_list: string[]; // 图片URL数组
  service_labels: string; // 服务标签
  goods_labels: string; // 商品标签
  delivery_promise_type: number; // 配送承诺类型
  create_time: Date;
  update_time: Date;
}

// 定义商品模型Schema
const goodsSchema = new mongoose.Schema<IGoods>({
  goods_id: { type: Number, unique: true },
  tm_id: { type: Number }, // 改为Number类型
  goods_name: { type: String, required: true },
  note: { type: String, required: false },
  category_id: { type: Number, required: true },
  is_onsale: { type: Number, required: true },
  is_delete: { type: Number, required: false, default: 0 },
  sales_num: { type: Number, required: true },
  stock: { type: Number, required: true, default: 0 }, // 总库存
  image_list: { type: [String], required: true },
  service_labels: { type: String, required: false }, // 服务标签
  goods_labels: { type: String, required: false }, // 商品标签
  delivery_promise_type: { type: Number, required: false }, // 配送承诺类型
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
