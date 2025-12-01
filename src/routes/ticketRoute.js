import express from "express";

const ticketRoute = express.Router();
import { PrismaClient as MySQLClient } from "../generated/mysql/index.js";
const mysql = new MySQLClient();

ticketRoute.put("/:ticketId", async (req, res) => {
  try {
    const { ticketId } = req.params;
    const result = await mysql.lOAI_VE.update({
      where: { id_loai_ve: ticketId },
      data: {
        ...req.body,
      },
    });
    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    return res.status(400).json(error.message);
  }
});

ticketRoute.delete("/:ticketId", async (req, res) => {
  try {
    const { ticketId } = req.params;
    const result = await mysql.lOAI_VE.delete({
      where: { id_loai_ve: ticketId },
    });
    console.log(result);
    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    return res.status(200).json(error.message);
  }
});

export default ticketRoute;
