import { Router } from "express";
import { registerUser, userLogin } from "../controllers/auth-controller.js";
import { validate } from "../middleware/validor-middleware.js";
import { userValidation, loginValidator } from "../validators/user-validation.js";

const router = Router();

router.route("/register").post(userValidation(), validate, registerUser);
router.route("/login").post(loginValidator(), validate, userLogin);

export default router;
