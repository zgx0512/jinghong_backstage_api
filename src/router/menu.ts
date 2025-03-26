/* 菜单路由 */

import { Router } from "express";
import {
  addMenu,
  getMenuList,
  getMenuListByLevel,
  updateMenu,
  deleteMenu,
} from "../route-handle/menu";

const router = Router();

// 菜单列表
router.get("/getMenuList", getMenuList);

// 根据level获取上一级菜单
router.get("/getMenuByLevel", getMenuListByLevel);

// 新增菜单
router.post("/addMenu", addMenu);

// 更新菜单
router.put("/updateMenu", updateMenu);

// 删除菜单
router.delete("/deleteMenu/:menuId", deleteMenu)

export default router;
