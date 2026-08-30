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

const loginValidator = () => {
  return [
    body("email")
      .isEmail()
      .withMessage("Enter a valid email")
      .notEmpty()
      .withMessage("Email is required"),

    body("password").notEmpty().withMessage("password is required"),
  ];
};

const CurrentPasswordValidator = () => {
  return [
    body("oldPass").notEmpty().withMessage("old password is required"),

    body("newPass").notEmpty().withMessage("new password is required"),
  ];
};

const forgotPasswordValidator = () => {
  return [
    body("email")
      .isEmail()
      .withMessage("Enter a valid email")
      .notEmpty()
      .withMessage("Email is required"),
  ];
};

const resetForgotPasswordValidator = () => {
  return [body("newPass").notEmpty().withMessage("Password is required")];
};

export {
  userValidation,
  loginValidator,
  CurrentPasswordValidator,
  forgotPasswordValidator,
  resetForgotPasswordValidator,
};
