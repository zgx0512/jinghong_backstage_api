import { Router } from "express";

import { getOrderList } from "../route-handle/order";

const router = Router();

// 获取订单列表
router.get("/order-list", getOrderList);

export default router;