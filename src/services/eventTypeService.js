import slugify from "slugify";
import { PrismaClient as MySQLClient } from "../generated/mysql/index.js";
import { nanoid } from "nanoid";
const mysql = new MySQLClient();

const eventTypeService = {
  async listEventType() {
    return await mysql.lOAI_SU_KIEN.findMany({
      where: { ngay_xoa: null },
    });
  },

  async createEventType({ ten_loai_su_kien, duong_dan, mo_ta }) {
    const baseSlug = slugify(ten_loai_su_kien, { lower: true });
    return await mysql.lOAI_SU_KIEN.create({
      data: {
        ten_loai_su_kien,
        duong_dan: duong_dan || baseSlug,
        mo_ta: mo_ta,
      },
    });
  },

  async updateEventType({ id, ten_loai_su_kien, duong_dan, mo_ta }) {
    return await mysql.lOAI_SU_KIEN.update({
      where: { id },
      data: { ten_loai_su_kien, duong_dan: duong_dan, mo_ta },
    });
  },

  async deleteEventType({ id }) {
    return await mysql.lOAI_SU_KIEN.update({
      where: { id: Number(id) },
      data: { ngay_xoa: new Date() },
    });
  },
};

export default eventTypeService;
