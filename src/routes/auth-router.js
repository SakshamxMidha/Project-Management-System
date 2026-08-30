import { Router } from "express";
import {
  changeCurrentPassword,
  forgotPassword,
  getCurrentUser,
  refreshAcessToken,
  registerUser,
  resendVerificationEmail,
  resetForgotPassword,
  userLogin,
  userLogout,
  verifyEmail,
} from "../controllers/auth-controller.js";
import { validate } from "../middleware/validor-middleware.js";
import {
  userValidation,
  loginValidator,
  forgotPasswordValidator,
  resetForgotPasswordValidator,
  CurrentPasswordValidator,
} from "../validators/user-validation.js";
import { verifyJWT } from "../middleware/auth-middleware.js";

const router = Router();

//unsecured
router.route("/register").post(userValidation(), validate, registerUser);
router.route("/login").post(loginValidator(), validate, userLogin);
router.route("/verify-email/:verificationToken").get(verifyEmail);
router.route("/refresh-token").post(refreshAcessToken);
router
  .route("/forgot-password")
  .post(forgotPasswordValidator(), validate, forgotPassword);

router
  .route("/reset-password/:Token")
  .post(resetForgotPasswordValidator(), validate, resetForgotPassword);

//secured
router.route("/logout").post(verifyJWT, userLogout);
router.route("/current-user").post(verifyJWT, getCurrentUser);
router
  .route("/change-password")
  .post(verifyJWT, CurrentPasswordValidator(), validate, changeCurrentPassword);
router
  .route("/resend-email-verification")
  .post(verifyJWT, resendVerificationEmail);

export default router;
