import { Request, Response, NextFunction } from "express";
import { Goods } from "../models/goods";
import dayjs from "dayjs";

// 获取商品列表
export const getGoodsList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category_id, page, limit } = req.query;
    const goodsList = await Goods.find({ category_id })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort({ createTime: -1 })
      .lean();
    const total = await Goods.countDocuments({ category_id });
    const goodsListData = goodsList.map((item) => ({
      goods_id: item.goods_id,
      goods_name: item.goods_name,
      note: item.note,
      min_group_price: item.min_group_price,
      sales_num: item.sales_num,
      is_onsale: item.is_onsale,
      goods_thumbnail_url: item.goods_thumbnail_url,
      create_time: dayjs(item.create_time)
        .subtract(8, "hour")
        .format("YYYY-MM-DD HH:mm:ss"),
      update_time: dayjs(item.update_time)
        .subtract(8, "hour")
        .format("YYYY-MM-DD HH:mm:ss"),
    }));
    res.send({
      code: 200,
      data: {
        goods_list: goodsListData,
        page: Number(page),
        page_size: Number(limit),
        total,
      },
      message: "获取商品列表成功",
    });
  } catch (error) {
    next(error);
  }
};
