/* 菜单路由 */

import { Router } from 'express';
import { addMenu } from "../route-handle/menu"

const router = Router();

// 新增菜单
router.post('/addMenu', addMenu);

export default router;