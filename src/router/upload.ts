import { Request, Response, Router } from "express";
import multer, { Multer, FileFilterCallback } from "multer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

// 加载环境变量
dotenv.config();

// 初始化 Express 路由
const router = Router();

// 配置 Multer（内存存储，限制文件类型和大小）
const upload: Multer = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 限制 10MB
  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("只允许上传图片文件") as any, false);
  },
});

// 初始化 Cloudflare R2 客户端
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

// 文件上传接口
router.post(
  "/upload",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) throw new Error("未收到文件");

      const file: Express.Multer.File = req.file;
      const key: string = `uploads/${Date.now()}-${file.originalname}`;

      // 上传到 R2
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
      );

      // 生成可直接访问的 URL
      const publicUrl: string = `${process.env.PUBLIC_DOMAIN}/${key}`;
      res.send({
        code: 200,
        data: { url: publicUrl },
        message: "上传成功",
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "上传失败";
      res.status(500).send({
        code: 500,
        data: null,
        message: message,
      })
    }
  }
);

export default router;
