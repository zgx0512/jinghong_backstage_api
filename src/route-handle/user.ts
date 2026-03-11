/* 
用户路由文件中使用的方法
 */
import { Response, Request, NextFunction } from "express";
import { validationResult } from "express-validator"; // 添加这行
// 引入用户模型
import { User } from "@/models/user";
// 引入角色模型
import { Role } from "@/models/role";
// 引入菜单模型
import { Menu } from "@/models/menu";
// 引入按钮模型
import { Btn } from "@/models/btn";
// 引入jwt
import jwt from "jsonwebtoken";
// 引入redis
import redisClient from "@/config/redis";
import dayjs from "dayjs";
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
  next: Function,
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
  next: NextFunction,
) => {
  // 将token存储到redis的黑名单中
  try {
    // 从请求头中获取token
    const token = req.headers.authorization!.split(" ")[1];
    if (token) {
      // 将token加入黑名单，过期时间设置为该 token 的剩余有效期
      const decoded = jwt.decode(token) as { exp?: number } | null;
      const nowSec = Math.floor(Date.now() / 1000);
      const ttlSec = decoded?.exp
        ? Math.max(decoded.exp - nowSec, 0)
        : 60 * 60 * 24 * 7; // fallback 7d
      await redisClient.set(`bl_${token}`, "true", { EX: ttlSec });
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
  next: NextFunction,
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
    // 根据role_ids获取用户角色并集起来的权限id
    const roleIdList = userInfo.role_ids
      ? userInfo.role_ids.split(",").map(Number)
      : [];
    // 获取当前用户所拥有的所有权限
    const roleList = await Role.find({ roleId: { $in: roleIdList } });

    // 找出当前所有角色合并后的权限数组（去重）
    const permissionIdSet = new Set<number>();

    roleList.forEach((role) => {
      (role.permissions || []).forEach((permId: number) => {
        permissionIdSet.add(permId);
      });
    });

    const permissionIdList = Array.from(permissionIdSet);
    // 找出用户所拥有的菜单（扁平列表）
    const flatMenuList = await Menu.find({
      menuId: { $in: permissionIdList },
    }).lean();

    // 将菜单列表组装成树形结构
    const menuMap = new Map<number, any>();
    flatMenuList.forEach((menu: any) => {
      menu.children = [];
      menuMap.set(menu.menuId, menu);
    });

    const menuTree: any[] = [];
    flatMenuList.forEach((menu) => {
      const parentId = menu.parentId;
      if (parentId == null) {
        // 没有 parentId，视为顶级菜单
        menuTree.push(menu);
      } else {
        const parent = menuMap.get(parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(menu);
        } else {
          // 找不到父节点时，退化为顶级
          menuTree.push(menu);
        }
      }
    });

    // 递归查找第一个叶子菜单（默认路由），排除路径为 /screen 的菜单
    const findFirstLeafMenu = (nodes: any[]): any | null => {
      for (const node of nodes) {
        const hasChildren =
          Array.isArray(node.children) && node.children.length > 0;
        const isScreenRoute = node.menuPath === "/screen";

        if (!hasChildren && !isScreenRoute) {
          return node;
        }

        const found = findFirstLeafMenu(node.children || []);
        if (found) {
          return found;
        }
      }
      return null;
    };

    const firstLeafMenu = findFirstLeafMenu(menuTree);

    // 找出用户所拥有的按钮
    const btnList = await Btn.find({
      btnId: { $in: permissionIdList },
    });
    // 找出按钮对应的标识
    const btnAclList = btnList.map((btn) => btn.acl);
    const defaultBtnAclList = [
      "Add-Menu",
      "Add-Auth-Btn-Menu",
      "Add-Role",
      "Batch-Delete-Role",
      "Delete-Role",
      "Add-User",
      "Batch-delete-User",
      "Add-Category",
      "Edit-Category",
      "Delete-Category",
      "Add-Commodity",
      "Add-Trademark",
      "Edit-Trademark",
      "Delete-Trademark",
      "Edit-Menu",
      "Delete-Menu",
      "Assign-Auth-Role",
      "Edit-Auth-Role",
      "Delete-Auth-Role",
      "Assign-Role-User",
      "Edit-User",
      "Delete-User",
      "Edit-Commodity",
      "View-Sku",
      "Delete-Commodity",
      "Edit-Attr",
      "Open-Order",
      "Shipment-Order",
    ];
    const defaultMenuTree = [
      {
        menuName: "仪表盘",
        menuIcon: "ep-sunrise",
        menuPath: "/dashboard",
        acl: "Dashboard",
        level: 1,
        parentId: null,
        isLeaf: false,
        hasBtnsAcl: false,
        menuId: 10001,
        children: [
          {
            menuName: "工作台",
            menuIcon: "ep-data-analysis",
            menuPath: "/dashboard/workbench",
            acl: "Workbench",
            level: 2,
            parentId: 10001,
            isLeaf: true,
            hasBtnsAcl: false,
            menuId: 10002,
            children: [],
          },
          {
            menuName: "分析",
            menuIcon: "ep-histogram",
            menuPath: "/dashboard/analysis",
            acl: "Analysis",
            level: 2,
            parentId: 10001,
            isLeaf: true,
            hasBtnsAcl: false,
            menuId: 10003,
            children: [],
          },
        ],
      },
      {
        menuName: "权限管理",
        menuIcon: "ep-lock",
        menuPath: "/acl",
        acl: "Acl",
        level: 1,
        parentId: null,
        isLeaf: false,
        hasBtnsAcl: false,
        menuId: 10004,
        children: [
          {
            menuName: "用户管理",
            menuIcon: "ep-user",
            menuPath: "/acl/user",
            acl: "User",
            level: 2,
            parentId: 10004,
            isLeaf: true,
            hasBtnsAcl: true,
            menuId: 10005,
            children: [],
          },
          {
            menuName: "角色管理",
            menuIcon: "ep-avatar",
            menuPath: "/acl/role",
            acl: "Role",
            level: 2,
            parentId: 10004,
            isLeaf: true,
            hasBtnsAcl: true,
            menuId: 10006,
            children: [],
          },
          {
            menuName: "菜单管理",
            menuIcon: "ep-menu",
            menuPath: "/acl/permission",
            acl: "Permission",
            level: 2,
            parentId: 10004,
            isLeaf: true,
            hasBtnsAcl: true,
            menuId: 10007,
            children: [],
          },
        ],
      },
      {
        menuName: "数据大屏",
        menuIcon: "ep-monitor",
        menuPath: "/screen",
        acl: "Screen",
        level: 1,
        parentId: null,
        isLeaf: true,
        hasBtnsAcl: false,
        menuId: 10008,
        children: [],
      },
      {
        menuName: "商品管理",
        menuIcon: "ep-goods",
        menuPath: "/commodity",
        acl: "Commodity",
        level: 1,
        parentId: null,
        isLeaf: false,
        hasBtnsAcl: false,
        menuId: 10009,
        children: [
          {
            menuName: "商品列表",
            menuIcon: "ep-film",
            menuPath: "/commodity/commodity-list",
            acl: "CommodityList",
            level: 2,
            parentId: 10009,
            isLeaf: true,
            hasBtnsAcl: true,
            menuId: 10010,
            children: [],
          },
          {
            menuName: "品牌管理",
            menuIcon: "ep-suitcase",
            menuPath: "/commodity/trademark",
            acl: "Trademark",
            level: 2,
            parentId: 10009,
            isLeaf: true,
            hasBtnsAcl: true,
            menuId: 10011,
            children: [],
          },
          {
            menuName: "分类管理",
            menuIcon: "ep-wallet",
            menuPath: "/commodity/category",
            acl: "Category",
            level: 2,
            parentId: 10009,
            isLeaf: true,
            hasBtnsAcl: true,
            menuId: 10012,
            children: [],
          },
        ],
      },
      {
        menuName: "订单管理",
        menuIcon: "ep-burger",
        menuPath: "/order",
        acl: "Order",
        level: 1,
        parentId: null,
        isLeaf: false,
        hasBtnsAcl: false,
        menuId: 10013,
        children: [
          {
            menuName: "订单列表",
            menuIcon: "ep-film",
            menuPath: "/order/order-list",
            acl: "OrderList",
            level: 2,
            parentId: 10013,
            isLeaf: true,
            hasBtnsAcl: true,
            menuId: 10014,
            children: [],
          },
        ],
      },
    ];
    const userInfoData = {
      userId: userInfo.userId,
      username: userInfo.username,
      email: userInfo.email,
      menuList: userInfo.userId === 10000 && menuTree.length <= 0 ? defaultMenuTree : menuTree,
      defaultRoute: firstLeafMenu ? firstLeafMenu.menuPath : "/dashboard/workbench",
      defaultMenuName: firstLeafMenu ? firstLeafMenu.acl : "工作台",
      btnAclList: userInfo.userId === 10000 && btnAclList.length <= 0 ? defaultBtnAclList : btnAclList,
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
  next: NextFunction,
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
        role_ids: user.role_ids,
        roleNames: user.roleNames,
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
  next: NextFunction,
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
  next: NextFunction,
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
      {
        username,
        email,
        updateTime: new Date(Date.now() + 8 * 60 * 60 * 1000).toLocaleString(
          "zh-CN",
        ),
      },
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
  next: NextFunction,
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
  next: NextFunction,
) => {
  // 超级管理员账号——super-admin，2324461523@qq.com不让删除
  let userIds = req.body;
  // 找出超级管理员的userId
  const superAdmin = await User.findOne({ email: "2324461523@qq.com" });
  userIds = userIds.filter(
    (userId: number) => Number(userId) !== superAdmin!.userId,
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
// 获取用户角色信息
export const getRoleInfo = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // 获取所有的用户
  try {
    const { userId } = req.query;
    if (!userId) {
      res.send({
        code: 10001,
        message: "用户ID不能为空",
      });
      return;
    }
    const currentUser = await User.findOne({ userId }).lean();
    if (!currentUser) {
      res.send({
        code: 10001,
        message: "用户不存在",
      });
      return;
    }
    const allRoles = (await Role.find().lean().sort({ createTime: -1 })).map(
      (item) => ({
        id: item.roleId,
        createTime: dayjs(item.createTime)
          .subtract(8, "hour")
          .format("YYYY-MM-DD HH:mm:ss"),
        updateTime: dayjs(item.updateTime)
          .subtract(8, "hour")
          .format("YYYY-MM-DD HH:mm:ss"),
        roleName: item.roleName,
      }),
    );
    const role_ids = currentUser.role_ids
      ? currentUser.role_ids.split(",")
      : [];
    // 获取当前用户拥有的角色
    const checkedRoles = allRoles.filter((role) =>
      role_ids.includes(String(role.id)),
    );
    res.send({
      code: 200,
      message: "获取用户角色信息成功",
      data: {
        allRoles,
        checkedRoles,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 给用户分配角色
export const assignRoles = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId, role_ids } = req.body;
    if (!userId) {
      res.send({
        code: 10001,
        message: "用户ID不能为空",
      });
    }
    const currentUser = await User.findOne({ userId }).lean();
    if (!currentUser) {
      res.send({
        code: 10001,
        message: "用户不存在",
      });
    }
    // 查找角色id对应的角色名称
    const roleIdList = role_ids ? role_ids.split(",").map(Number) : [];
    const roles = await Role.find({ roleId: { $in: roleIdList } }).lean();
    const roleNames = roles.map((role) => role.roleName).join(",");
    await User.updateOne({ userId }, { role_ids, roleNames }); // 给用户分配角色
    res.send({
      code: 200,
      message: "分配角色成功",
      data: null,
    });
  } catch (error) {
    next(error);
    console.log(error);
  }
};
