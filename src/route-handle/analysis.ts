// 导入所需模块
import { Request, Response, NextFunction } from "express";
import { MockOrder } from "../models/mockOrder"; // 根据实际路径调整
import dayjs from "dayjs";
import redisClient from "../config/redis";

// 类型定义
interface DateRange {
  start: Date;
  end: Date;
  startStr: string;
  endStr: string;
}

interface PeriodData {
  orders: any[];
  totalOrders: number;
  totalAmount: number;
  avgOrderPrice: number;
  refundOrders: number;
  refundAmount: number;
  refundRate: number;
  successOrders: number;
  successAmount: number;
}

interface GrowthRates {
  orderCnt: number;
  orderAmount: number;
  avgOrderPrice: number;
  refundOrders: number;
  refundAmount: number;
  refundRate: number;
  successOrders: number;
  successAmount: number;
}

interface OverviewResponse {
  code: number;
  data: {
    // 当前周期数据
    order_cnt: number;
    order_amount: number;
    avg_order_price: number;
    refund_order_cnt: number;
    refund_amount: number;
    refund_rate: number;
    success_order_cnt: number;
    success_amount: number;

    // 环比增长率
    order_cnt_growth_rate: number;
    order_amount_growth_rate: number;
    avg_order_price_growth_rate: number;
    refund_order_cnt_growth_rate: number;
    refund_amount_growth_rate: number;
    refund_rate_growth_rate: number;
    success_order_cnt_growth_rate: number;
    success_amount_growth_rate: number;
  };
  message: string;
}

/**
 * 获取指定日期范围的数据
 */
async function getPeriodData(dateRange: DateRange): Promise<PeriodData> {
  const { start, end } = dateRange;

  const orders = await MockOrder.find({
    pay_time: {
      $gte: start,
      $lte: end,
    },
  })
    .sort({ create_time: -1 })
    .lean();

  const totalOrders = orders.length;
  const totalAmount = orders.reduce(
    (sum, order) => sum + order.min_group_price,
    0
  );

  const refundOrders = orders.filter(
    (order) => order.order_status === 4
  ).length;
  const refundAmount = orders
    .filter((order) => order.order_status === 4)
    .reduce((sum, order) => sum + order.min_group_price, 0);

  const successOrders = totalOrders - refundOrders;
  const successAmount = totalAmount - refundAmount;

  const avgOrderPrice = totalOrders > 0 ? totalAmount / totalOrders : 0;
  const refundRate = totalOrders > 0 ? refundOrders / totalOrders : 0;

  return {
    orders,
    totalOrders,
    totalAmount: Number(totalAmount.toFixed(2)),
    avgOrderPrice: Number(avgOrderPrice.toFixed(2)),
    refundOrders,
    refundAmount: Number(refundAmount.toFixed(2)),
    refundRate: Number(refundRate.toFixed(2)),
    successOrders,
    successAmount: Number(successAmount.toFixed(2)),
  };
}

/**
 * 计算环比增长率
 */
function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) {
    return current === 0 ? 0 : 1.0; // 如果前期为0，当前不为0，则增长率为100%
  }
  return Number(((current - previous) / previous).toFixed(2));
}

/**
 * 计算所有指标的环比增长率
 */
function calculateAllGrowthRates(
  current: PeriodData,
  previous: PeriodData
): GrowthRates {
  return {
    orderCnt: calculateGrowthRate(current.totalOrders, previous.totalOrders),
    orderAmount: calculateGrowthRate(current.totalAmount, previous.totalAmount),
    avgOrderPrice: calculateGrowthRate(
      current.avgOrderPrice,
      previous.avgOrderPrice
    ),
    refundOrders: calculateGrowthRate(
      current.refundOrders,
      previous.refundOrders
    ),
    refundAmount: calculateGrowthRate(
      current.refundAmount,
      previous.refundAmount
    ),
    refundRate: calculateGrowthRate(current.refundRate, previous.refundRate),
    successOrders: calculateGrowthRate(
      current.successOrders,
      previous.successOrders
    ),
    successAmount: calculateGrowthRate(
      current.successAmount,
      previous.successAmount
    ),
  };
}

/**
 * 验证日期参数
 */
function validateDateParams(
  startDateStr?: string,
  endDateStr?: string
): string | null {
  if (!startDateStr || !endDateStr) {
    return "时间不能为空";
  }

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return "时间格式不正确";
  }

  if (startDate > endDate) {
    return "开始时间不能晚于结束时间";
  }

  // 检查时间跨度是否过长（可选）
  const maxDays = 30;
  const daysDiff =
    (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
  if (daysDiff > maxDays) {
    return `查询时间跨度不能超过${maxDays}天`;
  }

  return null;
}

