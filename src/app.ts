import { connectDB } from "./config/db";
// 连接数据库
connectDB();

/* 
小牛电商后台的后端接口文件
 */
require("dotenv").config();
import express from "express";
import cors from "cors";
// 引入路由文件
import userRouter from "./router/user";
import roleRouter from "./router/role";
import menuRouter from "./router/menu";
import btnRouter from "./router/btn";
import classifyRouter from "./router/classify";
import uploadRouter from "./router/upload";
import trademarkRouter from "./router/trademark";
import { Response, Request, NextFunction } from "express";
import { auth, parseToken } from "./utils/auth";
import { checkTokenBlacklist } from "./utils/checkBlacklist";

const app = express();
// 配置跨域中间件
app.use(
  cors({
    origin: "*", // 开放所有跨域请求
    methods: ["GET", "POST", "PUT", "DELETE"], // 允许跨域请求的方法
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "token",
    ], // 允许跨域携带的请求头
    exposedHeaders: ["Authorization", "token"], // 同时暴露 token 响应头
  })
);

// 配置内置中间件
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 配置token校验中间件
app.use(auth);
// 配置token解析中间件
app.use(parseToken);
// 配置token黑名单中间件
app.use(checkTokenBlacklist);

// 注册路由
app.use("/api", userRouter);
app.use("/api", roleRouter);
app.use("/api", menuRouter);
app.use("/api", btnRouter);
app.use("/api", classifyRouter);
app.use("/api", uploadRouter);
app.use("/api", trademarkRouter);

// 定义404中间件
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).send({
    code: 404,
    data: null,
    message: "Not Found",
  });
});
// 定义错误级别的中间件，用来捕获错误
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // token过期或无效
  if (err.name === "UnauthorizedError") {
    res.status(401).send({
      code: 401,
      data: null,
      message: err.message,
    });
    return;
  }
  res.status(500).send({
    code: 500,
    data: null,
    message: err.message,
  });
});

// 开启监听端口
const port = process.env.PORT || 27081;
// 本地ip
const ip = "192.168.3.90";
app.listen(port as number, ip, () => {
  console.log(`Server running in ${ip}:${port}`);
});
