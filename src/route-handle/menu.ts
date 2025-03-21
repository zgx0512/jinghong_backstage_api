/* 菜单路由的回调方法 */

import { Response, Request } from "express";
import { Menu } from "../models/menu";

// 新增菜单路由
export const addMenu = async (req: Request, res: Response) => {
  const { menuName, parentId, menuIcon, menuPath } = req.body;
  try {
    const existingMenu = await Menu.findOne({
      $or: [{ menuName }, { menuPath }],
    });
    if (existingMenu) {
      // 菜单名称或路径已存在
      res.status(409).send({
        code: 409,
        data: null,
        message: "菜单名称或路径已存在",
      });
      return;
    }
    // 不存在，存储到Menu模型中
    await Menu.create({
      menuName,
      parentId,
      menuIcon,
      menuPath,
    });
    res.send({
      code: 200,
      data: null,
      message: "菜单新增成功",
    });
  } catch (error) {
    throw error;
  }
};