/**
 * 设置日期的开始和结束时间
 */
function setDateBoundaries(date: Date, isStart: boolean): Date {
  const newDate = new Date(date);
  if (isStart) {
    newDate.setHours(0, 0, 0, 0);
  } else {
    newDate.setHours(23, 59, 59, 999);
  }
  return newDate;
}

/**
 * 获取上一个相同周期的时间范围
 */
function getPreviousPeriod(
  startDateStr: string,
  endDateStr: string
): DateRange {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  // 计算当前周期天数（包括开始和结束日）
  const daysInPeriod =
    Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) +
    1;

  // 计算上一个周期的结束日期（当前开始日期的前一天）
  const prevEnd = new Date(startDate);
  prevEnd.setDate(prevEnd.getDate() - 1);

  // 计算上一个周期的开始日期
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - daysInPeriod + 1);

  return {
    start: setDateBoundaries(prevStart, true),
    end: setDateBoundaries(prevEnd, false),
    startStr: prevStart.toISOString().split("T")[0],
    endStr: prevEnd.toISOString().split("T")[0],
  };
}

// 数据概览方法
export const getDataOverview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { start_date, end_date } = req.query;

  try {
    // 验证参数
    const validationError = validateDateParams(
      start_date as string,
      end_date as string
    );

    if (validationError) {
      res.send({
        code: 400,
        data: null,
        message: validationError,
      });
      return;
    }

    const startDateStr = start_date as string;
    const endDateStr = end_date as string;

    // 准备当前周期和上一个周期的时间范围
    const currentPeriod: DateRange = {
      start: setDateBoundaries(new Date(startDateStr), true),
      end: setDateBoundaries(new Date(endDateStr), false),
      startStr: startDateStr,
      endStr: endDateStr,
    };

    const previousPeriod = getPreviousPeriod(startDateStr, endDateStr);

    // 并行查询两个周期的数据
    const [currentData, previousData] = await Promise.all([
      getPeriodData(currentPeriod),
      getPeriodData(previousPeriod),
    ]);

    // 计算环比增长率
    const growthRates = calculateAllGrowthRates(currentData, previousData);

    // 构建响应数据
    const responseData: OverviewResponse = {
      code: 200,
      data: {
        // 当前周期数据
        order_cnt: currentData.totalOrders,
        order_amount: currentData.totalAmount,
        avg_order_price: currentData.avgOrderPrice,
        refund_order_cnt: currentData.refundOrders,
        refund_amount: currentData.refundAmount,
        refund_rate: currentData.refundRate,
        success_order_cnt: currentData.successOrders,
        success_amount: currentData.successAmount,

        // 环比增长率
        order_cnt_growth_rate: growthRates.orderCnt,
        order_amount_growth_rate: growthRates.orderAmount,
        avg_order_price_growth_rate: growthRates.avgOrderPrice,
        refund_order_cnt_growth_rate: growthRates.refundOrders,
        refund_amount_growth_rate: growthRates.refundAmount,
        refund_rate_growth_rate: growthRates.refundRate,
        success_order_cnt_growth_rate: growthRates.successOrders,
        success_amount_growth_rate: growthRates.successAmount,
      },
      message: "获取数据成功",
    };

    res.status(200).send(responseData);
  } catch (error) {
    next(error);
  }
};

