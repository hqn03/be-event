import cron from "node-cron";
import { PrismaClient as MySQLClient } from "../generated/mysql/index.js";
const mysql = new MySQLClient();

export function startExpireOrders() {
  // 1 phút mỗi ngày
  cron.schedule("*/1 * * * *", async () => {
    const now = new Date();
    await mysql.$transaction(async (tx) => {
      const datVes = await tx.dAT_VE.findMany({
        where: {
          trang_thai: "CHO_THANH_TOAN",
          het_han: { lt: now },
        },
        include: {
          chiTietDatVes: true,
        },
      });

      for (const datVe of datVes) {
        for (const chiTiet of datVe.chiTietDatVes) {
          if (chiTiet.id_ghe_dat) {
            await tx.gHE_DAT.delete({
              where: { id: chiTiet.id_ghe_dat },
            });
          }

          if (chiTiet.id_loai_ve) {
            await tx.lOAI_VE.update({
              where: {
                id_loai_ve: chiTiet.id_loai_ve,
              },
              data: {
                so_luong_con: {
                  increment: chiTiet.so_luong,
                },
              },
            });
          }
        }

        await tx.dAT_VE.update({
          where: {
            id: datVe.id,
          },
          data: {
            trang_thai: "HUY",
          },
        });
      }
    });
  });
}
