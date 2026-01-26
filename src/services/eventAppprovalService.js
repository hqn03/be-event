import { PrismaClient as MySQLClient } from "../generated/mysql/index.js";
const mysql = new MySQLClient();

const eventApprovalService = {
  async creatApproval({ ma_su_kien, user }) {
    const result = await mysql.$transaction(async (tx) => {
      const suKien = await tx.sU_KIEN.findUnique({
        where: {
          ma_su_kien,
        },
      });

      if (!suKien) {
        throw new Error("Khong tim thay su kien");
      }

      if (suKien.ma_nhan_vien !== user.id) {
        throw new Error("Ban khong co quyen");
      }

      if (suKien.trang_thai !== "NHAP") {
        throw new Error("Ban khong the gui duyet");
      }

      await tx.sU_KIEN_PHE_DUYET.create({
        data: {
          ma_su_kien,
        },
      });

      return await tx.sU_KIEN.update({
        where: { ma_su_kien },
        data: { trang_thai: "DANG_XU_LY" },
        include: { loai_su_kien: true },
      });
    });

    return result;
  },

  async getApprovals() {
    return await mysql.sU_KIEN_PHE_DUYET.findMany({
      where: {
        trang_thai: "DANG_XU_LY",
      },
      include: { su_kien: { select: { ten_su_kien: true } } },
    });
  },

  async updateApproval({ id_su_kien_phe_duyet, ghi_chu, trang_thai, user }) {
    return await mysql.$transaction(async (tx) => {
      const approval = await tx.sU_KIEN_PHE_DUYET.update({
        where: { id_su_kien_phe_duyet },
        data: {
          id_admin: user.sub,
          ghi_chu,
          trang_thai,
        },
      });

      await tx.sU_KIEN.update({
        where: {
          ma_su_kien: approval.ma_su_kien,
        },
        data: {
          trang_thai:
            approval.trang_thai === "TU_CHOI" ? "NHAP" : "SAP_DIEN_RA",
        },
      });

      return approval;
    });
  },
};

export default eventApprovalService;
