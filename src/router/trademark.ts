import { Router } from "express";
import {
  getTrademarkList,
  addTrademark,
  getAllTrademarkList,
  updateTrademark,
  deleteTrademark,
} from "../route-handle/trademark";

const router = Router();

// 品牌列表——分页
router.get("/getTrademarkList", getTrademarkList);

// 获取所有品牌列表
router.get("/getAllTrademarkList", getAllTrademarkList);

// 新增品牌
router.post("/addTrademark", addTrademark);

// 修改品牌
router.put("/updateTrademark", updateTrademark);

// 删除品牌
router.delete("/deleteTrademark/:id", deleteTrademark);

export default router;
