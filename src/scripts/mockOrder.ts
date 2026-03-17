// 批量模拟出虚拟订单数据
import mongoose from "mongoose";
import { MockOrder } from "../models/mockOrder";
import { connectDB } from "../config/db";
import dayjs from "dayjs";

// 定义订单状态和类型
type OrderStatus = 0 | 1 | 2 | 3 | 4; // 0-待付款 1-待发货 2-待收货 3-已完成 4-已取消
type AfterSaleStatus = 0 | 1 | 2 | 3; // 0-无售后 1-售后中 2-售后完成 3-售后关闭

// 生成随机订单数据的函数
function generateRandomOrder(date: Date, userId: number): any {
  // 随机订单状态
  const orderStatus: OrderStatus = Math.floor(Math.random() * 5) as OrderStatus;

  // 根据订单状态决定支付时间
  let payTime: Date | undefined;

  // 只有在订单状态不是"待付款"（0）的情况下才可能有支付时间
  if (orderStatus > 0) {
    // 支付时间应该晚于创建时间，但不超过创建时间的30分钟，且不能超过当前时间
    const payTimeOffset = Math.floor(Math.random() * 30 * 60 * 1000);
    const potentialPayTime = new Date(date.getTime() + payTimeOffset);
    payTime = potentialPayTime;
  } else {
    payTime = undefined;
  }

  // 随机售后状态，只有在订单状态大于等于1时才可能有售后
  let afterSaleStatus: AfterSaleStatus = 0;
  if (orderStatus > 0) {
    afterSaleStatus = Math.floor(Math.random() * 4) as AfterSaleStatus;
  }

  // 随机商品信息
  const goodsNames = [
    "iPhone 15 Pro",
    "MacBook Air M2",
    "iPad Pro",
    "AirPods Pro",
    "Samsung Galaxy S24",
    "Dell XPS 13",
    "Sony WH-1000XM4",
    "Google Pixel 8",
    "Nike Air Max运动鞋",
    "Adidas休闲外套",
    "Levi's牛仔裤",
    "H&M时尚T恤",
    "美的变频空调",
    "海尔冰箱",
    "格力电风扇",
    "苏泊尔电饭煲",
  ];

  const goodsName = goodsNames[Math.floor(Math.random() * goodsNames.length)];
  const goodsPrice = parseFloat((Math.random() * 1000 + 50).toFixed(2)); // 价格50-1050元
  const goodsNum = Math.floor(Math.random() * 5) + 1; // 1-5件商品
  const minGroupPrice = parseFloat((goodsPrice * goodsNum).toFixed(2)); // 实付金额

  // 随机收货信息
  const recipientNames = [
    "张三",
    "李四",
    "王五",
    "赵六",
    "钱七",
    "孙八",
    "周九",
    "吴十",
  ];
  const provinces = [
    "北京市",
    "上海市",
    "广东省",
    "江苏省",
    "浙江省",
    "四川省",
    "湖北省",
    "陕西省",
  ];
  const cities = [
    "朝阳区",
    "浦东新区",
    "天河区",
    "玄武区",
    "西湖区",
    "锦江区",
    "江汉区",
    "雁塔区",
  ];
  const addresses = [
    "中山路101号",
    "解放大道235号",
    "建设路305号",
    "人民街88号",
    "花园巷15号",
    "科技路66号",
    "创业路99号",
    "工业大道123号",
  ];
  return {
    c_user_id: userId,
    order_status: orderStatus,
    after_sale_status: afterSaleStatus,
    goods_id: Math.floor(Math.random() * 100) + 1, // 商品ID 1-100
    goods_name: goodsName,
    goods_price: goodsPrice,
    goods_num: goodsNum,
    category: Math.floor(Math.random() * 6) + 1,
    goods_image: `https://example.com/images/product_${Math.floor(
      Math.random() * 20,
    )}.jpg`,
    spec: `规格${Math.floor(Math.random() * 5) + 1}`,
    min_group_price: minGroupPrice,
    express_sn:
      orderStatus > 1
        ? `SF${Math.floor(Math.random() * 9000000000) + 1000000000}`
        : undefined, // 只有发货后才有物流单号
    express_code:
      orderStatus > 1
        ? ["SF", "YT", "ZTO", "YTO", "JD"][Math.floor(Math.random() * 5)]
        : undefined, // 物流公司
    recipient_name:
      recipientNames[Math.floor(Math.random() * recipientNames.length)],
    recipient_phone: `1${Math.floor(Math.random() * 9)}${Math.floor(
      Math.random() * 10,
    )}${Math.floor(Math.random() * 10)}${Math.floor(
      Math.random() * 10,
    )}${Math.floor(Math.random() * 10)}${Math.floor(
      Math.random() * 10,
    )}${Math.floor(Math.random() * 10)}${Math.floor(
      Math.random() * 10,
    )}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}`,
    recipient_address: addresses[Math.floor(Math.random() * addresses.length)],
    recipient_city: cities[Math.floor(Math.random() * cities.length)],
    recipient_province: provinces[Math.floor(Math.random() * provinces.length)],
    recipient_postal_code: `${Math.floor(Math.random() * 9 + 1)}${Math.floor(
      Math.random() * 10,
    )}${Math.floor(Math.random() * 10)}${Math.floor(
      Math.random() * 10,
    )}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}`,
    order_status_log: [], // 订单状态日志暂时为空
    create_time: dayjs(date).format("YYYY-MM-DD HH:mm:ss"),
    pay_time: payTime ? dayjs(payTime).format("YYYY-MM-DD HH:mm:ss") : "",
  };
}

