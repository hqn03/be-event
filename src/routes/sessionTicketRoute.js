import { Router } from "express";
import { errorResponse, successResponse } from "../utils/response.js";
import { PrismaClient as MySQLClient } from "../generated/mysql/index.js";
const mysql = new MySQLClient();

const sessionTicketRoute = Router();

sessionTicketRoute.put("/:sessionId", async (req, res) => {
  try {
  } catch (error) {}
});

sessionTicketRoute.delete("/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await mysql.pHIEN_SU_KIEN.delete({
      where: {
        id_phien_su_kien: sessionId,
      },
    });
    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    return res.status(400).json(error.message);
  }
});

sessionTicketRoute.get("/:idSession", async (req, res) => {
  const { idSession } = req.params;

  try {
    const result = await mysql.pHIEN_SU_KIEN.findUnique({
      where: {
        id_phien_su_kien: idSession,
      },
      include: {
        loaiVes: true,
      },
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json(error);
  }
});

sessionTicketRoute.get("/:sessionId/ordered-seats", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await mysql.gHE_DAT.findMany({
      where: {
        id_phien_su_kien: sessionId,
      },
      select: {
        id_ghe: true,
      },
    });
    const finalResult = result.map((i) => i.id_ghe);
    return res.status(200).json(finalResult);
  } catch (error) {
    console.log(error);
    return res.status(400).json(error.message);
  }
});

export default sessionTicketRoute;
