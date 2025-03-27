import { Router } from "express";
import { addBtn } from "../route-handle/btn";

const router = Router();

router.post("/acl/addBtn", addBtn);

export default router;