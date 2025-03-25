/* 
角色路由的方法
 */

import { NextFunction, Request, Response } from "express";
import { Role } from "../models/role";

// 获取所有角色
export const handleGetRoleList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { roleName, page, limit } = req.query;
  try {
    const queryCondition = roleName
      ? { roleName: { $regex: roleName, $options: "i" } }
      : {};
    const roles = await Role.find(queryCondition)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    // 获取总数
    const total = await Role.countDocuments(queryCondition);
    // 整合返回的数据
    const rolesList = roles.map((role) => {
      return {
        id: role.roleId,
        roleName: role.roleName,
        createTime: role.createTime,
        updateTime: role.updateTime,
      };
    });
    res.send({
      code: 200,
      message: "获取角色列表成功",
      data: {
        rolesList,
        total,
        page: Number(page),
        pageSize: Number(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// 新增角色
export const addRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 处理新增角色的逻辑
  // 判断当前角色是否在角色集合中存在
  const { roleName } = req.body;
  try {
    const existingRole = await Role.findOne({ roleName: roleName });
    if (existingRole) {
      // 存在，返回409
      res.send({
        code: 409,
        message: "角色已存在",
        data: null,
      });
      return;
    }
    // 不存在，新增角色
    await Role.create({
      roleName,
    });
    res.send({
      code: 200,
      message: "角色新增成功",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// 更新角色
export const updateRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 处理更新角色的逻辑id
  const { id, roleName } = req.body;
  try {
    // 获取超级管理员的角色id
    const superAdminRoleId = (await Role.findOne({ roleName: "超级管理员" }))
      ?.roleId;
    if (Number(id) === superAdminRoleId) {
      // 超级管理员角色不能修改
      res.send({
        code: 403,
        message: "超级管理员角色不能修改",
        data: null,
      });
      return;
    }
    // 判断修改的角色名称是否已经存在（不包括自身）
    const existingRole = await Role.findOne({
      roleName: roleName,
      roleId: { $ne: id },
    });
    if (existingRole) {
      // 存在，返回409
      res.send({
        code: 409,
        message: "角色名称已经存在",
        data: null,
      });
      return;
    }
    // 不存在，更新角色
    await Role.updateOne(
      { roleId: id },
      {
        roleName,
      }
    );
    res.send({
      code: 200,
      message: "角色更新成功",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// 删除角色
export const deleteRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { roleId } = req.params;
  try {
    // 获取超级管理员的角色id
    const superAdminRoleId = (await Role.findOne({ roleName: "超级管理员" }))
      ?.roleId;
    if (Number(roleId) === superAdminRoleId) {
      // 超级管理员角色不能删除
      res.send({
        code: 403,
        message: "超级管理员角色不能删除",
        data: null,
      });
      return;
    }
    await Role.deleteOne({ roleId });
    res.send({
      code: 200,
      message: "角色删除成功",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// 批量删除角色
export const batchDeleteRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let roleIds = req.body;
  try {
    // 获取超级管理员的角色id
    const superAdminRoleId = (await Role.findOne({ roleName: "超级管理员" }))
      ?.roleId;
    // 将超级管理员角色剔除掉
    roleIds = roleIds.filter(
      (roleId: number) => Number(roleId) !== superAdminRoleId
    );
    await Role.deleteMany({ roleId: { $in: roleIds } });
    res.send({
      code: 200,
      message: "角色批量删除成功",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
