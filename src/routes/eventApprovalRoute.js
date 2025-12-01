import { Router } from "express";
import { PrismaClient as MySQLClient } from "../generated/mysql/index.js";
import { eventApprovalController } from "../controllers/eventApprovalController.js";
const mysql = new MySQLClient();

const eventApprovalRoute = Router();

eventApprovalRoute.get("/", eventApprovalController.getApprovals);
eventApprovalRoute.post("/", eventApprovalController.creatApproval);

// eventApprovalRoute.get("/:id", eventApprovalController.getApproval);
eventApprovalRoute.put("/:id", eventApprovalController.updateApproval);

export default eventApprovalRoute;
