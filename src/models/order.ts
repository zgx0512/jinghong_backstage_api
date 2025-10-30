// 订单模型
import mongoose from "mongoose";

// 引入自增ID的公共方法
import { getNextSequence } from "./counter";

// 定义订单模型的ts类型
export interface IOrder extends mongoose.Document {
  c_user_id: number; // 用户id
  order_id: string; // 订单号
  order_status: number | string; // 订单状态
  after_sale_status: number | string; // 售后状态
  goods_id: number; // 商品id
  goods_name: string; // 商品名称
  goods_price: number; // 商品价格
  goods_num: number; // 商品数量
  goods_image: string; // 商品图片
  spec: string; // 商品规格
  min_group_price: number; // 实付金额
  recipient_name: string; // 收货人姓名
  recipient_phone: string; // 收货人电话
  recipient_address: string; // 收货人地址
  recipient_city: string; // 收货人城市
  recipient_province: string; // 收货人省份
  recipient_postal_code: string; // 收货人邮编
  create_time: Date; // 下单时间
  pay_time: Date; // 支付时间
}

// 定义订单模型的schema
const OrderSehema = new mongoose.Schema<IOrder>({
  c_user_id: { type: Number, required: true }, // 用户id
  order_id: { type: String, unique: true, required: true },
  order_status: { type: Number, default: 0 }, // 订单状态 0-待付款 1-待发货 2-待收货 3-已完成 4-已取消
  after_sale_status: { type: Number, default: 0 }, // 售后状态 0-无售后 1-售后中 2-售后完成 3-售后关闭
  goods_id: { type: Number, required: true },
  goods_name: { type: String, required: true },
  goods_price: { type: Number, required: true },
  goods_num: { type: Number, required: true },
  goods_image: { type: String, required: true },
  spec: { type: String, required: true },
  min_group_price: { type: Number, required: true },
  recipient_name: { type: String, required: true },
  recipient_phone: { type: String, required: true },
  recipient_address: { type: String, required: true },
  recipient_city: { type: String, required: true },
  recipient_province: { type: String, required: true },
  recipient_postal_code: { type: String, required: true },
  create_time: {
    type: Date,
    default: () => new Date(Date.now() + 8 * 60 * 60 * 1000),
  },
  pay_time: {
    type: Date,
    default: () => new Date(Date.now() + 8 * 60 * 60 * 1000),
  },
});

// 在保存时自动生成订单号，通过创建时间和从10000开始的序号
OrderSehema.pre("save", async function (next) {
  if (!this.isNew || this.order_id) return next();
  try {
    const now = new Date(Date.now() + 8 * 60 * 60 * 1000); // 东8区
    const yyyy = String(now.getUTCFullYear());
    const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(now.getUTCDate()).padStart(2, "0");
    const HH = String(now.getUTCHours()).padStart(2, "0");
    const MM = String(now.getUTCMinutes()).padStart(2, "0");
    const SS = String(now.getUTCSeconds()).padStart(2, "0");

    const seq = await getNextSequence("order_id");

    const orderNoStr = `${yyyy}${mm}${dd}${HH}${MM}${SS}${seq}`;
    this.order_id = String(orderNoStr); // 如需字符串，字段用 String 类型更安全
  } catch (error) {
    throw error;
  }

  next();
});

// 导出模型
export const Order = mongoose.model<IOrder>("Order", OrderSehema);
