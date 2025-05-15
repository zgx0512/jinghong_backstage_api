import { Router } from "express";
import { addBtn, updateBtn, removeBtn } from "../route-handle/btn";

const router = Router();

router.post("/acl/addBtn", addBtn);
router.put("/acl/updateBtn", updateBtn);
router.delete("/acl/removeBtn/:id", removeBtn);

export default router;