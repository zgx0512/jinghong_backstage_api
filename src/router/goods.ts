import { Router } from "express";
import {
  getGoodsList,
  createGoods,
  getGoodsDetail,
  updateGoods,
  deleteGoods
} from "../route-handle/goods";

const router = Router();

// 获取商品列表
router.get("/getGoodsList", getGoodsList);
// 添加商品
router.post("/createGoods", createGoods);
// 获取商品详情
router.get("/getGoodsDetail", getGoodsDetail);
// 更新商品
router.post("/updateGoods", updateGoods);
// 删除商品
router.delete("/deleteGoods/:goods_id", deleteGoods)

export default router;
