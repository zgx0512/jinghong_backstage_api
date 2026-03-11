import { Request, Response, NextFunction } from "express";
import { MockOrder } from "../models/mockOrder";
import dayjs from "dayjs";

// 获取订单列表
export const getOrderList = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      page = 1,
      limit = 10,
      order_id,
      order_status,
      after_sale_status,
      goods,
      spec,
      recipient_name,
      recipient_phone,
      express_no,
      create_time,
      pay_time,
    } = req.query as Record<string, any>;

    // 将筛选条件下推到数据库查询层
    const filter: any = {};

    if (order_id) filter.order_id = String(order_id);

    if (after_sale_status !== undefined && after_sale_status !== "") {
      const s = Number(after_sale_status);
      filter.after_sale_status = Number.isNaN(s) ? after_sale_status : s;
    }

    if (order_status !== undefined && order_status !== "") {
      const s = Number(order_status);
      filter.order_status = Number.isNaN(s) ? order_status : s;
    }

    if (recipient_phone) filter.recipient_phone = String(recipient_phone);

    if (express_no) filter.express_no = String(express_no);

    if (goods) {
      const n = Number(goods);
      if (!Number.isNaN(n)) {
        filter.goods_id = n;
      } else {
        filter.goods_name = { $regex: String(goods), $options: "i" };
      }
    }
    if (spec) {
      filter.spec = { $regex: String(spec), $options: "i" };
    }

    if (recipient_name) {
      filter.recipient_name = { $regex: String(recipient_name), $options: "i" };
    }

    if (create_time) {
      const [rawStart, rawEnd] = String(create_time).split(",");
      const startStr = (rawStart || "").trim();
      const endStr = (rawEnd || rawStart || "").trim();
      if (startStr) {
        // 构建时间范围查询条件，使用正则表达式匹配日期部分
        const startDateFilter = `${startStr} 00:00:00`;
        const endDateFilter = `${endStr} 23:59:59`;
        filter.create_time = { $gte: startDateFilter, $lte: endDateFilter };
      }
    }
    console.log("filter", filter);

    if (pay_time) {
      const [rawStart, rawEnd] = String(pay_time).split(",");
      const startStr = (rawStart || "").trim();
      const endStr = (rawEnd || rawStart || "").trim();
      if (startStr) {
        const startDate = `${startStr} 00:00:00`;
        const endDate = `${endStr} 23:59:59`;
        filter.pay_time = { $gte: startDate, $lte: endDate };
      }
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);

    const [orders, total] = await Promise.all([
      MockOrder.find(filter)
        .sort({ create_time: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      MockOrder.countDocuments(filter),
    ]);

    const orderList = orders.map((order) => ({
      ...order,
      create_time: order.create_time
        ? dayjs(order.create_time).format("YYYY-MM-DD HH:mm:ss")
        : undefined,
      pay_time: order.pay_time
        ? dayjs(order.pay_time).format("YYYY-MM-DD HH:mm:ss")
        : undefined,
    }));

    res.send({
      code: 200,
      message: "获取订单列表成功",
      data: {
        list: orderList,
        total,
        page: pageNum,
        page_size: limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 获取订单详情
export const getOrderDetail = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { order_id } = req.query;
    if (!order_id) {
      res.send({
        code: 400,
        data: null,
        message: "参数错误",
      });
      return;
    }
    // 查找订单号是否存在
    const order = await MockOrder.findOne({ order_id }, { _id: 0 }).lean();
    if (!order) {
      res.send({
        code: 400,
        data: null,
        message: "订单不存在",
      });
      return;
    }
    const orderDetail = {
      ...order,
      create_time: dayjs(order.create_time).format("YYYY-MM-DD HH:mm:ss"),
      pay_time: dayjs(order.pay_time).format("YYYY-MM-DD HH:mm:ss"),
    };
    res.send({
      code: 200,
      message: "获取订单详情成功",
      data: orderDetail,
    });
    return;
  } catch (error) {
    next(error);
  }
};
