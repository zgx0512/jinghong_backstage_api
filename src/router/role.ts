/* 
角色模块的路由
 */

import { Router } from "express";
// 引入路由处理方法
import {
  addRole,
  handleGetRoleList,
  updateRole,
  deleteRole,
  batchDeleteRole,
} from "../route-handle/role";

const router = Router();

// 获取角色列表
router.get("/getRoleList", handleGetRoleList);

// 新增角色
router.post("/addRole", addRole);

// 更新角色
router.put("/updateRole", updateRole);

// 删除角色
router.delete("/deleteRole/:roleId", deleteRole);

// 批量删除角色
router.delete("/batchDeleteRole", batchDeleteRole);

export default router;
