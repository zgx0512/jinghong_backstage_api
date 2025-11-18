import { Router } from "express";

import { getOrderList, getOrderDetail } from "../route-handle/order";

const router = Router();

// 获取订单列表
router.get("/order-list", getOrderList);

// 获取订单详情
router.get("/getOrderDetail", getOrderDetail);

export default router;