import { Request, Response, NextFunction } from "express";
import { Express } from "../models/express";
import { Order } from "../models/order";
import crypto from "crypto";
import dayjs from "dayjs";

// 目前支持的快递公司
export const LOGISTICS_COMPANY = [
  { label: "顺丰速运", value: "shunfeng" },
  { label: "申通快递", value: "shentong" },
  { label: "圆通快递", value: "yuantong" },
  { label: "中通快递", value: "zhongtong" },
  { label: "韵达快递", value: "yunda" },
  { label: "EMS", value: "ems" },
  { label: "京东物流", value: "jd" },
  { label: "极兔速递", value: "jtexpress" },
];

// 快递100 订阅方法：向 https://poll.kuaidi100.com/poll 提交表单（customer、sign、param）
export const expressSubscribe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { express_sn, express_code, from, to } = req.body;
    // from 和 to 为可选参数，用于指定订阅的物流轨迹范围（需要预测时效和准确率的话，要提供始、终发地）
    if (!express_sn || !express_code) {
      res.send({
        code: 400,
        message: "缺少必要参数 express_sn/express_code",
      });
      return;
    }
    const key = process.env.KD100_KEY || ""; // 快递100 key
    const param = {
      company: express_code,
      number: express_sn,
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      key, // 快递100 key
      parameters: {
        callbackurl: "http://localhost:27081/api/webhook/express",
        resultV2: from && to ? 1 : 0,
      },
    };
    const body = new URLSearchParams();
    body.append("schema", "json");
    body.append("param", JSON.stringify(param));
    const resp = await fetch("https://poll.kuaidi100.com/poll", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });
    const data = await resp.json();
    if (!data || data.result !== true) {
      res.send({
        code: 400,
        message: data.message || "发货失败", // 快递100返回错误信息
      });
      return;
    }
    const now = new Date();
    await Express.findOneAndUpdate(
      { express_code, express_sn },
      {
        $setOnInsert: { express_code, express_sn },
        $set: {
          status: "0",
          last_updated_time: now, // 记录订阅时间
        },
      },
      { new: true, upsert: true }
    );

    res.send({
      code: 200,
      message: data?.message || "发货成功",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// 快递100 推送方法：接收快递100推送的物流信息
export const expressPush = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const key = process.env.KD100_KEY || "";
    if (!key) {
      res.send({ code: 500, message: "未配置 KD100_KEY" });
      return;
    }
    // nu 单号  com 快递公司代码  status 物流状态 data 物流信息 sign 签名
    const { nu, com, status, data = [], sign } = req.body || {};
    if (!nu || !com) {
      res.status(400).send({
        result: false,
        returnCode: "400",
        message: "回调缺少必要字段 nu/com",
      });
      return;
    }
    const raw = `${nu}${com}${key}`;
    const calc = crypto
      .createHash("md5")
      .update(raw, "utf8")
      .digest("hex")
      .toUpperCase();
    if (!sign || String(sign).toUpperCase() !== calc) {
      res
        .status(403)
        .send({ result: false, message: "签名错误", returnCode: 403 });
      return;
    }

    // 找出com对应的快递公司名称
    const express_name = LOGISTICS_COMPANY.find(
      (it) => it.value === com
    )?.label;

    // 轨迹标准化 + 时间降序 + 截断到最近 200 条，保证幂等覆盖
    const checkpoints = Array.isArray(data)
      ? data
          .map((it: any) => ({
            op_time: dayjs(it.time).toDate(),
            op_type: it.status,
            content: it.content,
            is_received: it.statusCode || 0, // 0-未签收，1-已签收
            express_name: express_name,
          }))
          .sort(
            (a: any, b: any) =>
              new Date(b.op_time).getTime() - new Date(a.op_time).getTime()
          )
          .slice(0, 200)
      : [];

    const now = new Date();

    await Express.findOneAndUpdate(
      { express_code: com, express_sn: nu },
      {
        $set: {
          status,
          checkpoints,
          last_updated_time: now,
        },
      },
      { new: true, upsert: true }
    );

    res.send({
      result: true,
      message: "成功",
      returnCode: "200",
    });
  } catch (e: any) {
    res.status(500).send({
      result: false,
      message: e.message,
      returnCode: "500",
    });
    next(e);
  }
};

