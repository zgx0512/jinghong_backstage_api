import { Request, Response, NextFunction } from "express";
import { Order } from "../models/order";
import dayjs from "dayjs";

// 获取订单列表
export const getOrderList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    // 获取所有订单，按创建时间降序排序
    const orders = await Order.find()
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort({ create_time: -1 })
      .lean(); // lean()方法将Mongoose文档转换为普通的JavaScript对象
    const total = await Order.countDocuments(); // 获取订单总数
    const orderList = orders.map((order) => ({
      ...order,
      create_time: dayjs(order.create_time).format("YYYY-MM-DD HH:mm:ss"),
      pay_time: dayjs(order.pay_time).format("YYYY-MM-DD HH:mm:ss"),
    }));
    res.send({
      code: 200,
      message: "获取订单列表成功",
      data: {
        list: orderList,
        total: total,
        page: Number(page),
        page_size: Number(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};