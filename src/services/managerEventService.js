import slugify from "slugify";
import { PrismaClient as MySQLClient } from "../generated/mysql/index.js";
import { nanoid } from "nanoid";
const mysql = new MySQLClient();

const managerEventService = {
  async getEvents({ status, user }) {
    return await mysql.sU_KIEN.findMany({
      where: { ma_nhan_vien: user.id, trang_thai: status, ngay_xoa: null },
      include: {
        loai_su_kien: true,
      },
      orderBy: {
        ngay_tao: "desc",
      },
    });
  },

  async createEvent({
    ten_su_kien,
    id_loai_su_kien,
    vi_do,
    kinh_do,
    ngay_bat_dau,
    ngay_ket_thuc,
    hinh_anh,
    mo_ta,
    dia_diem,
    user,
  }) {
    const baseSlug = slugify(ten_su_kien, { lower: true });
    const uniqueSlug = `${baseSlug}-${nanoid()}`;
    const event = await mysql.sU_KIEN.create({
      data: {
        ten_su_kien,
        duong_dan: uniqueSlug,
        mo_ta,
        dia_diem,
        vi_do,
        kinh_do: kinh_do,
        ngay_bat_dau: new Date(ngay_bat_dau),
        ngay_ket_thuc: new Date(ngay_ket_thuc),
        hinh_anh: hinh_anh,
        ma_nhan_vien: user.id,
        id_loai_su_kien: Number(id_loai_su_kien),
      },
    });

    return await mysql.sU_KIEN.update({
      where: { id: event.id },
      data: { ma_su_kien: "SK" + event.id.toString().padStart(5, "0") },
    });
  },

  async updateEvent({
    id,
    id_loai_su_kien,
    ma_nhan_vien,
    ten_su_kien,
    mo_ta,
    vi_do,
    kinh_do,
    hinh_anh,
    ngay_bat_dau,
    ngay_ket_thuc,
    user,
  }) {
    if (user.id !== ma_nhan_vien) {
      throw new Error("Bạn không có quyền chỉnh sửa");
    }

    return await mysql.sU_KIEN.update({
      where: { ma_su_kien: id },
      data: {
        id_loai_su_kien: Number(id_loai_su_kien),
        ten_su_kien,
        mo_ta,
        vi_do,
        kinh_do,
        hinh_anh,
        ngay_bat_dau,
        ngay_ket_thuc,
      },
    });
  },

  async getEvent({ ma_su_kien, user }) {
    const event = await mysql.sU_KIEN.findUnique({
      where: { ma_su_kien },
      include: {
        phienSuKiens: {
          include: {
            loaiVes: true,
          },
        },
        loai_su_kien: true,
        ghes: true,
      },
    });

    if (!event) {
      throw new Error("Không tìm thấy sự kiện");
    }

    if (["NHAP", "DANG_DUYET"].includes(event.trang_thai)) {
      console.log("[EVENT SERVICE] GET EVENT");
    }

    return event;
  },

  async deleteEvent({ ma_su_kien, user }) {
    const event = await mysql.sU_KIEN.findUnique({
      where: { ma_su_kien },
    });

    if (!event) {
      throw new Error("Không tìm thấy sự kiện");
    }

    if (event.ma_nhan_vien !== user.id) {
      throw new Error("Bạn không có quyền xóa");
    }

    const deleted = await mysql.sU_KIEN.update({
      where: { ma_su_kien },
      data: {
        ngay_xoa: new Date(),
      },
      select: {
        ma_su_kien: true,
      },
    });
    return deleted;
  },

  async publishEvent({ idEvent, user }) {
    const result = await mysql.$transaction(async (tx) => {
      await tx.sU_KIEN_PHE_DUYET.create({
        data: {
          id_su_kien: idEvent,
        },
      });

      return await tx.sU_KIEN.update({
        where: { ma_su_kien: idEvent },
        data: {
          trang_thai: "DANG_DUYET",
        },
        select: {
          trang_thai: true,
        },
      });
    });
    return result;
  },

  async approveEvent(idApprovalEvent, idSuperAdmin) {
    return await mysql.sU_KIEN_PHE_DUYET.update({
      where: { id_su_kien_phe_duyet: idApprovalEvent },
      data: { trang_thai: "DUOC_PHE_DUYET", id_admin: idSuperAdmin },
    });
  },

  async rejectEvent(idApprovalEvent, idSuperAdmin, note) {
    return await mysql.sU_KIEN_PHE_DUYET.update({
      where: { id_su_kien_phe_duyet: idApprovalEvent },
      data: { trang_thai: "TU_CHOI", ghi_chu: note, id_admin: idSuperAdmin },
    });
  },

  async listPost({ status }) {
    return await mysql.sU_KIEN_PHE_DUYET.findMany({
      where: {
        trang_thai: status,
      },
      orderBy: {
        ngay_tao: "asc",
      },
      include: {
        su_kien: true,
      },
    });
  },

  async listEvent() {
    await mysql.sU_KIEN.findMany();
  },

  async listMyEvent(idEmployee) {
    return await mysql.sU_KIEN.findMany({
      where: { ma_nhan_vien: idEmployee },
      select: {
        id: true,
        ngay_bat_dau: true,
        ma_su_kien: true,
        ten_su_kien: true,
        trang_thai: true,
        loai_su_kien: {
          select: {
            ten_loai_su_kien: true,
          },
        },
      },
    });
  },

  async viewEvent({ idEvent, user }) {
    return await mysql.sU_KIEN.findUnique({
      where: {
        ma_su_kien: idEvent,
      },
      include: {
        loai_su_kien: true,
        phienSuKiens: {
          include: {
            loaiVes: true,
          },
        },
      },
    });
  },

  async getPost({ idPost }) {
    return await mysql.sU_KIEN_PHE_DUYET.findUnique({
      where: { id_su_kien_phe_duyet: idPost },
      include: {
        su_kien: {
          include: {
            loai_su_kien: true,
            phienSuKiens: {
              include: {
                loaiVes: true,
              },
            },
          },
        },
      },
    });
  },
};

export default managerEventService;
