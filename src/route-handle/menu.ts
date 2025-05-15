/* 菜单路由的回调方法 */

import { Response, Request } from "express";
import { Menu } from "../models/menu";
// 引入button路由
import { Btn } from "../models/btn";
import dayjs from "dayjs";
// 获取菜单列表(树形结构)
export const getMenuList = async (req: Request, res: Response) => {
  const { type } = req.query;
  try {
    // 获取所有菜单，按创建时间升序排序
    const menus = await Menu.find().sort({ createTime: 1 });
    // 获取所有的按钮权限
    const btns = await Btn.find();

    // 将菜单转换为树形结构
    const buildMenuTree: any = (parentId: number | null = null) => {
      const menuList = menus.filter((menu) => menu.parentId === parentId);
      const res = menuList.map((menu) => {
        const treeNodes = {
          type: "menu",
          id: menu.menuId,
          name: menu.menuName,
          path: menu.menuPath,
          icon: menu.menuIcon,
          parentId: menu.parentId,
          acl: menu.acl,
          level: menu.level,
          isLeaf: menu.isLeaf,
          hasBtnsAcl: menu.hasBtnsAcl,
          createTime: dayjs(menu.createTime)
            .subtract(8, "hour")
            .format("YYYY-MM-DD HH:mm:ss"),
          updateTime: dayjs(menu.updateTime)
            .subtract(8, "hour")
            .format("YYYY-MM-DD HH:mm:ss"),
          children: buildMenuTree(menu.menuId),
        };
        if (type === "0") {
          if (treeNodes.children.length === 0) {
            // 从按钮权限列表中筛选出当前菜单的按钮权限
            const btnList = btns.filter((btn) => btn.menuId === treeNodes.id);
            const res = btnList.map((btn) => ({
              type: "btn",
              btnId: btn.btnId,
              name: btn.name,
              acl: btn.acl,
              icon: btn.btnIcon,
              parentId: btn.menuId,
              createTime: dayjs(menu.createTime)
                .subtract(8, "hour")
                .format("YYYY-MM-DD HH:mm:ss"),
              updateTime: dayjs(menu.updateTime)
                .subtract(8, "hour")
                .format("YYYY-MM-DD HH:mm:ss"),
            }));
            if (res.length > 0) {
              treeNodes.children = res;
            }
          }
        }
        return treeNodes;
      });
      return res;
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

// 获取归属菜单列表
export const getMenuListByLevel = async (req: Request, res: Response) => {
  const { level } = req.query;
  try {
    // 验证菜单等级
    if (Number(level) <= 1) {
      res.send({
        code: 400,
        data: null,
        message: "一级菜单不需要选择归属菜单",
      });
      return;
    }
    // 查询上一级菜单（等级 = 当前等级 - 1）, 移除掉hasBtnsAcl为true的菜单
    const menus = await Menu.find({
      level: Number(level) - 1,
      hasBtnsAcl: { $ne: true },
    }).sort({ createTime: -1 });
    // 整合要返回的数据
    const menuList = menus.map((menu) => ({
      id: menu.menuId,
      menuName: menu.menuName,
      menuPath: menu.menuPath,
    }));
    res.send({
      code: 200,
      data: menuList,
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
  const { name, parentId, icon, path, level, acl } = req.body;
  try {
    const existingMenu = await Menu.findOne({
      $or: [{ menuName: name }, { menuPath: path }],
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
      menuName: name,
      parentId,
      menuIcon: icon,
      menuPath: path,
      level,
      acl,
    });
    // 如果parentId不为null, 更新parentId对应的菜单的isLeaf字段为false
    if (parentId !== null) {
      await Menu.updateOne({ menuId: parentId }, { isLeaf: false });
    }
    res.send({
      code: 200,
      data: null,
      message: "菜单新增成功",
    });
  } catch (error) {
    throw error;
  }
};

// 更新菜单
export const updateMenu = async (req: Request, res: Response) => {
  const { id, name, parentId, icon, path, level, acl } = req.body;
  try {
    // 判断菜单名称或路径是否已存在（不包括自身）
    const existingMenu = await Menu.findOne({
      $or: [{ menuName: name }, { menuPath: path }],
      menuId: { $ne: id },
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
    // 更新菜单信息
    await Menu.updateOne(
      { menuId: id },
      {
        menuName: name,
        parentId,
        menuIcon: icon,
        menuPath: path,
        level,
        acl,
        updateTime: new Date(Date.now() + 8 * 60 * 60 * 1000),
      }
    );
    res.send({
      code: 200,
      data: null,
      message: "菜单更新成功",
    });
  } catch (error) {
    throw error;
  }
};

// 删除菜单, 将对应的子菜单也一起删除
export const deleteMenu = async (req: Request, res: Response) => {
  const { menuId } = req.params;
  try {
    // 先查询要删除的菜单信息，获取其parentId
    const menuToDelete = await Menu.findOne({ menuId });
    const parentId = menuToDelete?.parentId;
    // 删除当前菜单及其所有子菜单
    await Menu.deleteMany({
      $or: [{ menuId: menuId }, { parentId: menuId }],
    });
    // 如果parentId不为null, 更新parentId对应的菜单的isLeaf字段为true
    if (parentId) {
      const siblingCount = await Menu.countDocuments({ parentId });
      // 如果没有其他子菜单了，将父菜单设置为叶子节点
      if (siblingCount === 0) {
        await Menu.updateOne({ menuId: parentId }, { isLeaf: true });
      }
    }
    res.send({
      code: 200,
      data: null,
      message: "菜单删除成功",
    });
  } catch (error) {
    res.send({
      code: 500,
      data: null,
      message: "菜单删除失败",
    });
  }
};
