/* 
校验token是否有效
 */
import { expressjwt } from "express-jwt";

// 路由白名单
const whiteList = ["/api/login", "/api/register", "/api/logout"];

// 创建中间件方法
export const auth = expressjwt({
  secret: process.env.JWT_SECRET as string,
  algorithms: ["HS256"],
}).unless({ path: whiteList });