// 趋势分析折线图数据
export const getTrendAnalysis = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { start_date, end_date } = req.query;
    // 验证参数
    const validationError = validateDateParams(
      start_date as string,
      end_date as string
    );

    if (validationError) {
      res.send({
        code: 400,
        data: null,
        message: validationError,
      });
      return;
    }
    // 判断是否是单天查询
    const isSingleDay = start_date === end_date;
    if (isSingleDay) {
      // 单天查询，按小时分组
      const hourlyData = await MockOrder.aggregate([
        {
          $match: {
            pay_time: {
              $gte: setDateBoundaries(new Date(start_date as string), true),
              $lte: setDateBoundaries(new Date(end_date as string), false),
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: { date: "$pay_time", timezone: "+08:00" } },
              month: { $month: { date: "$pay_time", timezone: "+08:00" } },
              day: { $dayOfMonth: { date: "$pay_time", timezone: "+08:00" } },
              hour: { $hour: { date: "$pay_time", timezone: "+08:00" } },
            },
            order_cnt: { $sum: 1 },
            order_amount: { $sum: "$min_group_price" },
            refund_order_cnt: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$order_status", 4],
                  },
                  1,
                  0,
                ],
              },
            },
            refund_amount: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$order_status", 4],
                  },
                  "$min_group_price",
                  0,
                ],
              },
            },
            success_order_cnt: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$order_status", 4],
                  },
                  0,
                  1,
                ],
              },
            },
            success_amount: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$order_status", 4],
                  },
                  0,
                  "$min_group_price",
                ],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            date: {
              $dateToString: {
                format: "%Y-%m-%d %H:00:00",
                date: {
                  $dateFromParts: {
                    year: "$_id.year",
                    month: "$_id.month",
                    day: "$_id.day",
                    hour: "$_id.hour",
                  },
                },
              },
            },
            order_cnt: 1,
            order_amount: { $round: ["$order_amount", 2] },
            refund_order_cnt: 1,
            refund_amount: { $round: ["$refund_amount", 2] },
            avg_order_price: {
              $round: [
                {
                  $cond: {
                    if: { $eq: ["$order_cnt", 0] },
                    then: 0,
                    else: { $divide: ["$order_amount", "$order_cnt"] },
                  },
                },
                2,
              ],
            },
            refund_rate: {
              $round: [
                {
                  $cond: {
                    if: { $eq: ["$refund_order_cnt", 0] },
                    then: 0,
                    else: { $divide: ["$refund_order_cnt", "$order_cnt"] },
                  },
                },
                2,
              ],
            },
            success_order_cnt: 1,
            success_amount: {
              $round: ["$success_amount", 2],
            },
          },
        },
        {
          $sort: { date: 1 },
        },
      ]);
      // 将数组转换为以date为key的对象格式
      const hourlyDataObj = hourlyData.reduce((acc, item) => {
        acc[item.date] = {
          order_cnt: item.order_cnt,
          refund_order_cnt: item.refund_order_cnt,
          success_order_cnt: item.success_order_cnt,
          order_amount: item.order_amount,
          refund_amount: item.refund_amount,
          avg_order_price: item.avg_order_price,
          refund_rate: item.refund_rate,
          success_amount: item.success_amount,
        };
        return acc;
      }, {});

      res.send({
        code: 200,
        data: hourlyDataObj,
        message: "获取数据成功",
      });
      return;
    } else {
      // 多天查询，按天分组
      const dailyData = await MockOrder.aggregate([
        {
          $match: {
            pay_time: {
              $gte: setDateBoundaries(new Date(start_date as string), true),
              $lte: setDateBoundaries(new Date(end_date as string), false),
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: { date: "$pay_time", timezone: "+08:00" } },
              month: { $month: { date: "$pay_time", timezone: "+08:00" } },
              day: { $dayOfMonth: { date: "$pay_time", timezone: "+08:00" } },
            },
            order_cnt: { $sum: 1 },
            order_amount: { $sum: "$min_group_price" },
            refund_order_cnt: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$order_status", 4],
                  },
                  1,
                  0,
                ],
              },
            },
            refund_amount: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$order_status", 4],
                  },
                  "$min_group_price",
                  0,
                ],
              },
            },
            success_order_cnt: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$order_status", 4],
                  },
                  0,
                  1,
                ],
              },
            },
            success_amount: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$order_status", 4],
                  },
                  0,
                  "$min_group_price",
                ],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            date: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: {
                  $dateFromParts: {
                    year: "$_id.year",
                    month: "$_id.month",
                    day: "$_id.day",
                  },
                },
              },
            },
            order_cnt: 1,
            order_amount: { $round: ["$order_amount", 2] },
            refund_order_cnt: 1,
            refund_amount: { $round: ["$refund_amount", 2] },
            avg_order_price: {
              $round: [
                {
                  $cond: {
                    if: { $eq: ["$order_cnt", 0] },
                    then: 0,
                    else: { $divide: ["$order_amount", "$order_cnt"] },
                  },
                },
                2,
              ],
            },
            refund_rate: {
              $round: [
                {
                  $cond: {
                    if: { $eq: ["$refund_order_cnt", 0] },
                    then: 0,
                    else: { $divide: ["$refund_order_cnt", "$order_cnt"] },
                  },
                },
                2,
              ],
            },
            success_order_cnt: 1,
            success_amount: {
              $round: ["$success_amount", 2],
            },
          },
        },
        {
          $sort: { date: 1 },
        },
      ]);
      // 将数组转换为以date为key的对象格式
      const dailyDataObj = dailyData.reduce((acc, item) => {
        acc[item.date] = {
          order_cnt: item.order_cnt,
          refund_order_cnt: item.refund_order_cnt,
          success_order_cnt: item.success_order_cnt,
          order_amount: item.order_amount,
          refund_amount: item.refund_amount,
          avg_order_price: item.avg_order_price,
          refund_rate: item.refund_rate,
          success_amount: item.success_amount,
        };
        return acc;
      }, {});
      res.send({
        code: 200,
        data: dailyDataObj,
        message: "获取数据成功",
      });
      return;
    }
  } catch (error) {
    next(error);
  }
};

