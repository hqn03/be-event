import { Router } from "express";
import userController from "../controllers/userController.js";

const userRoute = Router();

userRoute.get("/", userController.getUsers);

userRoute.post("/", userController.createUser);

userRoute.put("/:id", userController.updateUser);

userRoute.delete("/:id", userController.deleteUser);

// userRoute.get("/:id");
// userRoute.post("/");
// userRoute.delete("/:id");

export default userRoute;
