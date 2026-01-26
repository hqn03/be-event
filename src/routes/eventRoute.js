import { Router } from "express";
import { PrismaClient as MySQLClient } from "../generated/mysql/index.js";
const mysql = new MySQLClient();

const eventRoute = Router();

eventRoute.get("/", async (req, res) => {
  try {
    const typeEvents = await mysql.lOAI_SU_KIEN.findMany();

    const result = await Promise.all(
      typeEvents.map((type) =>
        mysql.sU_KIEN
          .findMany({
            where: {
              ngay_ket_thuc: { gte: new Date() },
              id_loai_su_kien: type.id,
              trang_thai: "SAP_DIEN_RA",
            },
            take: 3,
            orderBy: { ngay_bat_dau: "asc" },
          })
          .then((events) => {
            return {
              loai_su_kien: type.ten_loai_su_kien,
              duong_dan: type.duong_dan,
              suKiens: [...events],
            };
          })
      )
    );

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json(error.message);
  }
});

eventRoute.get("/search", async (req, res) => {
  try {
    let { q, type } = req.query;

    if (!type || type === "undefined") type = undefined;
    if (!q || q === "undefined") q = undefined;

    const events = await mysql.sU_KIEN.findMany({
      where: {
        trang_thai: { in: ["SAP_DIEN_RA", "DANG_DIEN_RA", "KET_THUC"] },
        ...(q && { ten_su_kien: { contains: q } }),
        ...(type && { loai_su_kien: { duong_dan: type } }),
      },
      orderBy: [{ trang_thai: "asc" }, { ngay_ket_thuc: "desc" }],
    });

    return res.status(200).json(events);
  } catch (error) {
    console.log(error);
    return res.status(400).json(error.message);
  }
});

eventRoute.get("/:slug", async (req, res) => {
  const { slug: duong_dan } = req.params;

  try {
    // const result = await mysql.$transaction(async (tx) => {
    //   const event = await tx.sU_KIEN.findUnique({
    //     where: {
    //       duong_dan,
    //     },
    //     include: {
    //       ghes: true,
    //       phienSuKiens: {
    //         include: {
    //           loaiVes: true,
    //           gheDats: true,
    //         },
    //         omit: {
    //           ma_su_kien: true,
    //         },
    //       },
    //     },
    //   });

    //   if (event.ghes.length === 0) {
    //     return event;
    //   } else {
    //     for (const phien of event.phienSuKiens) {
    //       const bookedIds = phien.gheDats.map((g) => g.id_ghe);

    //       const availableSeats = event.ghes
    //         .filter((s) => s.loai === "seat" && !bookedIds.includes(s.id))
    //         .reduce((acc, seat) => {
    //           const key = seat.loai_ghe;

    //           if (!acc[key]) {
    //             acc[key] = {
    //               ten_loai_ve: seat.loai_ghe,
    //               so_luong_con: 0,
    //               gia_ve: seat.gia,
    //             };
    //           }

    //           acc[key].so_luong_con += 1;
    //           return acc;
    //         }, {});

    //       phien.loaiVes = Object.values(availableSeats);
    //     }

    //     return event;
    //   }
    // });

    const result = await mysql.sU_KIEN.findUnique({
      where: { duong_dan },
      include: {
        phienSuKiens: {
          select: {
            id_phien_su_kien: true,
            thoi_gian_bat_dau: true,
            thoi_gian_ket_thuc: true,
            thoi_gian_mo_dat_ve: true,
            thoi_gian_dong_dat_ve: true,
          },
        },
      },
      omit: {
        ma_nhan_vien: true,
        ngay_cap_nhat: true,
        ngay_xoa: true,
      },
    });

    const phienIds = await mysql.pHIEN_SU_KIEN
      .findMany({ where: { ma_su_kien: result.ma_su_kien } })
      .then((value) => value.map((i) => i.id_phien_su_kien));

    const loaiGhes = await mysql.$queryRaw`
    SELECT DISTINCT loai_ghe, gia
FROM GHE
WHERE ma_su_kien = ${result.ma_su_kien}
  AND loai_ghe <> ''`;

    let loaiVes = {};
    if (loaiGhes.length > 0) {
      loaiGhes.map((loaiGhe) => {
        return phienIds.map((phien) => {
          if (!loaiVes[phien]) {
            loaiVes[phien] = [];
          }
          loaiVes[phien].push({
            ten_ve: loaiGhe.loai_ghe,
            gia_ve: loaiGhe.gia,
            mo_ta: null,
          });
        });
      });
    } else {
      await mysql.lOAI_VE
        .findMany({
          where: { id_phien_su_kien: { in: phienIds } },
        })
        .then((value) =>
          value.map((i) => {
            if (!loaiVes[i.id_phien_su_kien]) {
              loaiVes[i.id_phien_su_kien] = [];
            }
            loaiVes[i.id_phien_su_kien].push({
              ten_ve: i.ten_ve,
              gia_ve: i.gia_ve,
              mo_ta: i.mo_ta,
            });
          })
        );
    }

    return res.status(200).json({ ...result, loaiVes });
  } catch (error) {
    console.log(error);
    return res.status(400).json(error.message);
  }
});

eventRoute.get("/:id/seats", async (req, res) => {
  try {
    const { id: ma_su_kien } = req.params;

    const result = await mysql.gHE.findMany({
      where: { ma_su_kien },
      orderBy: { ngay_tao: "asc" },
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json(error.message);
  }
});

export default eventRoute;
