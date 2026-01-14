import { Router } from "express";

import { PrismaClient as MySQLClient } from "../generated/mysql/index.js";
const mysql = new MySQLClient();

const seatRoute = Router();

seatRoute.put("/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    const payload = req.body;

    const existing = await mysql.gHE.findMany({
      where: {
        ma_su_kien: eventId,
      },
    });

    const incomingIds = payload.map((s) => s.id);

    await mysql.gHE.deleteMany({
      where: {
        id: { notIn: incomingIds },
      },
    });

    for (const item of payload) {
      await mysql.gHE.upsert({
        where: {
          id: item.id,
        },
        update: {
          hang_ghe: item.hang_ghe,
          gia: item.gia,
          loai: item.loai,
          loai_ghe: item.loai_ghe,
        },
        create: {
          gia: item.gia,
          id: item.id,
          hang_ghe: item.hang_ghe,
          loai: item.loai,
          loai_ghe: item.loai_ghe,
          ma_su_kien: eventId,
          ma_ghe: item.ma_ghe,
        },
      });
    }

    return res.status(200).json({});
  } catch (error) {
    console.log(error);
    return res.status(400).json(error.message);
  }
});

seatRoute.get("/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;

    const result = await mysql.gHE.findMany({
      where: { ma_su_kien: eventId },
      orderBy: { ngay_tao: "asc" },
    });

    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    return res.status(400).json(error.message);
  }
});

seatRoute.get("/:sessionId/ordered", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await mysql.gHE_DAT.findMany({
      where: { id_phien_su_kien: sessionId },
      select: { id_ghe: true },
    });
    const finalResult = result.map((i) => i.id_ghe);
    return res.status(200).json(finalResult);
  } catch (error) {
    console.log(error);
    return res.status(400).json(error.message);
  }
});

export default seatRoute;
