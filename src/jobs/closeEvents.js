import cron from "node-cron";
import { PrismaClient as MySQLClient } from "../generated/mysql/index.js";
const mysql = new MySQLClient();

export function closeEvent() {
  cron.schedule(
    "0 0 * * *",
    async () => {
      const now = new Date();

      await mysql.sU_KIEN.updateMany({
        where: { trang_thai: "SAP_DIEN_RA", ngay_ket_thuc: { lt: now } },
        data: { trang_thai: "KET_THUC" },
      });
    },
    { timezone: "Asia/Ho_Chi_Minh" }
  );
}
