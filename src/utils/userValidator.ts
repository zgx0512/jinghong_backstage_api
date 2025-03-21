/* 
- notEmpty() : 非空验证
- isLength() : 长度验证
- isEmail() : 邮箱验证
- matches() : 正则匹配
- isNumeric() : 数字验证
- custom() : 自定义验证
 */

import { body } from "express-validator";

export const registerValidator = [
  body("username")
    .trim() // 去除首尾空格
    .notEmpty()
    .withMessage("用户名不能为空")
    .isLength({ min: 3, max: 12 })
    .withMessage("用户名长度应在3-12个字符之间")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("用户名只能包含字母、数字和下划线"),

  body("password")
    .notEmpty()
    .withMessage("密码不能为空")
    .isLength({ min: 6, max: 20 })
    .withMessage("密码长度应在6-20个字符之间")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/)
    .withMessage("密码必须包含大小写字母和数字"),

  body("email")
    .optional()
    .matches(
      /^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z0-9]{2,6}$/
    )
    .withMessage("请输入有效的邮箱地址"),
];
