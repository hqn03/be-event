import { PrismaClient as MySQLClient } from "../generated/mysql/index.js";
const mysql = new MySQLClient();

const userService = {
  async createUser({
    ho_ten,
    email,
    id_vai_tro,
    gioi_tinh,
    ngay_sinh,
    so_dien_thoai,
    mat_khau,
    user,
  }) {
    return await mysql.$transaction(async (tx) => {
      const createdUser = await tx.nGUOI_DUNG.create({
        data: {
          ho_ten,
          email,
          mat_khau,
          id_vai_tro: Number(id_vai_tro),
          da_xac_thuc: true,
          gioi_tinh: gioi_tinh || "NAM",
          ngay_sinh: ngay_sinh || null,
          so_dien_thoai: so_dien_thoai || null,
        },
        include: {
          vai_tro: true,
        },
      });

      if (createdUser.vai_tro.ten_vai_tro === "Khách hàng") {
        const khach = await tx.kHACH.create({
          data: {
            id_nguoi_dung: createdUser.id_nguoi_dung,
          },
        });

        await tx.kHACH.update({
          where: {
            id: khach.id,
          },
          data: {
            ma_khach: "KH" + khach.id.toString().padStart(8, "0"),
          },
        });
      }

      if (createdUser.vai_tro.ten_vai_tro === "Nhân viên") {
        const nhanVien = await tx.nHAN_VIEN.create({
          data: {
            id_nguoi_dung: createdUser.id_nguoi_dung,
            id_admin: user.sub,
          },
        });

        await tx.nHAN_VIEN.update({
          where: { id: nhanVien.id },
          data: {
            ma_nhan_vien: "NV" + nhanVien.id.toString().padStart(3, "0"),
          },
        });
      }

      const fullUser = await tx.nGUOI_DUNG.findUnique({
        where: {
          id_nguoi_dung: createdUser.id_nguoi_dung,
        },
        include: {
          vai_tro: true,
          khach: true,
          nhanVien: true,
        },
      });

      return fullUser;
    });
  },

  async getUsers() {
    return await mysql.nGUOI_DUNG.findMany({
      where: { ngay_xoa: null },
      include: {
        khach: true,
        nhanVien: true,
        vai_tro: true,
      },
      omit: {
        mat_khau: true,
      },
    });
  },

  async getUser() {},

  async updateUser({
    id_nguoi_dung,
    ho_ten,
    email,
    gioi_tinh,
    ngay_sinh,
    so_dien_thoai,
  }) {
    return await mysql.nGUOI_DUNG.update({
      where: {
        id_nguoi_dung,
      },
      data: {
        ho_ten,
        email,
        gioi_tinh: gioi_tinh || "NAM",
        ngay_sinh: ngay_sinh || null,
        so_dien_thoai: so_dien_thoai || null,
      },
      include: {
        vai_tro: true,
        nhanVien: true,
        khach: true,
      },
    });
  },

  async deleteUser({ id, user }) {
    if (user.sub === id) {
      throw new Error("Bạn không thể tự xóa tài khoản");
    }

    return await mysql.nGUOI_DUNG.update({
      where: {
        id_nguoi_dung: id,
      },
      data: {
        ngay_xoa: new Date(),
      },
    });
  },
};

export default userService;
