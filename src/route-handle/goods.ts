import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { Goods } from "../models/goods";
import { GoodsSku } from "../models/goodsSku";
import { Classify } from "../models/classify";
import dayjs from "dayjs";

// 获取商品列表
export const getGoodsList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category_id, page = 1, limit = 10 } = req.query;

    const filter: any = { is_delete: 0 };
    if (category_id) {
      filter.category_id = Number(category_id);
    }

    const goodsList = await Goods.find(filter)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort({ create_time: -1 })
      .lean();

    const total = await Goods.countDocuments(filter);

    // 获取每个商品的默认SKU价格
    const goodsListData = await Promise.all(
      goodsList.map(async (item) => {
        // 查找默认SKU
        const defaultSku = await GoodsSku.findOne({
          goods_id: item.goods_id,
          is_default: 1,
        }).lean();

        // 如果没有默认SKU，取第一个SKU
        const sku =
          defaultSku ||
          (await GoodsSku.findOne({
            goods_id: item.goods_id,
          }).lean());

        return {
          goods_id: item.goods_id,
          goods_name: item.goods_name,
          note: item.note,
          sales_num: item.sales_num,
          stock: item.stock,
          is_onsale: item.is_onsale,
          image_list: item.image_list,
          min_group_price: sku ? sku.min_group_price.toString() : "0",
          min_normal_price: sku ? sku.min_normal_price.toString() : "0",
          category_id: item.category_id,
          create_time: dayjs(item.create_time)
            .subtract(8, "hour")
            .format("YYYY-MM-DD HH:mm:ss"),
          update_time: dayjs(item.update_time)
            .subtract(8, "hour")
            .format("YYYY-MM-DD HH:mm:ss"),
        };
      })
    );

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

// 安全转换数字的辅助函数
const safeParseNumber = (value: any): number | undefined => {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  const num = Number(value);
  return isNaN(num) ? undefined : num;
};

// 创建商品
export const createGoods = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      category_id,
      goods_name,
      note,
      sales_num,
      is_onsale,
      tm_id,
      sku_list,
      image_list,
      service_labels,
      goods_labels,
      delivery_promise_type,
    } = req.body;

    // 1. 创建商品基本信息
    const goods = new Goods({
      category_id: safeParseNumber(category_id),
      goods_name,
      note,
      sales_num: safeParseNumber(sales_num) || 0,
      stock: 0, // 初始库存为0，后续根据SKU计算
      is_onsale: safeParseNumber(is_onsale) || 0,
      tm_id: safeParseNumber(tm_id),
      image_list: image_list || [],
      service_labels: service_labels,
      goods_labels: goods_labels,
      delivery_promise_type: safeParseNumber(delivery_promise_type),
    });

    await goods.save();

    // 2. 创建SKU和规格数据
    if (sku_list && sku_list.length > 0) {
      for (const skuData of sku_list) {
        // 创建SKU
        const sku = new GoodsSku({
          goods_id: goods.goods_id,
          is_default: Number(skuData.is_default),
          min_group_price: mongoose.Types.Decimal128.fromString(
            skuData.min_group_price.toString()
          ),
          min_normal_price: mongoose.Types.Decimal128.fromString(
            skuData.min_normal_price.toString()
          ),
          out_sku_sn: skuData.out_sku_sn || "",
          spec: Array.isArray(skuData.spec) ? skuData.spec : [],
        });

        await sku.save();
      }
    }

    res.send({
      code: 200,
      data: {
        goods_id: goods.goods_id,
      },
      message: "创建商品成功",
    });
  } catch (error) {
    next(error);
  }
};

// 获取商品详情
export const getGoodsDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { goods_id } = req.query;

    // 获取商品基本信息
    const goods = await Goods.findOne(
      { goods_id: Number(goods_id), is_delete: 0 },
      { _id: 0 } // 排除 _id 字段
    ).lean();

    if (!goods) {
      res.send({
        code: 404,
        data: null,
        message: "商品不存在",
      });
      return;
    }

    // 获取商品SKU列表
    const skuList = await GoodsSku.find(
      {
        goods_id: Number(goods_id),
      },
      { _id: 0 } // 排除 _id 字段
    ).lean();

    // 处理SKU价格格式
    const skuListWithSpec = skuList.map((sku) => ({
      ...sku,
      min_group_price: sku.min_group_price.toString(),
      min_normal_price: sku.min_normal_price.toString(),
    }));

    const goodsDetail = {
      ...goods,
      sku_list: skuListWithSpec,
      create_time: dayjs(goods.create_time)
        .subtract(8, "hour")
        .format("YYYY-MM-DD HH:mm:ss"),
      update_time: dayjs(goods.update_time)
        .subtract(8, "hour")
        .format("YYYY-MM-DD HH:mm:ss"),
    };

    res.send({
      code: 200,
      data: goodsDetail,
      message: "获取商品详情成功",
    });
  } catch (error) {
    next(error);
  }
};

