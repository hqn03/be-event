import { PrismaClient as MySQLClient } from "../generated/mysql/index.js";

const mysql = new MySQLClient();

const sessionEventService = {
  async createSessionEvent(idEvent, startTime, endTime) {
    return await mysql.pHIEN_SU_KIEN.create({
      data: {
        ma_su_kien: idEvent,
        thoi_gian_bat_dau: startTime,
        thoi_gian_ket_thuc: endTime,
      },
    });
  },
  async deleteSessionEvent(idSessionEvent) {
    return await mysql.pHIEN_SU_KIEN.delete({
      where: { id_phien_su_kien: idSessionEvent },
    });
  },
  async listSessionEvent(idEvent) {
    return await mysql.pHIEN_SU_KIEN.findMany({});
  },
};
