import cron from "node-cron";
import { PrismaClient as MySQLClient } from "../generated/mysql/index.js";
const mysql = new MySQLClient();

export function startExpireOrders() {
  // 5 phút mỗi ngày
  cron.schedule("*/5 * * * *", async () => {
    const now = new Date();

    // Lấy danh sách hết hạn
    const datVes = await mysql.dAT_VE.findMany({
      where: {
        trang_thai: "CHO_THANH_TOAN",
        het_han: { lt: now },
      },
      include: { chiTietDatVes: true },
    });

    if (datVes.length === 0) return;

    for (const datVe of datVes) {
      // 1 transaction nhỏ cho từng order
      await mysql.$transaction(async (tx) => {
        const tasks = [];

        for (const ct of datVe.chiTietDatVes) {
          // delete ghế
          if (ct.id_ghe_dat) {
            tasks.push(
              tx.gHE_DAT.delete({
                where: { id: ct.id_ghe_dat },
              })
            );
          }

          // trả lại số lượng vé
          if (ct.id_loai_ve) {
            tasks.push(
              tx.lOAI_VE.update({
                where: { id_loai_ve: ct.id_loai_ve },
                data: {
                  so_luong_con: { increment: ct.so_luong },
                },
              })
            );
          }
        }

        // chạy song song trong transaction
        await Promise.all(tasks);

        // update trạng thái
        await tx.dAT_VE.update({
          where: { id: datVe.id },
          data: { trang_thai: "HUY" },
        });
      });
    }
  });
}
