/* 菜单路由的回调方法 */

import { Response, Request } from "express";
import { Menu } from "../models/menu";
import dayjs from "dayjs";
// 获取菜单列表(树形结构)
export const getMenuList = async (req: Request, res: Response) => {
  try {
    // 获取所有菜单
    const menus = await Menu.find().sort({ createTime: -1 });

    // 将菜单转换为树形结构
    const buildMenuTree: any = (parentId: number | null = null) => {
      return menus
        .filter((menu) => menu.parentId === parentId)
        .map((menu) => ({
          id: menu.menuId,
          menuName: menu.menuName,
          menuPath: menu.menuPath,
          menuIcon: menu.menuIcon,
          parentId: menu.parentId,
          acl: menu.acl,
          level: menu.level,
          createTime: dayjs(menu.createTime)
            .subtract(8, "hour")
            .format("YYYY-MM-DD HH:mm:ss"),
          updateTime: dayjs(menu.updateTime)
            .subtract(8, "hour")
            .format("YYYY-MM-DD HH:mm:ss"),
          children: buildMenuTree(menu.menuId),
        }));
    };

    // 生成树形结构
    const menuTree = buildMenuTree();

    res.send({
      code: 200,
      data: menuTree,
      message: "获取菜单列表成功",
    });
  } catch (error) {
    res.status(500).send({
      code: 500,
      data: null,
      message: "获取菜单列表失败",
    });
  }
};

// 新增菜单路由
export const addMenu = async (req: Request, res: Response) => {
  const { menuName, parentId, menuIcon, menuPath } = req.body;
  try {
    const existingMenu = await Menu.findOne({
      $or: [{ menuName }, { menuPath }],
    });
    if (existingMenu) {
      // 菜单名称或路径已存在
      res.send({
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