// 批量生成指定日期范围内的订单数据
async function generateMockOrders() {
  try {
    console.log("开始连接数据库...");
    await connectDB();
    console.log("数据库连接成功");

    // 设置起始时间和结束时间（东八区时间）
    const startDate = new Date(Date.UTC(2026, 0, 1, 0, 0, 0)); // 2026年1月1日 (月份从0开始)
    const endDate = new Date(Date.UTC(2026, 2, 10, 23, 59, 59)); // 2026年3月9日

    console.log(
      `开始生成从 ${startDate.toISOString().split("T")[0]} 到 ${
        endDate.toISOString().split("T")[0]
      } 的订单数据...`,
    );

    // 计算总天数
    const totalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    for (let i = 0; i < totalDays; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      // 设置日期的时间为随机时间（0-23小时）
      currentDate.setHours(Math.floor(Math.random() * 24), 0, 0, 0);

      // 每天生成100-300个随机订单
      const orderCount = Math.floor(Math.random() * 201) + 100; // 100-300个订单

      console.log(
        `正在生成 ${
          currentDate.toISOString().split("T")[0]
        } 的 ${orderCount} 条订单...`,
      );

      const orders = [];

      for (let j = 0; j < orderCount; j++) {
        // 在当天的随机时间生成订单（从00:00:00到23:59:59），精确到秒
        const randomTime = new Date(currentDate);
        randomTime.setHours(
          Math.floor(Math.random() * 24), // 小时 0-23
          Math.floor(Math.random() * 60), // 分钟 0-59
          Math.floor(Math.random() * 60), // 秒 0-59
          0, // 毫秒设为0
        );

        // 随机用户ID
        const userId = Math.floor(Math.random() * 1000) + 1;

        const order = generateRandomOrder(randomTime, userId);
        orders.push(order);
      }

      // 使用循环调用create方法，确保pre钩子被触发生成订单号
      for (const order of orders) {
        await MockOrder.create(order);
      }

      console.log(
        `已插入 ${currentDate.toISOString().split("T")[0]} 的 ${
          orders.length
        } 条订单`,
      );
    }

    console.log("所有订单数据插入完成！");
  } catch (error) {
    console.error("插入订单数据时发生错误:", error);
  } finally {
    await mongoose.disconnect();
    console.log("数据库连接已断开");
  }
}

