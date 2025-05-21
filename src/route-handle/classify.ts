import { Request, Response, NextFunction } from "express";
import { Classify } from "@/models/classify";
import dayjs from "dayjs";

// 获取全部分类，以树形结构展示
export const getAllClassify = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 获取所有分类，按创建时间排序
    const classifes = await Classify.find().sort({
      createTime: 1,
    });
    // 将分类列表转换为树形结构
    const buildTree: any = (parentId: number | null = null) => {
      const classifyList = classifes.filter(
        (classify) => classify.parentId === parentId
      );
      return classifyList.map((classify) => ({
        name: classify.name,
        id: classify.id,
        level: classify.level,
        parentId: classify.parentId,
        createTime: dayjs(classify.createTime)
          .subtract(8, "hour")
          .format("YYYY-MM-DD HH:mm:ss"),
        updateTime: dayjs(classify.updateTime)
          .subtract(8, "hour")
          .format("YYYY-MM-DD HH:mm:ss"),
        children: buildTree(classify.id),
      }));
    };
    const tree = buildTree();
    res.send({
      code: 200,
      data: tree,
      message: "获取分类列表成功",
    });
  } catch (error) {
    next(error);
  }
};

// 获取一级分类
export const getOneClassify = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 查找CLassify中parentId为null的分类
    const classifes = await Classify.find({
      parentId: null,
    }).sort({
      createTime: 1,
    });
    const classifesData = classifes.map((classify) => ({
      name: classify.name,
      id: classify.id,
      level: classify.level,
      parentId: classify.parentId,
      createTime: dayjs(classify.createTime)
        .subtract(8, "hour")
        .format("YYYY-MM-DD HH:mm:ss"),
      updateTime: dayjs(classify.updateTime)
        .subtract(8, "hour")
        .format("YYYY-MM-DD HH:mm:ss"),
    }));
    res.send({
      code: 200,
      data: classifesData,
      message: "获取一级分类列表成功",
    });
  } catch (error) {
    next(error);
  }
};

// 获取二级分类
export const getTwoClassify = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 获取二级分类
    const { parentId } = req.params;
    const classifes = await Classify.find({
      parentId,
    })
      .sort({
        createTime: 1,
      })
      .lean();
    const classifesData = classifes.map((classify) => ({
      ...classify,
      createTime: dayjs(classify.createTime)
        .subtract(8, "hour")
        .format("YYYY-MM-DD HH:mm:ss"),
      updateTime: dayjs(classify.updateTime)
        .subtract(8, "hour")
        .format("YYYY-MM-DD HH:mm:ss"),
    }));
    res.send({
      code: 200,
      data: classifesData,
      message: "获取二级分类列表成功",
    });
  } catch (error) {
    next(error);
  }
};

// 获取三级分类
export const getThreeClassify = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 获取三级分类
    const { parentId } = req.params;
    const classifes = await Classify.find({
      parentId,
    })
      .sort({
        createTime: 1,
      })
      .lean();
    const classifesData = classifes.map((classify) => ({
      ...classify,
      createTime: dayjs(classify.createTime)
        .subtract(8, "hour")
        .format("YYYY-MM-DD HH:mm:ss"),
      updateTime: dayjs(classify.updateTime)
        .subtract(8, "hour")
        .format("YYYY-MM-DD HH:mm:ss"),
    }));
    res.send({
      code: 200,
      data: classifesData,
      message: "获取三级分类列表成功",
    });
  } catch (error) {
    next(error);
  }
};

/* 在查询时使用 lean() 方法，这样 Mongoose 会直接返回普通 JavaScript 对象，而不是 Mongoose 文档对象，减少内存占用 */
// 根据分类等级获取分类列表
export const getClassifyByLevel = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { level } = req.params;
    const classifes = await Classify.find({
      level,
    })
      .sort({
        createTime: 1,
      })
      .lean();
    const classifesData = classifes.map((classify) => ({
      ...classify,
      createTime: dayjs(classify.createTime)
        .subtract(8, "hour")
        .format("YYYY-MM-DD HH:mm:ss"),
      updateTime: dayjs(classify.updateTime)
        .subtract(8, "hour")
        .format("YYYY-MM-DD HH:mm:ss"),
    }));
    res.send({
      code: 200,
      data: classifesData,
      message: "获取分类列表成功",
    });
  } catch (error) {
    next(error);
  }
};

// 编辑时，修改分类级别，获取分类列表——排除掉自身
export const getClassifyByLevelForEdit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { level, id } = req.query;
    const classifes = await Classify.find({
      level,
      id: { $ne: id },
    })
      .sort({
        createTime: 1,
      })
      .lean();
    const classifesData = classifes.map((classify) => ({
      ...classify,
      createTime: dayjs(classify.createTime)
        .subtract(8, "hour")
        .format("YYYY-MM-DD HH:mm:ss"),
      updateTime: dayjs(classify.updateTime)
        .subtract(8, "hour")
        .format("YYYY-MM-DD HH:mm:ss"),
    }));
    res.send({
      code: 200,
      data: classifesData,
      message: "获取分类列表成功",
    });
  } catch (error) {
    next(error);
  }
};

// 新增分类
export const addClassify = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, level, parentId } = req.body;
    // 查看当前分类名字是否已存在与当前level下
    const classify = await Classify.findOne({
      name,
      level,
      parentId,
    });
    if (classify) {
      res.send({
        code: 400,
        data: null,
        message: "分类已存在",
      });
      return;
    }
    // 新增分类
    await Classify.create({
      name,
      level,
      parentId,
    });
    res.send({
      code: 200,
      data: classify,
      message: "新增分类成功",
    });
  } catch (error) {
    next(error);
  }
};

// 修改分类
export const updateClassify = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id, name, level, parentId } = req.body;
    // 查找要修改的分类
    const classify = await Classify.findOne({ id });
    if (!classify) {
      res.send({
        code: 400,
        data: null,
        message: "分类不存在",
      });
      return;
    }
    // 查看当前分类名字是否已存在与当前level下，不包含自身
    const classify2 = await Classify.findOne({
      name,
      level,
      parentId,
    });
    if (classify2 && classify2.id !== id) {
      res.send({
        code: 400,
        data: null,
        message: "分类已存在",
      });
      return;
    }
    // 如果当前分类下有子分类，则不能修改分类的level
    const classify3 = await Classify.find({
      parentId: id,
    });
    if (classify3.length > 0 && level !== classify.level) {
      res.send({
        code: 400,
        data: null,
        message: "分类下有子分类，不能修改分类的级别",
      });
      return;
    }
    // 更新分类
    await Classify.updateOne(
      { id },
      {
        name,
        level,
        parentId,
        updateTime: new Date(Date.now() + 8 * 60 * 60 * 1000),
      }
    );
    res.send({
      code: 200,
      data: null,
      message: "修改分类成功",
    });
  } catch (error) {
    next(error);
  }
};

// 删除分类
export const deleteClassify = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    // 查找要删除的分类
    const classify = await Classify.findOne({ id });
    if (!classify) {
      res.send({
        code: 400,
        data: null,
        message: "分类不存在",
      });
      return;
    }
    // 删除分类及其子分类
    await Classify.deleteMany({
      $or: [{ id }, { parentId: id }],
    });
    res.send({
      code: 200,
      data: null,
      message: "删除分类成功",
    });
  } catch (error) {
    next(error);
  }
};
