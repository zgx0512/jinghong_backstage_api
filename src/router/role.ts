/* 
角色模块的路由
 */

import { Router } from 'express';
// 引入路由处理方法
import { addRole } from '../route-handle/role';


const router = Router();

// 新增角色
router.post('/addRole', addRole);

export default router;