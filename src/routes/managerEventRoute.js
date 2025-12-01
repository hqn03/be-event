import { Router } from "express";
import managerEventController from "../controllers/managerEventController.js";
import { PrismaClient as MySQLClient } from "../generated/mysql/index.js";
import { nanoid } from "nanoid";
const mysql = new MySQLClient();

const managerEventRoute = Router();

managerEventRoute.put("/:eventId/sessions", async (req, res) => {
  const { eventId } = req.params;
  const { phienSuKiens } = req.body;
  try {
    await mysql.$transaction(async (tx) => {
      // Lấy danh sách session hiện tại trong DB
      const existing = await tx.pHIEN_SU_KIEN.findMany({
        where: { ma_su_kien: eventId },
        select: { id_phien_su_kien: true },
      });
      const existingIds = existing.map((s) => s.id_phien_su_kien);

      // Xác định session cần xoá
      const newIds = phienSuKiens
        .filter((s) => s.id_phien_su_kien)
        .map((s) => s.id_phien_su_kien);
      const toDelete = existingIds.filter((id) => !newIds.includes(id));

      // Xoá session và vé liên quan
      if (toDelete.length) {
        console.log("[Xoá session và vé liên quan]");
        await tx.lOAI_VE.deleteMany({
          where: { id_phien_su_kien: { in: toDelete } },
        });
        await tx.pHIEN_SU_KIEN.deleteMany({
          where: { id_phien_su_kien: { in: toDelete } },
        });
      }

      //Tạo hoặc cập nhật session mới
      for (const s of phienSuKiens) {
        if (s.id_phien_su_kien && existingIds.includes(s.id_phien_su_kien)) {
          // Update session
          await tx.pHIEN_SU_KIEN.update({
            where: { id_phien_su_kien: s.id_phien_su_kien },
            data: {
              thoi_gian_bat_dau: s.thoi_gian_bat_dau,
              thoi_gian_ket_thuc: s.thoi_gian_ket_thuc,
              thoi_gian_mo_dat_ve: s.thoi_gian_mo_dat_ve,
              thoi_gian_dong_dat_ve: s.thoi_gian_dong_dat_ve,
            },
          });

          // Update vé (xoá cũ, thêm mới)
          await tx.lOAI_VE.deleteMany({
            where: { id_phien_su_kien: s.id_phien_su_kien },
          });

          await tx.lOAI_VE.createMany({
            data: s.loaiVes.map((t) => ({
              ten_ve: t.ten_ve,
              gia_ve: t.gia_ve,
              so_luong_con: Number(t.so_luong_con),
              so_luong_mua_min: Number(t.so_luong_mua_min),
              so_luong_mua_max: Number(t.so_luong_mua_max),
              mo_ta: t.mo_ta,
              id_phien_su_kien: s.id_phien_su_kien,
            })),
          });
        } else {
          // Tạo mới session
          const newSession = await tx.pHIEN_SU_KIEN.create({
            data: {
              thoi_gian_bat_dau: s.thoi_gian_bat_dau,
              thoi_gian_ket_thuc: s.thoi_gian_ket_thuc,
              id_phien_su_kien: s.id_phien_su_kien,
              thoi_gian_mo_dat_ve: s.thoi_gian_mo_dat_ve,
              thoi_gian_dong_dat_ve: s.thoi_gian_dong_dat_ve,
              ma_su_kien: eventId,
            },
          });

          await tx.lOAI_VE.createMany({
            data: s.loaiVes.map((t) => ({
              ten_ve: t.ten_ve,
              gia_ve: t.gia_ve,
              so_luong_con: Number(t.so_luong_con),
              so_luong_mua_min: Number(t.so_luong_mua_min),
              so_luong_mua_max: Number(t.so_luong_mua_max),
              mo_ta: t.mo_ta,
              id_phien_su_kien: newSession.id_phien_su_kien,
            })),
          });
        }
      }
    });
    return res.status(200).json();
  } catch (error) {
    console.log(error.message);
  }
});

managerEventRoute.post("/", managerEventController.createEvent);

managerEventRoute.get("/", managerEventController.getEvents);

managerEventRoute.put("/:id", managerEventController.updateEvent);

managerEventRoute.get("/:id", managerEventController.getEvent);

managerEventRoute.delete("/:id", managerEventController.deleteEvent);

managerEventRoute.get("/:eventId/sessions", async (req, res) => {
  const { eventId } = req.params;

  try {
    const result = await mysql.pHIEN_SU_KIEN.findMany({
      where: { ma_su_kien: eventId },
      orderBy: {
        thoi_gian_bat_dau: "asc",
      },
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json(error.message);
  }
});

managerEventRoute.post("/:eventId/sessions", async (req, res) => {
  const {
    id_phien_su_kien,
    thoi_gian_bat_dau,
    thoi_gian_ket_thuc,
    thoi_gian_mo_dat_ve,
    thoi_gian_dong_dat_ve,
  } = req.body;

  const { eventId } = req.params;

  try {
    const result = await mysql.pHIEN_SU_KIEN.create({
      data: {
        id_phien_su_kien,
        thoi_gian_bat_dau,
        thoi_gian_ket_thuc,
        thoi_gian_mo_dat_ve,
        thoi_gian_dong_dat_ve,
        ma_su_kien: eventId,
      },
    });
    return res.status(201).json(result);
  } catch (error) {
    console.log(error);
    return res.status(400).json(error.message);
  }
  // const result = await mysql.pHIEN_SU_KIEN.
});

managerEventRoute.get("/:eventId/tickets", async (req, res) => {
  try {
    const { eventId } = req.params;
    const result = await mysql.pHIEN_SU_KIEN.findMany({
      where: { ma_su_kien: eventId },
      include: { loaiVes: true },
    });
    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    return res.status(400).json(error.message);
  }
});

managerEventRoute.post("/:eventId/tickets", async (req, res) => {
  try {
    const { eventId } = req.params;
    const {
      ten_ve,
      mo_ta,
      so_luong_con,
      so_luong_mua_max,
      so_luong_mua_min,
      gia_ve,
    } = req.body;

    const sessions = await mysql.pHIEN_SU_KIEN.findMany({
      where: { ma_su_kien: eventId },
      select: { id_phien_su_kien: true },
    });

    const ticketsToCreate = sessions.map((session) => ({
      ...req.body,
      id_loai_ve: nanoid(),
      id_phien_su_kien: session.id_phien_su_kien,
    }));
    const result = await mysql.lOAI_VE.createMany({
      data: ticketsToCreate,
    });
    return res.status(201).json(ticketsToCreate);
  } catch (error) {
    console.log(error);
  }
});

managerEventRoute.put("/:eventId/seats", async (req, res) => {
  try {
    const { eventId } = req.params;
    const payload = req.body;

    const incomingIds = payload.map((s) => s.id);

    await mysql.gHE.deleteMany({
      where: {
        ma_su_kien: eventId,
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

export default managerEventRoute;
