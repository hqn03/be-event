import { Router } from "express";
import { PrismaClient as MySQLClient } from "../generated/mysql/index.js";

const mysql = new MySQLClient();

const roleRouter = Router();

roleRouter.get("/", async (req, res) => {
  try {
    const result = await mysql.vAI_TRO.findMany();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json(error.message);
  }
});

export default roleRouter;
