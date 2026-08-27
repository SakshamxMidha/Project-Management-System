import { Router } from "express";
import { registerUser } from "../controllers/auth-controller.js";
import { validate } from "../middleware/validor-middleware.js";
import { userValidation } from "../validators/user-validation.js";

const router = Router();

router.route("/register").post(userValidation(), validate, registerUser);

export default router;
