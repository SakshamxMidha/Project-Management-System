import { Router } from "express";
import { registerUser, userLogin, userLogout } from "../controllers/auth-controller.js";
import { validate } from "../middleware/validor-middleware.js";
import { userValidation, loginValidator } from "../validators/user-validation.js";
import { verifyJWT } from "../middleware/auth-middleware.js";

const router = Router();

router.route("/register").post(userValidation(), validate, registerUser);
router.route("/login").post(loginValidator(), validate, userLogin);
router.route("/logout").post(verifyJWT, userLogout);

export default router;