// 每小时插入订单数据的函数
async function insertHourlyOrders() {
  try {
    console.log("开始连接数据库...");
    await connectDB();
    console.log("数据库连接成功");

    // 获取当前小时的开始时间
    const now = new Date();
    // 转换为东八区时间
    const startOfHour = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    startOfHour.setMinutes(0, 0, 0); // 设置为整点，秒和毫秒为0

    const endOfHour = new Date(startOfHour);
    endOfHour.setHours(endOfHour.getHours() + 1);

    const orderCount = Math.floor(Math.random() * 16) + 5; // 5-20个订单
    console.log(
      `正在生成从 ${startOfHour.toISOString()} 到 ${endOfHour.toISOString()} 的 ${orderCount} 条订单...`,
    );

    const orders = [];

    for (let i = 0; i < orderCount; i++) {
      // 在这一小时内随机时间生成订单，精确到秒
      const randomTime = new Date(
        startOfHour.getTime() +
          Math.floor(
            Math.random() *
              (endOfHour.getTime() - startOfHour.getTime() - 1000),
          ), // -1000 确保不会生成在下一个小时的开始
      );
      // 调整到整秒
      randomTime.setMilliseconds(0);

      // 随机用户ID
      const userId = Math.floor(Math.random() * 1000) + 1;
      const order = generateRandomOrder(randomTime, userId);
      orders.push(order);
    }   

    // 使用循环调用create方法，确保pre钩子被触发生成订单号
    for (const order of orders) {
      await MockOrder.create(order);
    }

    console.log(
      `已插入 ${startOfHour.toISOString()} 这一小时的 ${orders.length} 条订单`,
    );
  } catch (error) {
    console.error("插入小时订单数据时发生错误:", error);
  } finally {
    await mongoose.disconnect();
    console.log("数据库连接已断开");
  }
}

// 主函数 - 持续运行，每小时生成一次订单
async function runContinuously() {
  console.log("开始每小时生成订单任务...");

  // 立即执行一次
  await insertHourlyOrders();

  // 计算到下一个整点的等待时间
  const now = new Date();
  // 转换为东八区时间来计算下一个整点
  const nextHour = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  nextHour.setMinutes(0, 0, 0); // 设置为整点
  nextHour.setHours(nextHour.getHours() + 1);

  const delay = nextHour.getTime() - (now.getTime() + 8 * 60 * 60 * 1000);

  // 如果计算出的延迟是负数，说明当前时间已经是下一个整点
  if (delay < 0) {
    console.log("正在等待下一个整点...");
  } else {
    console.log(`等待 ${Math.floor(delay / 1000 / 60)} 分钟到下一个整点...`);
  }

  // 设置定时器，每小时执行一次
  setTimeout(
    () => {
      // 每小时执行一次
      setInterval(
        async () => {
          await insertHourlyOrders();
        },
        60 * 60 * 1000,
      ); // 每小时执行一次
    },
    Math.max(delay, 0),
  );
}

// 根据命令行参数选择执行哪个功能
async function main() {
  const action = process.argv[2]; // 获取命令行参数

  if (action === "range") {
    // 执行批量生成指定日期范围内的订单
    await generateMockOrders();
  } else if (action === "hourly") {
    // 执行每小时生成订单
    await runContinuously();
  } else {
    // 如果没有参数或参数不匹配，显示帮助信息
    console.log("用法:");
    console.log(
      "  生成指定日期范围内的订单: npx ts-node -r tsconfig-paths/register src/scripts/mockOrder.ts range",
    );
    console.log(
      "  每小时持续生成订单: npx ts-node -r tsconfig-paths/register src/scripts/mockOrder.ts hourly",
    );
  }
}

// 检查是否直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

export {
  generateRandomOrder,
  generateMockOrders,
  insertHourlyOrders,
  runContinuously,
};
