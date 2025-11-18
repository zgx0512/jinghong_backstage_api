import { Router } from "express";
import { expressSubscribe, expressPush, getExpressDetail, sendExpress } from "../route-handle/express";

const router = Router();

// 快递100 订阅
router.post("/express/subscribe", expressSubscribe);

// 快递100 推送 按 nu+com+key 做 MD5(大写) 验签
router.post("/webhook/express", expressPush);

// 发货
router.post("/sendExpress", sendExpress);

// 查询轨迹（按需刷新）：如果过期则实时拉取更新后返回
router.get("/getExpressDetail", getExpressDetail);

export default router;
