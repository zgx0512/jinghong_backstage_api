import { Router } from "express";
import { getSpecList, addSpec } from "../route-handle/spec";

const router = Router();

router.get("/getSpecList", getSpecList);
router.post("/addSpec", addSpec);

export default router;