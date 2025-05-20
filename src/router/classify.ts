import { Router } from 'express';
import {
  getAllClassify,
  getOneClassify,
  getTwoClassify,
  getThreeClassify,
  getClassifyByLevel,
  addClassify,
  updateClassify,
  deleteClassify,
  getClassifyByLevelForEdit,
} from "../route-handle/classify";

const router = Router();

// 获取所有分类 
router.get("/getAllClassify", getAllClassify);

// 获取一级分类
router.get("/getOneClassify", getOneClassify);

// 获取二级分类
router.get("/getTwoClassify/:parentId", getTwoClassify);

// 获取三级分类
router.get("/getThreeClassify/:parentId", getThreeClassify);

// 根据等级获取分类
router.get("/getClassifyByLevel/:level", getClassifyByLevel);

// 根据等级获取分类列表——编辑
router.get("/getClassifyByLevelForEdit", getClassifyByLevelForEdit);

// 新增分类
router.post("/addClassify", addClassify);

// 修改分类
router.put("/updateClassify", updateClassify);

// 删除分类
router.delete("/deleteClassify/:id", deleteClassify);

export default router;