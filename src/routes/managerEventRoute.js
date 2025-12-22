import { Router } from "express";
import managerEventController from "../controllers/managerEventController.js";
import {
  PrismaClient as MySQLClient,
  Prisma,
} from "../generated/mysql/index.js";
import { nanoid } from "nanoid";
import { calcAge, formatDate } from "../utils/datetime.js";
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

managerEventRoute.get("/:eventId/orders", async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1); // 1-based
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const { eventId } = req.params;
    const { from, to } = req.query;
    const where = { trang_thai: "HOAN_TAT" };
    if (from || to) {
      where.ngay_tao = {};
      if (from) where.ngay_tao.gte = new Date(from);
      if (to) where.ngay_tao.lte = new Date(to);
    }

    const phienIds = await mysql.pHIEN_SU_KIEN
      .findMany({
        where: { ma_su_kien: eventId },
        select: { id_phien_su_kien: true },
      })
      .then((value) => value.map((i) => i.id_phien_su_kien));

    // Đếm tổng bản ghi
    const totalItems = await mysql.dAT_VE.count({ where });
    const totalPages = Math.ceil(totalItems / limit);

    const items = await mysql.dAT_VE
      .findMany({
        skip,
        take: limit,
        orderBy: {
          ngay_tao: "desc",
        },
        where: {
          ...where,
          id_phien_su_kien: { in: phienIds },
        },
        include: {
          nguoi_dat_ve: {
            select: { nguoi_dung: { select: { ho_ten: true } } },
          },
          chiTietDatVes: { select: { so_luong: true } },
        },
      })
      .then((list) =>
        list.map((i) => ({
          ma_don_hang: i.ma_don_hang,
          tong_tien: i.tong_tien,
          ngay_tao: formatDate(i.ngay_tao),
          ho_ten: i.nguoi_dat_ve.nguoi_dung.ho_ten,
          so_ve: i.chiTietDatVes.reduce((sum, v) => sum + v.so_luong, 0),
        }))
      );
    return res.status(200).json({
      items,
      page,
      limit,
      totalItems,
      totalPages,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
});

managerEventRoute.get("/:eventId/reports/orders-by-day", async (req, res) => {
  const { eventId } = req.params;
  try {
    const phienIds = await mysql.pHIEN_SU_KIEN
      .findMany({
        where: { ma_su_kien: eventId },
        select: { id_phien_su_kien: true },
      })
      .then((value) => {
        return value.map((i) => i.id_phien_su_kien);
      });

    const result = await mysql.$queryRaw`
    SELECT DATE(dv.ngay_tao) AS date,
      COUNT(DISTINCT dv.ma_don_hang) AS so_don,
      SUM(ct.so_luong)AS so_ve,
      SUM(dv.tong_tien) AS doanh_thu
    FROM DAT_VE dv
    JOIN CHI_TIET_DAT_VE ct
      ON ct.ma_don_hang = dv.ma_don_hang
    WHERE dv.id_phien_su_kien IN (${Prisma.join(phienIds)})
      AND dv.trang_thai = 'HOAN_TAT'
    GROUP BY DATE(dv.ngay_tao)
    ORDER BY date ASC;`;

    const safe = result.map((r) => ({
      ngay: formatDate(r.date),
      so_don: Number(r.so_don),
      so_ve: Number(r.so_ve),
      doanh_thu: Number(r.doanh_thu),
    }));

    return res.status(200).json(safe);
  } catch (error) {
    console.log(error);
  }
});

managerEventRoute.get("/:eventId/reports/gender", async (req, res) => {
  try {
    const { eventId } = req.params;

    const data = await mysql.$queryRaw`
      SELECT nd.gioi_tinh, CAST(SUM(ct.so_luong) AS SIGNED) AS so_ve
      FROM DAT_VE dv
      JOIN CHI_TIET_DAT_VE ct ON ct.ma_don_hang = dv.ma_don_hang
      JOIN KHACH k ON k.ma_khach = dv.ma_khach
      JOIN NGUOI_DUNG nd ON nd.id_nguoi_dung = k.id_nguoi_dung
      WHERE dv.id_phien_su_kien IN (
        SELECT id_phien_su_kien FROM PHIEN_SU_KIEN WHERE ma_su_kien = ${eventId}
      )
        AND dv.trang_thai = 'HOAN_TAT'
      GROUP BY nd.gioi_tinh
      `;

    const result = data.map((i) => ({
      ...i,
      so_ve: Number(i.so_ve),
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
});

managerEventRoute.get("/:eventId/reports/age", async (req, res) => {
  try {
    const { eventId } = req.params;

    const rows = await mysql.$queryRaw`
    SELECT TIMESTAMPDIFF(YEAR,nd.ngay_sinh,CONVERT_TZ(NOW(), '+00:00', '+07:00')) AS tuoi,
      CAST(SUM(ct.so_luong) AS SIGNED) AS so_ve
    FROM DAT_VE dv
    JOIN CHI_TIET_DAT_VE ct ON ct.ma_don_hang = dv.ma_don_hang
    JOIN KHACH k ON k.ma_khach = dv.ma_khach
    JOIN NGUOI_DUNG nd ON nd.id_nguoi_dung = k.id_nguoi_dung
    WHERE dv.id_phien_su_kien IN (
      SELECT id_phien_su_kien FROM PHIEN_SU_KIEN WHERE ma_su_kien = ${eventId}
    )
      AND dv.trang_thai = 'HOAN_TAT'
    GROUP BY tuoi
    `;

    const doTuois = [
      { nhom_tuoi: "20-30", so_ve: 0 },
      { nhom_tuoi: "30-40", so_ve: 0 },
      { nhom_tuoi: "40-50", so_ve: 0 },
      { nhom_tuoi: "50-60", so_ve: 0 },
      { nhom_tuoi: "Trống", so_ve: 0 },
    ];

    const getAgeIndex = (age) => {
      if (!age) return 4; // Không xác định
      if (age >= 20 && age < 30) return 0;
      if (age >= 30 && age < 40) return 1;
      if (age >= 40 && age < 50) return 2;
      if (age >= 50 && age < 60) return 3;
      return 4;
    };

    rows.forEach((r) => {
      const age = r.tuoi !== null ? Number(r.tuoi) : null;
      const count = Number(r.so_ve);

      const index = getAgeIndex(age);
      doTuois[index].so_ve += count;
    });

    return res.status(200).json(doTuois);
  } catch (error) {
    console.log(error);
  }
});

export default managerEventRoute;
