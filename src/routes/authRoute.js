import { Router } from "express";

import authController from "../controllers/authController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
const router = Router();

router.post("/login", authController.login);

router.post("/sign-up", authController.signUp);

router.get("/me", authController.getMe);

// router.get("/verify", verifyAccount);

export default router;
