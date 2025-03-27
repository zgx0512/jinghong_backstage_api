import { Request, Response, NextFunction } from "express";
import { Btn } from "../models/btn";

export const addBtn = async (req: Request, res: Response, next: NextFunction) => {
  const { btnName, acl, menuId } = req.body;
  try {
    // 判断是否传递了必要参数
    if (!btnName || !acl || !menuId) {
      res.send({
        code: 400,
        message: "参数错误",
        data: null,
      });
      return;
    }
    // 判断当前菜单Id是否存在当前按钮
    const btn = await Btn.findOne({ name: btnName, menuId });
    if (btn) {
      res.send({
        code: 409,
        message: "当前菜单下已存在该按钮",
        data: null,
      });
      return;
    }
    // 不存在, 则新增
    await Btn.create({ name: btnName, acl, menuId });
    res.send({
      code: 200,
      message: "新增按钮成功",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