const expressInfo = [
  {
    op_time: "2025-11-11 21:50:20",
    op_type: "SIGNED",
    content:
      "【深圳市】 您的快递已签收，签收人在【冠利达利安公寓正门右侧丰巢柜】取件。如有疑问请联系业务员：17388126285，代理点电话：95333，投诉电话：0755-36550270。感谢使用中通快递，期待再次为您服务！",
    is_received: 1,
    express_name: "中通",
  },
  {
    op_time: "2025-11-11 08:53:15",
    op_type: "ARRIVAL",
    content:
      "【深圳市】 快件已被 丰巢 的【冠利达利安公寓正门右侧丰巢柜】代收，【取件地址：冠利达利安公寓正门右侧丰巢柜】，请及时取件。代理点电话：17388126285，投诉电话：0755-36550270",
    is_received: 0,
    express_name: "中通",
  },
  {
    op_time: "2025-11-11 07:29:31",
    op_type: "派件",
    content:
      "【深圳市】深圳新宝城 的业务员【毛何斌,17388126285】正在为您派件（95720为中通快递员外呼专属号码，请放心接听，如有问题可联系网点:0755-36550270,投诉电话:0755-36550270）",
    is_received: 0,
    express_name: "中通",
  },
  {
    op_time: "2025-11-10 21:00:45",
    op_type: "到件",
    content: "【深圳市】 快件已到达 深圳新宝城",
    is_received: 0,
    express_name: "中通",
  },
  {
    op_time: "2025-11-10 15:36:59",
    op_type: "发件",
    content: "【深圳市】 快件已发往 深圳新宝城",
    is_received: 0,
    express_name: "中通",
  },
  {
    op_time: "2025-11-10 15:34:37",
    op_type: "到件",
    content: "【深圳市】 快件已到达 深圳转运中心",
    is_received: 0,
    express_name: "中通",
  },
  {
    op_time: "2025-11-10 01:27:52",
    op_type: "发件",
    content: "【长沙市】 快件已发往 深圳新宝城",
    is_received: 0,
    express_name: "中通",
  },
  {
    op_time: "2025-11-10 01:27:21",
    op_type: "到件",
    content: "【长沙市】 快件已到达 长沙转运中心",
    is_received: 0,
    express_name: "中通",
  },
  {
    op_time: "2025-11-09 17:43:49",
    op_type: "收件",
    content:
      "【长沙市】 长沙岳麓区（0731-89560475）龚雅清（17620743078） 已揽收",
    is_received: 0,
    express_name: "中通",
  },
];

// 发货
export const sendExpress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { express_sn, express_code, order_id } = req.body;
    if (!express_sn || !express_code) {
      res.send({ code: 400, message: "快递单号和快递公司必填" });
      return;
    }
    // 这里还应该查询快递100接口，看是否已经有该单号的物流信息
    // 没有，则需要报错，提示用户快递单号或者快递公司填写错误
    // 自己随便定义个物流数据填充进去，实际应该调用快递接口
    await Express.findOneAndUpdate(
      { express_code, express_sn },
      {
        $setOnInsert: { express_code, express_sn },
        $set: {
          status: 1, // 统一使用字符串状态，更易读易扩展
          checkpoints: expressInfo,
          last_updated_time: new Date(),
        },
      },
      { new: true, upsert: true }
    );
    // 将订单状态改为“已发货/待收货”，并填写快递单号和快递公司编码
    await Order.updateOne(
      { order_id },
      {
        $set: {
          express_sn,
          express_code,
          order_status: 3,
        },
      }
    );
    res.send({ code: 200, message: "发货成功", data: null });
  } catch (error) {
    next(error);
  }
};

// 根据物流单号和快递公司编码查询物流信息
export const getExpressDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { express_sn, express_code } = req.query;
    if (!express_sn || !express_code) {
      res.send({ code: 400, message: "快递单号和快递公司编码必填" });
      return;
    }

    let doc = await Express.findOne({ express_sn, express_code }).lean();
    const now = new Date();

    const shouldRefresh =
      !doc || dayjs().diff(dayjs(doc.last_updated_time), "minute") >= 60;

    if (shouldRefresh) {
      // 距离上次更新时间超过60分钟，需要重新查询
      const thirdPartyData: any = null; // 这里应该调用第三方接口获取物流信息
      const express_name = LOGISTICS_COMPANY.find(
        (it) => it.value === express_code
      )?.label;
      if (thirdPartyData) {
        // 标准化并更新
        const checkpoints = Array.isArray(thirdPartyData?.data)
          ? thirdPartyData.data
              .map((it: any) => ({
                op_time: dayjs(it.time).toDate(),
                op_type: it.status,
                content: it.content,
                is_received: it.statusCode || 0, // 0-未签收，1-已签收
                express_name: express_name,
              }))
              .sort(
                (a: any, b: any) =>
                  new Date(b.op_time).getTime() - new Date(a.op_time).getTime()
              )
              .slice(0, 200)
          : [];

        const updated = await Express.findOneAndUpdate(
          { express_code, express_sn },
          {
            $set: {
              status: thirdPartyData.status,
              checkpoints,
              last_updated_time: now,
            },
          },
          { new: true, upsert: true }
        ).lean();

        doc = updated;
      } else if (!doc) {
        // 没有缓存也没有查到数据
        res.send({ code: 200, message: "暂无物流信息", data: null });
        return;
      }
    }
    const data = doc?.checkpoints?.map((item) => {
      return {
        ...item,
        op_time: dayjs(item.op_time).format("YYYY-MM-DD HH:mm:ss"),
      };
    });
    res.send({
      code: 200,
      message: "获取物流信息成功",
      data,
    });
    return;
  } catch (e: any) {
    res.status(500).send({ code: 500, message: e.message });
    return;
  }
};
