import { NextFunction, Request, Response } from "express";
import { Trademark } from "@/models/trademark";
import dayjs from "dayjs";

// 获取品牌列表——分页
export const getTrademarkList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 10, name } = req.query;
    const queryCondition = name
      ? { name: { $regex: name, $options: "i" } }
      : {};
    const trademarkList = await Trademark.find(queryCondition)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort({
        createTime: -1,
      })
      .lean();
    const total = await Trademark.countDocuments(queryCondition);
    const list = trademarkList.map((item) => ({
      ...item,
      createTime: dayjs(item.createTime)
        .subtract(8, "hour")
        .format("YYYY-MM-DD HH:mm:ss"),
      updateTime: dayjs(item.updateTime)
        .subtract(8, "hour")
        .format("YYYY-MM-DD HH:mm:ss"),
    }));
    res.send({
      code: 200,
      data: {
        trademarkList: list,
        total,
        page: Number(page),
        page_size: Number(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// 获取所有品牌列表
export const getAllTrademarkList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const trademarkList = await Trademark.find()
      .sort({
        createTime: 1,
      })
      .lean();
    const list = trademarkList.map((item) => ({
      ...item,
      createTime: dayjs(item.createTime)
        .subtract(8, "hour")
        .format("YYYY-MM-DD HH:mm:ss"),
      updateTime: dayjs(item.updateTime)
        .subtract(8, "hour")
        .format("YYYY-MM-DD HH:mm:ss"),
    }));
    res.send({
      code: 200,
      data: list,
      message: "获取所有品牌列表成功",
    });
  } catch (error) {
    next(error);
  }
};

// 添加品牌
export const addTrademark = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tmName, logoUrl } = req.body;
    if (!tmName || !logoUrl) {
      res.send({
        code: 400,
        data: null,
        message: "参数错误",
      });
      return;
    }
    const trademark = await Trademark.findOne({ tmName });
    if (trademark) {
      res.send({
        code: 400,
        data: null,
        message: "品牌已存在",
      });
      return;
    }
    // 创建品牌
    await Trademark.create({
      tmName,
      logoUrl,
    });
    res.send({
      code: 200,
      data: null,
      message: "添加品牌成功",
    });
  } catch (error) {
    next(error);
  }
};

// 修改品牌
export const updateTrademark = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id, tmName, logoUrl } = req.body;
    if (!tmName || !logoUrl) {
      res.send({
        code: 400,
        data: null,
        message: "参数错误",
      });
      return;
    }
    // 查看修改的品牌名称是否已存在, 不包括自身
    const trademark = await Trademark.findOne({
      tmName,
      id: { $ne: id },
    });
    if (trademark) {
      res.send({
        code: 400,
        data: null,
        message: "品牌已存在",
      });
      return;
    }
    // 更新品牌
    await Trademark.updateOne(
      { id },
      {
        tmName,
        logoUrl,
        updateTime: Date.now(),
      }
    );
    res.send({
      code: 200,
      data: null,
      message: "修改品牌成功",
    });
  } catch (error) {
    next(error);
  }
};

// 删除品牌
export const deleteTrademark = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    // 删除品牌
    await Trademark.deleteOne({ id });
    res.send({
      code: 200,
      data: null,
      message: "删除品牌成功",
    });
  } catch (error) {
    next(error);
  }
}