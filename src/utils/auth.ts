/* 
校验token是否有效
 */
import { expressjwt } from "express-jwt";
import jwt from "jsonwebtoken";

// 路由白名单
const whiteList = ["/api/login", "/api/register", "/api/logout"];

// 创建中间件方法
export const auth = expressjwt({
  secret: process.env.JWT_SECRET as string,
  algorithms: ["HS256"],
}).unless({ path: whiteList });
// 解析token中间件
export const parseToken = (req: any, res: any, next: any) => {
  try {
    // 检查当前路径是否在白名单中
    if (whiteList.includes(req.path)) {
      return next(); // 如果是白名单路径，直接跳过token解析
    }
    // 从请求头中获取authorization字段
    const authHeader = req.headers.authorization;
    // 如果没有authorization头或格式不正确，继续执行但不设置req.user
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    // 提取token部分（去掉'Bearer '前缀）
    const token = authHeader.split(' ')[1];
    // 如果token为空，继续执行但不设置req.user
    if (!token) {
      return next();
    }
    // 解析token，获取用户信息
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    // 将解析后的用户信息添加到req对象中
    req.user = decoded;
    // 继续执行下一个中间件
    next();
  } catch (error) {
    // 如果token无效或已过期，记录错误但继续执行
    console.error('Token解析失败:', error);
    next();
  }
};