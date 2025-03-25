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
// 生成token的方法
const generateToken = (userId: number, username: string): string => {
  return jwt.sign({ userId, username }, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });
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
      res.send({
        code: 401,
        message: "邮箱或密码错误",
      });
      return;
    }
    // 用户存在，验证密码是否正确
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.send({
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
      data: token,
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
      await redisClient.set(`bl_${token}`, "true", { EX: 60 * 60 * 24 * 7 });
    }
    res.send({
      code: 200,
      data: null,
      message: "退出登录成功",
    });
  } catch (error) {
    next(error);
  }
};

// 获取用户信息的回调
export const handleGetUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { user } = req as any;
  try {
    if (!user) {
      res.send({
        code: 401,
        data: null,
        message: "token已失效，请重新登录",
      });
      return;
    }
    // 根据用户id获取用户信息
    const userInfo = await User.findOne({ userId: user.userId });
    if (!userInfo) {
      res.send({
        code: 405,
        data: null,
        message: "用户不存在",
      });
      return;
    }
    const userInfoData = {
      userId: userInfo.userId,
      username: userInfo.username,
      email: userInfo.email,
      role: userInfo.role,
      avatar: userInfo.avatar,
      createTime: userInfo.createTime,
      updateTime: userInfo.updateTime,
    };
    res.send({
      code: 200,
      data: userInfoData,
      message: "获取用户信息成功",
    });
  } catch (error) {
    next(error);
  }
};

// 获取用户列表的回调
export const handleGetUserList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 获取用户列表
  try {
    const { page, pageSize, username } = req.query;
    // 构建查询条件
    const queryCondition = username
      ? { username: { $regex: username, $options: "i" } }
      : {};

    // 分页查询
    const users = await User.find(queryCondition)
      .skip((Number(page) - 1) * Number(pageSize))
      .limit(Number(pageSize));

    // 获取符合条件的总用户数量
    const total = await User.countDocuments(queryCondition);
    // 筛选出需要的数据
    const usersList = users.map((user) => {
      return {
        userId: user.userId,
        username: user.username,
        email: user.email,
        role: user.role,
        createTime: user.createTime,
        updateTime: user.updateTime,
      };
    });
    res.send({
      code: 200,
      data: {
        page: Number(page),
        pageSize: Number(pageSize),
        usersList,
        total,
      },
      message: "获取用户列表成功",
    });
  } catch (error) {
    next(error);
  }
};

// 新增用户
export const handleAddUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 处理新增用户逻辑
    const errors = validationResult(req); // 验证数据
    if (!errors.isEmpty()) {
      // 错误数据列表不为空
      res.send({
        code: 422,
        message: errors.array()[0].msg,
      });
      return;
    }

    const { username, password, email } = req.body;
    // 检查用户是否已存在
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.send({
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
      message: "添加用户成功",
      data: null,
    });
  } catch (error) {
    // 提交给全局错误处理中间件
    next(error);
  }
};

// 更新用户信息的回调
export const handleUpdateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 超级管理员账号——super-admin，2324461523@qq.com不让修改
  const { userId, username, email } = req.body;
  // 找出超级管理员的userId
  const superAdmin = await User.findOne({ email: "2324461523@qq.com" });
  try {
    if (userId === superAdmin!.userId) {
      res.send({
        code: 403,
        message: "超级管理员账号不允许修改",
        data: null,
      });
      return;
    }
    // 更新用户信息
    await User.updateOne(
      { userId },
      { username, email, updateTime: new Date(Date.now() + 8 * 60 * 60 * 1000) }
    );
    res.send({
      code: 200,
      message: "更新用户信息成功",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// 删除用户的回调
export const handleDeleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 超级管理员账号——super-admin，2324461523@qq.com不让删除
  const { userId } = req.params;
  // 找出超级管理员的userId
  const superAdmin = await User.findOne({ email: "2324461523@qq.com" });
  try {
    if (Number(userId) === superAdmin!.userId) {
      res.send({
        code: 403,
        message: "超级管理员账号不允许删除",
        data: null,
      });
      return;
    }
    // 删除用户
    await User.deleteOne({ userId });
    res.send({
      code: 200,
      message: "删除用户成功",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// 批量删除用户的回调
export const handleBatchDeleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 超级管理员账号——super-admin，2324461523@qq.com不让删除
  let userIds = req.body;
  // 找出超级管理员的userId
  const superAdmin = await User.findOne({ email: "2324461523@qq.com" });
  userIds = userIds.filter(
    (userId: number) => Number(userId) !== superAdmin!.userId
  );
  // 批量删除用户
  try {
    await User.deleteMany({ userId: { $in: userIds } });
    res.send({
      code: 200,
      message: "批量删除用户成功",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
