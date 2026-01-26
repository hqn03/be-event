import { Router } from "express";
import {
  PrismaClient as MySQLClient,
  Prisma,
} from "../../generated/mysql/index.js";
import { formatDate } from "../../utils/datetime.js";

const mysql = new MySQLClient();

const adminRoute = Router();

adminRoute.get("/orders", async (req, res) => {
  try {
    const isAll = req.query.limit === "all";
    const page = Math.max(parseInt(req.query.page) || 1, 1); // 1-based
    const limit = isAll
      ? undefined
      : Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = isAll ? undefined : (page - 1) * limit;

    const { from, to, q } = req.query;
    const fromDate = from
      ? new Date(from)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    const where = { trang_thai: "HOAN_TAT" };

    if (q) {
      where.OR = [
        { phienSuKien: { su_kien: { ten_su_kien: { contains: q } } } },
        { phienSuKien: { su_kien: { ma_su_kien: { contains: q } } } },
      ];
    }

    // filter date
    where.ngay_tao = {
      gte: fromDate,
      lte: toDate,
    };

    // Đếm tổng bản ghi
    const totalItems = await mysql.dAT_VE.count({ where });
    const totalPages = Math.ceil(totalItems / limit);

    // Lấy dữ liệu theo page
    const items = await mysql.dAT_VE
      .findMany({
        where,
        ...(isAll ? {} : { skip, take: limit }),
        orderBy: {
          ngay_tao: "desc", // nên có
        },
        include: {
          phienSuKien: {
            select: {
              su_kien: {
                select: {
                  ten_su_kien: true,
                  ma_su_kien: true,
                  ma_nhan_vien: true,
                },
              },
            },
          },
        },
      })
      .then((values) =>
        values.map((i) => ({ ...i, ngay_tao: formatDate(i.ngay_tao) }))
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
    return res.status(200).json(error);
  }
});

adminRoute.get("/orders/:idOrder", async (req, res) => {
  try {
    const { idOrder } = req.params;
    const test = await mysql.dAT_VE.findUnique({
      where: { ma_don_hang: idOrder },
      include: {
        chiTietDatVes: true,
        nguoi_dat_ve: {
          select: {
            nguoi_dung: {
              select: { ho_ten: true, email: true, so_dien_thoai: true },
            },
          },
        },
        phienSuKien: {
          select: {
            su_kien: { select: { ten_su_kien: true, ma_su_kien: true } },
          },
        },
      },
    });

    res.status(200).json(test);
  } catch (error) {
    console.log(error);
    res.status(200).json(error);
  }
});

// adminRoute.use("/reports/orders-by-day", async (req, res) => {
//   try {
//     const { from, to, q } = req.query;
//     const fromDate = from
//       ? new Date(from)
//       : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
//     const toDate = to ? new Date(to) : new Date();
//     const keyword = q ? `%${q}%` : null;

//     const result = await mysql.$queryRaw`
//     WITH RECURSIVE dates AS (
//         SELECT DATE(${fromDate}) AS d
//         UNION ALL
//         SELECT DATE_ADD(d, INTERVAL 1 DAY)
//         FROM dates
//         WHERE d < DATE(${toDate})
//     ),
//     filtered_orders AS (
//         SELECT dv.*
//         FROM DAT_VE dv
//         INNER JOIN PHIEN_SU_KIEN psk ON psk.id_phien_su_kien = dv.id_phien_su_kien
//         INNER JOIN SU_KIEN sk ON sk.ma_su_kien = psk.ma_su_kien
//         WHERE dv.trang_thai = 'HOAN_TAT' AND (${keyword} IS NULL OR sk.ten_su_kien LIKE ${keyword} OR sk.ma_su_kien LIKE ${keyword})
//     )
//     SELECT dates.d AS date, COUNT(DISTINCT fo.ma_don_hang) AS so_don, COALESCE(SUM(ct.so_luong), 0) AS so_ve, COALESCE(SUM(fo.tong_tien), 0) AS doanh_thu
//     FROM dates
//     LEFT JOIN filtered_orders fo ON DATE(fo.ngay_tao) = dates.d
//     LEFT JOIN CHI_TIET_DAT_VE ct ON ct.ma_don_hang = fo.ma_don_hang
//     GROUP BY dates.d
//     ORDER BY dates.d;
//     `;

//     const safe = result.map((r) => ({
//       ngay: formatDate(r.date),
//       so_don: Number(r.so_don),
//       so_ve: Number(r.so_ve),
//       doanh_thu: Number(r.doanh_thu),
//     }));

//     return res.status(200).json(safe);
//   } catch (error) {
//     console.log(error);
//   }
// });

adminRoute.use("/reports/gender", async (req, res) => {
  try {
    const { from, to, q } = req.query;
    const fromDate = from
      ? new Date(from)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();
    const keyword = q ? `%${q}%` : null;

    const whereDate = [];

    if (from && to) {
      whereDate.push(
        Prisma.sql`dv.ngay_tao BETWEEN ${new Date(from)} AND ${new Date(to)}`
      );
    } else if (from) {
      whereDate.push(Prisma.sql`dv.ngay_tao >= ${new Date(from)}`);
    } else if (to) {
      whereDate.push(Prisma.sql`dv.ngay_tao <= ${new Date(to)}`);
    }

    const dateCondition =
      whereDate.length > 0
        ? Prisma.sql`AND ${Prisma.join(whereDate, Prisma.sql` AND `)}`
        : Prisma.sql``;

    const data = await mysql.$queryRaw`
        SELECT nd.gioi_tinh, CAST(SUM(ct.so_luong) AS SIGNED) AS so_ve
        FROM DAT_VE dv
        JOIN CHI_TIET_DAT_VE ct ON ct.ma_don_hang = dv.ma_don_hang
        JOIN KHACH k ON k.ma_khach = dv.ma_khach
        JOIN NGUOI_DUNG nd ON nd.id_nguoi_dung = k.id_nguoi_dung
        JOIN PHIEN_SU_KIEN psk ON psk.id_phien_su_kien = dv.id_phien_su_kien
        JOIN SU_KIEN sk ON sk.ma_su_kien = psk.ma_su_kien
        WHERE dv.trang_thai = 'HOAN_TAT'
            ${dateCondition}
            AND (${keyword} IS NULL OR sk.ten_su_kien LIKE ${keyword} OR sk.ma_su_kien LIKE ${keyword})
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

adminRoute.use("/reports/age", async (req, res) => {
  try {
    const { from, to, q } = req.query;
    const fromDate = from
      ? new Date(from)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();
    const keyword = q ? `%${q}%` : null;

    const rows = await mysql.$queryRaw`
        SELECT TIMESTAMPDIFF(YEAR,nd.ngay_sinh,CONVERT_TZ(NOW(), '+00:00', '+07:00')) AS tuoi,
        CAST(SUM(ct.so_luong) AS SIGNED) AS so_ve
        FROM DAT_VE dv
        JOIN CHI_TIET_DAT_VE ct ON ct.ma_don_hang = dv.ma_don_hang
        JOIN KHACH k ON k.ma_khach = dv.ma_khach
        JOIN NGUOI_DUNG nd ON nd.id_nguoi_dung = k.id_nguoi_dung
        JOIN PHIEN_SU_KIEN psk ON psk.id_phien_su_kien = dv.id_phien_su_kien
        JOIN SU_KIEN sk ON sk.ma_su_kien = psk.ma_su_kien
        WHERE dv.trang_thai = 'HOAN_TAT'
            AND dv.ngay_tao BETWEEN ${fromDate} AND ${toDate}
            AND (${keyword} IS NULL OR sk.ten_su_kien LIKE ${keyword} OR sk.ma_su_kien LIKE ${keyword})
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
adminRoute.use("/reports/event-type", async (req, res) => {
  try {
    const { from, to, q } = req.query;
    const fromDate = from
      ? new Date(from)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();
    const keyword = q ? `%${q}%` : null;

    const data = await mysql.$queryRaw`
SELECT
  lsk.id AS id_loai_su_kien,
  lsk.ten_loai_su_kien,
  CAST(SUM(ct.so_luong) AS SIGNED) AS so_ve,
  COALESCE(SUM(dv.tong_tien), 0) AS doanh_thu
FROM DAT_VE dv
JOIN CHI_TIET_DAT_VE ct
  ON ct.ma_don_hang = dv.ma_don_hang
JOIN PHIEN_SU_KIEN psk
  ON psk.id_phien_su_kien = dv.id_phien_su_kien
JOIN SU_KIEN sk
  ON sk.ma_su_kien = psk.ma_su_kien
JOIN LOAI_SU_KIEN lsk
  ON lsk.id = sk.id_loai_su_kien
WHERE dv.trang_thai = 'HOAN_TAT'
  AND dv.ngay_tao BETWEEN ${fromDate} AND ${toDate}
  AND (
    ${keyword} IS NULL
    OR sk.ten_su_kien LIKE ${keyword}
    OR sk.ma_su_kien LIKE ${keyword}
  )
GROUP BY lsk.id, lsk.ten_loai_su_kien
ORDER BY doanh_thu DESC;
`;

    const result = data.map((i) => ({
      ...i,
      so_ve: Number(i.so_ve),
      doanh_thu: Number(i.doanh_thu),
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
  }
});

export default adminRoute;
