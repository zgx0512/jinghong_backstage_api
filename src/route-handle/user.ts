/* 
用户路由文件中使用的方法
 */
import { Response, Request, NextFunction } from "express";
import { validationResult } from "express-validator"; // 添加这行
// 引入用户模型
import { User } from "@/models/user";
// 引入jwt
import jwt from "jsonwebtoken";
// 引入redis
import redisClient from "@/config/redis";

// 新增用户
export const handleAddUser = async (
  req: Request,
  res: Response,
  next: Function
) => {
  try {
    // 处理新增用户逻辑
    const errors = validationResult(req); // 验证数据
    if (!errors.isEmpty()) {
      // 错误数据列表不为空
      res.status(422).send({
        code: 422,
        message: errors.array()[0].msg,
      });
      return;
    }

    const { username, password, email } = req.body;
    // 检查用户是否已存在
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).send({
        code: 409,
        message: "邮箱已存在",
      });
      return;
    }
    // 邮箱不存在，将当前注册用户存入User集合中
    const user = await User.create({
      username,
      password,
      email,
    });
    res.send({
      code: 200,
      message: "注册成功",
      data: null,
    });
  } catch (error) {
    // 提交给全局错误处理中间件
    next(error);
  }
};

// 生成token的方法
const generateToken = (userId: number, username: string): string => {
  return jwt.sign(
    { userId, username },
    (process.env.JWT_SECRET as string),
    { expiresIn: "7d" }
  );
};

// 登录路由的回调
export const handleLogin = async (
  req: Request,
  res: Response,
  next: Function
) => {
  try {
    // 处理登录逻辑
    const { password, email } = req.body;
    // 检查用户是否存在
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).send({
        code: 401,
        message: "邮箱或密码错误",
      });
      return;
    }
    // 用户存在，验证密码是否正确
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).send({
        code: 401,
        message: "邮箱或密码错误",
      });
      return;
    }
    // 密码正确，生成token并返回
    const token = generateToken(user.userId, user.username);
    res.send({
      code: 200,
      message: "登录成功",
      data: { token },
    });
  } catch (error) {
    // 提交给全局错误处理中间件
    next(error);
  }
};

// 退出登录路由的回调
export const handleLogout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 将token存储到redis的黑名单中
  try {
    // 从请求头中获取token
    const token = req.headers.authorization!.split(" ")[1];
    if (token) {
      // 将token加入黑名单中
      // 格式：redis的key为bl_${token}，value为true，过期时间为7天
      await redisClient.set(`bl_${token}`, "true", {"EX": 60 * 60 * 24 * 7});
    }
    res.send({
      code: 200,
      data: null,
      message: "退出登录成功"
    });
  } catch (error) {
    next(error);
  }
};
