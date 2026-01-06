import { Router } from "express";
import { getDataOverview, getTrendAnalysis, getCategorySales, getRealTimeData } from "../route-handle/analysis";

const router = Router();

// 数据概览
router.get("/getDataOverview", getDataOverview);
// 趋势分析
router.get("/getTrendAnalysis", getTrendAnalysis);
// 商品类目销售饼图
router.get("/getCategorySales", getCategorySales);
// 实时订单数据
router.get("/getRealTimeData", getRealTimeData);

export default router;