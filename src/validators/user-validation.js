import { body } from "express-validator";

const userValidation = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("email cannot be empty")
      .isEmail()
      .withMessage("write a valid email"),

    body("username")
      .trim()
      .notEmpty()
      .withMessage("username cannot be empty")
      .isLowercase()
      .withMessage("username must be in lowercase")
      .isLength({ min: 3 })
      .withMessage("username too short"),

    body("password").trim().notEmpty().withMessage("password cannot be empty"),

    body("fullName").optional().trim(),
  ];
};

export { userValidation };
