import { Request, Response, NextFunction } from "express";
import { Btn } from "../models/btn";
import { Menu } from "../models/menu";

// 新增权限按钮
export const addBtn = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { name, acl, menuId, icon } = req.body;
  try {
    // 判断是否传递了必要参数
    if (!name || !acl || !menuId || !icon) {
      res.send({
        code: 400,
        message: "参数错误",
        data: null,
      });
      return;
    }
    // 判断当前菜单Id是否存在当前按钮
    const btn = await Btn.findOne({ name, menuId });
    if (btn) {
      res.send({
        code: 409,
        message: "当前菜单下已存在该按钮",
        data: null,
      });
      return;
    }
    // 不存在, 则新增
    await Btn.create({ name, acl, menuId, btnIcon: icon });
    // 更新数据库中菜单的hasBtnsAcl字段为true
    await Menu.updateOne({ menuId }, { hasBtnsAcl: true });

    res.send({
      code: 200,
      message: "新增按钮成功",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// 更新权限按钮
export const updateBtn = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id, name, acl, menuId, icon} = req.body;
  try {
    // 判断是否传递了必要参数
    if (!id || !name || !acl || !menuId || !icon) {
      res.send({
        code: 400,
        message: "参数错误",
        data: null,
      });
      return;
    }
    // 判断名称是否存在（不包括自身）
    const btn = await Btn.findOne({ name, btnId: { $ne: id } });
    if (btn) {
      res.send({
        code: 409,
        message: "按钮名称已存在",
        data: null,
      });
      return;
    }
    // 不存在, 则更新
    await Btn.updateOne(
      { btnId: id },
      {
        name,
        acl,
        menuId,
        btnIcon: icon,
        updateTime: new Date(Date.now() + 8 * 60 * 60 * 1000),
      }
    );
    res.send({
      code: 200,
      message: "更新按钮成功",
      data: null,
    });
  } catch (error) {
    next(error);
  }
}

// 删除权限按钮
export const removeBtn = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    // 查找当前按钮的菜单Id
    const btn = await Btn.findOne({ btnId: id });
    // 删除当前按钮
    await Btn.deleteOne({ btnId: id });
    // 判断当前菜单下是否还有按钮
    const btns = await Btn.find({ menuId: btn!.menuId });
    if (btns.length <= 0) {
      // 没有按钮, 更新菜单的hasBtnsAcl字段为false
      await Menu.updateOne({ menuId: btn!.menuId }, { hasBtnsAcl: false });
    }
    res.send({
      code: 200,
      message: "删除按钮成功",
      data: null,
    });
  } catch (error) {
    next(error);
  }
}
