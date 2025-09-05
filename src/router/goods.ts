import { Router } from "express";
import { getGoodsList } from "../route-handle/goods";

const router = Router();

router.get("/getGoodsList", getGoodsList);

export default router;
