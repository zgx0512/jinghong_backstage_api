import mongoose from "mongoose";

// 子文档类型：单条轨迹
export interface ICheckpoint {
  content: string; // 轨迹内容
  express_name?: string;
  is_received: number;
  op_time: Date;
  op_type: string;
}

// 顶层文档类型：一条运单的追踪
export interface IExpress extends mongoose.Document {
  express_code: string; // 快递公司编码
  express_sn: string; // 快递单号
  status: string; // 轨迹状态
  checkpoints: ICheckpoint[]; // 轨迹数组，按时间降序
  last_updated_time: Date; // 我方最后更新时间
  created_time: Date;
  updated_time: Date;
}

// 轨迹子文档 Schema（不单独生成 _id）
const CheckpointSchema = new mongoose.Schema<ICheckpoint>(
  {
    content: { type: String, required: true },
    express_name: { type: String },
    is_received: { type: Number, default: 0 },
    op_time: {
      type: Date,
      default: () => new Date(Date.now() + 8 * 60 * 60 * 1000),
    },
    op_type: { type: String, required: true },
  },
  { _id: false }
);

const ExpressSchema = new mongoose.Schema<IExpress>({
  express_code: { type: String, required: true },
  express_sn: { type: String, required: true },
  status: { type: String, required: true }, // 轨迹状态
  // 使用子文档数组，满足 TS 对数组元素 Schema 的期望类型
  checkpoints: { type: [CheckpointSchema], default: [] },
  last_updated_time: {
    type: Date,
    default: () => new Date(Date.now() + 8 * 60 * 60 * 1000),
  },
  created_time: {
    type: Date,
    default: () => new Date(Date.now() + 8 * 60 * 60 * 1000),
  },
  updated_time: {
    type: Date,
    default: () => new Date(Date.now() + 8 * 60 * 60 * 1000),
  },
});

// 唯一键：一个承运商下同一运单号唯一
ExpressSchema.index({ express_code: 1, express_sn: 1 }, { unique: true });

export const Express = mongoose.model<IExpress>("express", ExpressSchema);
