/* 菜单路由 */

import { Router } from 'express';
import { addMenu, getMenuList } from "../route-handle/menu";

const router = Router();

// 菜单列表
router.get('/getMenuList', getMenuList);

// 新增菜单
router.post('/addMenu', addMenu);

export default router;