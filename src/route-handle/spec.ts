import { Request, Response, NextFunction } from "express";
import Spec from "../models/spec";
import dayjs from "dayjs";

// 获取规格类型列表
export const getSpecList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const specList = await Spec.find().sort({ createTime: -1 });
    res.send({
      code: 200,
      data: specList,
      message: "获取规格类型列表成功",
    });
  } catch (error) {
    next(error);
  }
};

// 新增规格类型
export const addSpec = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { spec_name } = req.body;
    if (!spec_name) {
      res.send({
        code: 400,
        data: null,
        message: "规格类型名称不能为空",
      });
      return;
    }
    // 判断输入的规格名称是否已存在
    const spec = await Spec.findOne({ spec_name });
    if (spec) {
      res.send({
        code: 400,
        data: null,
        message: "规格类型名称已存在",
      });
      return;
    }
    // 不存在，则新增
    await Spec.create({ spec_name });
    res.send({
      code: 200,
      data: null,
      message: "新增规格类型成功",
    });
  } catch (error) {
    next(error);
  }
};
