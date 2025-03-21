/* 
角色路由的方法
 */

import { Request, Response } from "express";
import { Role } from "../models/role";

// 新增路由
export const addRole = async (req: Request, res: Response) => {
  // 处理新增角色的逻辑
  // 判断当前角色是否在角色集合中存在
  const { roleName } = req.body;
  const existingRole = await Role.findOne({ roleName: roleName });
  if (existingRole) {
    // 存在，返回409
    res.status(409).send({
      code: 409,
      message: "角色已存在",
      data: null,
    });
    return;
  }
  // 不存在，新增角色
  await Role.create({
    roleName,
  });
  res.send({
    code: 200,
    message: "角色新增成功",
    data: null,
  });
};
