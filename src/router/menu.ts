/* 菜单路由 */

import { Router } from "express";
import { addMenu, getMenuList, getMenuListByLevel } from "../route-handle/menu";

const router = Router();

// 菜单列表
router.get("/getMenuList", getMenuList);

// 根据level获取上一级菜单
router.get("/getMenuByLevel", getMenuListByLevel);

// 新增菜单
router.post("/addMenu", addMenu);

export default router;
