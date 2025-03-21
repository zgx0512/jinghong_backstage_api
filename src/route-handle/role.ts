/* 
角色路由的方法
 */

import { Request, Response } from 'express';

// 新增路由
export const addRole = (req: Request, res: Response) => {
  // 处理新增角色的逻辑
  res.send('新增角色');
}