// 更新商品
export const updateGoods = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { goods_id } = req.body;
    const updateData = req.body;

    // 处理数字字段的安全转换
    const processedUpdateData: any = {
      ...updateData,
      update_time: new Date(Date.now() + 8 * 60 * 60 * 1000),
    };

    // 安全转换数字字段
    if (updateData.category_id !== undefined) {
      processedUpdateData.category_id = safeParseNumber(updateData.category_id);
    }
    if (updateData.sales_num !== undefined) {
      processedUpdateData.sales_num = safeParseNumber(updateData.sales_num);
    }
    if (updateData.is_onsale !== undefined) {
      processedUpdateData.is_onsale = safeParseNumber(updateData.is_onsale);
    }
    if (updateData.tm_id !== undefined) {
      processedUpdateData.tm_id = safeParseNumber(updateData.tm_id);
    }
    if (updateData.stock !== undefined) {
      processedUpdateData.stock = safeParseNumber(updateData.stock);
    }
    if (updateData.delivery_promise_type !== undefined) {
      processedUpdateData.delivery_promise_type = safeParseNumber(
        updateData.delivery_promise_type
      );
    }

    // 更新商品基本信息
    const goods = await Goods.findOneAndUpdate(
      { goods_id: Number(goods_id), is_delete: 0 },
      processedUpdateData,
      { new: true }
    );

    if (!goods) {
      res.send({
        code: 404,
        data: null,
        message: "商品不存在",
      });
      return;
    }

    // 如果有SKU数据更新，需要重新处理SKU和规格
    if (updateData.sku_list) {
      // 删除原有SKU数据
      await GoodsSku.deleteMany({ goods_id: Number(goods_id) });

      // 重新创建SKU和规格数据
      for (const skuData of updateData.sku_list) {
        const sku = new GoodsSku({
          goods_id: Number(goods_id),
          is_default: safeParseNumber(skuData.is_default) || 0,
          min_group_price: mongoose.Types.Decimal128.fromString(
            skuData.min_group_price.toString()
          ),
          min_normal_price: mongoose.Types.Decimal128.fromString(
            skuData.min_normal_price.toString()
          ),
          out_sku_sn: skuData.out_sku_sn || "",
          spec: Array.isArray(skuData.spec) ? skuData.spec : [],
        });

        await sku.save();
      }
    }

    res.send({
      code: 200,
      data: null,
      message: "更新商品成功",
    });
  } catch (error) {
    next(error);
  }
};

// 删除商品（软删除）
export const deleteGoods = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { goods_id } = req.params;

    const goods = await Goods.findOneAndUpdate(
      { goods_id: Number(goods_id), is_delete: 0 },
      {
        is_delete: 1,
        update_time: new Date(Date.now() + 8 * 60 * 60 * 1000),
      },
      { new: true }
    );

    if (!goods) {
      res.send({
        code: 404,
        data: null,
        message: "商品不存在",
      });
      return;
    }

    res.send({
      code: 200,
      data: null,
      message: "删除商品成功",
    });
  } catch (error) {
    next(error);
  }
};

// 根据商品id获取对应的sku列表
export const getGoodsSkuList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { goods_id } = req.query;
    const skuList = await GoodsSku.find(
      { goods_id: Number(goods_id) },
      { _id: 0 }
    ).lean(); // 排除 _id 字段
    // 处理SKU价格格式
    const skuListWithSpec = skuList.map((sku) => ({
      ...sku,
      min_group_price: sku.min_group_price.toString(),
      min_normal_price: sku.min_normal_price.toString(),
      create_time: dayjs(sku.create_time)
        .subtract(8, "hour")
        .format("YYYY-MM-DD HH:mm:ss"),
      update_time: dayjs(sku.update_time)
        .subtract(8, "hour")
        .format("YYYY-MM-DD HH:mm:ss"),
    }));
    res.send({
      code: 200,
      data: skuListWithSpec,
      message: "获取商品SKU列表成功",
    });
  } catch (error) {
    next(error);
  }
};

// 修改商品的归属分类
export const updateGoodsCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { goods_id, category_id } = req.body;

    // 1. 校验输入参数
    if (!goods_id || !category_id) {
      // 使用 400 Bad Request 状态码表示客户端请求错误
      res.send({
        code: 400,
        data: null,
        message: "缺少必要的参数: goods_id 或 category_id",
      });
      return;
    }

    // 2. 校验目标分类是否存在
    const categoryExists = await Classify.findOne({
      id: Number(category_id),
    });

    if (!categoryExists) {
      // 使用 404 Not Found 状态码
      res.status(404).send({
        code: 404,
        data: null,
        message: "目标分类不存在",
      });
      return;
    }

    // 3. 执行更新
    const goods = await Goods.findOneAndUpdate(
      { goods_id: Number(goods_id), is_delete: 0 },
      { category_id: Number(category_id) },
      { new: true }
    );

    if (!goods) {
      // 使用 404 Not Found 状态码
      res.status(404).send({
        code: 404,
        data: null,
        message: "商品不存在",
      });
      return;
    }

    res.send({
      code: 200,
      data: null,
      message: "修改商品归属分类成功",
    });
  } catch (error) {
    next(error);
  }
};
