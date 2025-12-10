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
              ngay_ket_thuc: {
                gte: new Date(),
              },
              id_loai_su_kien: type.id,
              trang_thai: "DA_DUYET",
            },
            take: 6,
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
        trang_thai: {
          in: ["DA_DUYET", "KET_THUC"],
        },
        ...(q && {
          ten_su_kien: {
            contains: q,
          },
        }),
        ...(type && {
          loai_su_kien: {
            duong_dan: type,
          },
        }),
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
    const result = await mysql.$transaction(async (tx) => {
      const event = await tx.sU_KIEN.findUnique({
        where: {
          duong_dan,
        },
        include: {
          ghes: true,
          phienSuKiens: {
            include: {
              loaiVes: true,
              gheDats: true,
            },
            omit: {
              ma_su_kien: true,
            },
          },
        },
      });

      if (event.ghes.length === 0) {
        return event;
      } else {
        for (const phien of event.phienSuKiens) {
          const bookedIds = phien.gheDats.map((g) => g.id_ghe);

          const availableSeats = event.ghes
            .filter((s) => s.loai === "seat" && !bookedIds.includes(s.id))
            .reduce((acc, seat) => {
              const key = seat.loai_ghe;

              if (!acc[key]) {
                acc[key] = {
                  ten_loai_ve: seat.loai_ghe,
                  so_luong_con: 0,
                  gia_ve: seat.gia,
                };
              }

              acc[key].so_luong_con += 1;
              return acc;
            }, {});

          phien.loaiVes = Object.values(availableSeats);
        }

        return event;
      }
    });

    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    return res.status(400).json(error.message);
  }
});

eventRoute.get("/:id/seats", async (req, res) => {
  try {
    const { id: ma_su_kien } = req.params;
    const result = await mysql.gHE.findMany({
      where: {
        ma_su_kien,
      },
      orderBy: {
        ngay_tao: "asc",
      },
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json(error.message);
  }
});

export default eventRoute;