// 商品类目销售分布图数据
export const getCategorySales = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { start_date, end_date } = req.query;
    // 验证参数
    const validationError = validateDateParams(
      start_date as string,
      end_date as string
    );

    if (validationError) {
      res.send({
        code: 400,
        data: null,
        message: validationError,
      });
      return;
    }
    const dailyData = await MockOrder.aggregate([
      {
        $match: {
          pay_time: {
            $gte: setDateBoundaries(new Date(start_date as string), true),
            $lte: setDateBoundaries(new Date(end_date as string), false),
          },
        },
      },
      {
        $group: {
          _id: "$category",
          order_cnt: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          category_name: {
            $switch: {
              branches: [
                { case: { $eq: ["$_id", 1] }, then: "电子产品" },
                { case: { $eq: ["$_id", 2] }, then: "服装服饰" },
                { case: { $eq: ["$_id", 3] }, then: "家具用品" },
                { case: { $eq: ["$_id", 4] }, then: "美妆个护" },
                { case: { $eq: ["$_id", 5] }, then: "食品饮料" },
                { case: { $eq: ["$_id", 6] }, then: "运动户外" },
              ],
              default: "其他分类",
            },
          },
          order_cnt: 1,
        },
      },
    ]);
    res.send({
      code: 200,
      data: dailyData,
      message: "获取数据成功",
    });
  } catch (error) {
    next(error);
  }
};

// 实时数据
export const getRealTimeData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 获取用户id
    const { user } = req as any;
    const userId = user.userId;
    const redisKey = `user:${userId}:realTimeData`;
    // 检查用户是否在5分钟内已请求过
    const lastRequestTime = await redisClient.get(redisKey);
    console.log(lastRequestTime);
    if (lastRequestTime) {
      const currentTime = Date.now();
      const timeDiff = currentTime - parseInt(lastRequestTime);
      const fiveMinutes = 5 * 60 * 1000; // 5分钟的毫秒数

      if (timeDiff < fiveMinutes) {
        res.send({
          code: 429,
          data: null,
          message: "请求过于频繁，请稍后再试",
        });
        return;
      }
    }
    // 获取当前时间
    const now = dayjs();
    const start_date = now.format("YYYY-MM-DD");
    const end_date = now.format("YYYY-MM-DD HH:mm:ss");
    // 获取实时订单数据
    const realTimeOrderData =
      (await MockOrder.find({
        pay_time: {
          $gte: setDateBoundaries(new Date(start_date), true),
          $lte: new Date(end_date),
        },
      }).lean()) || [];
    // 实时订单
    const today_order_cnt = realTimeOrderData.length;
    // 实时gmv
    const today_order_amount = Number(
      realTimeOrderData
        .reduce((acc, item) => {
          return acc + item.min_group_price;
        }, 0)
        .toFixed(2)
    );
    // 实时退款订单列表
    const refund_order_list =
      realTimeOrderData.filter((item) => item.order_status === 4) || [];
    const today_refund_order_cnt = refund_order_list.length;
    // 实时退款金额
    const today_refund_amount = Number(
      refund_order_list
        .reduce((acc, item) => {
          return acc + item.min_group_price;
        }, 0)
        .toFixed(2)
    );
    // 实时平均客单价
    const today_avg_order_price = Number(
      (today_order_amount / today_order_cnt).toFixed(2)
    );
    // 实时退款率
    const today_refund_rate = Number(
      (today_refund_order_cnt / today_order_cnt).toFixed(2)
    );
    // 获取订单商品销量统计数据
    const orderProductData = await MockOrder.aggregate([
      {
        $match: {
          pay_time: {
            $gte: setDateBoundaries(new Date(start_date), true),
            $lte: new Date(end_date),
          },
          order_status: { $ne: 4 }, // 排除已取消的订单
        },
      },
      {
        $group: {
          _id: "$goods_id",
          goods_name: { $first: "$goods_name" },
          goods_num: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          _id: 0,
          goods_id: "$_id",
          goods_name: 1,
          goods_num: 1,
        },
      },
      {
        $sort: { goods_num: -1 },
      },
    ]);
    // 更新Redis中的最后请求时间
    await redisClient.set(redisKey, Date.now().toString());
    // 设置5分钟过期时间
    await redisClient.expire(redisKey, 300); // 300秒 = 5分钟
    res.send({
      code: 200,
      data: {
        today_order_cnt,
        today_order_amount,
        today_refund_order_cnt,
        today_refund_amount,
        today_avg_order_price,
        today_refund_rate,
        orderProductData: orderProductData.slice(0, 5),
      },
      message: "获取数据成功",
    });
    return;
  } catch (error) {
    next(error);
  }
};
