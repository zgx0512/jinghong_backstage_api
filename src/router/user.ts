/* 
用户注册、登录、退出、获取用户信息、修改密码、修改个人信息的文件
 */

import { Router } from "express";
// 引入处理函数
import { handleAddUser, handleLogin, handleLogout } from "@handlers/user";
// 引入校验规则
import { registerValidator } from "@/utils/userValidator";

const router: Router = Router();

// 新增用户
router.post("/addUser", registerValidator, handleAddUser);

// 登录
router.post("/login", handleLogin);

// 退出登录
router.post("/logout", handleLogout);

// 导出路由
export default router;
