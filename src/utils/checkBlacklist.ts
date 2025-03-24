/* 
验证token是否在黑名单中的中间件
*/
import { Request, Response, NextFunction } from "express";
import redisClient from "@/config/redis";

// 定义白名单路径
const whiteList = ["/api/login", "/api/addUser", "/api/logout"];

// 验证token是否在黑名单中
export const checkTokenBlacklist = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (whiteList.includes(req.path)) {
      return next();
    }
    // authorization = "Bearer <token>"
    const token = req.headers.authorization!.split(" ")[1];
    if (token) {
      // 查找当前token是否存在黑名单中
      const isBlacklisted = await redisClient.get(`bl_${token}`);
      console.log(isBlacklisted);
      if (isBlacklisted) {
        res.status(401).send({
          code: 401,
          data: null,
          message: "token已失效，请重新登录",
        });
        return;
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};
