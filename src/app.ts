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
import { Response, Request, NextFunction } from "express";
import { auth } from "./utils/auth";
import { checkTokenBlacklist } from "./utils/checkBlacklist";

const app = express();

// 配置内置中间件
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 配置token校验中间件
app.use(auth);
// 配置token黑名单中间件
app.use(checkTokenBlacklist);

// 配置跨域中间件
app.use(cors());

// 注册路由
app.use("/api", userRouter);
app.use("/api", roleRouter);
app.use("/api", menuRouter);

// 测试路由
app.get("/userList", (req: Request, res: Response) => {
  res.send({
    code: 200,
    data: [],
  });
});

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
