import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import ejs from "ejs";
import mailService from "./mailService.js";
import { PrismaClient as MySQLClient } from "../generated/mysql/index.js";
const mysql = new MySQLClient();

const saltRounds = 10;

const authService = {
  async signUp(data) {
    const existUser = !!(await mysql.nGUOI_DUNG.findUnique({
      where: {
        email: data.email,
      },
    }));

    if (existUser) {
      throw new Error("Nguoi dung da ton tai");
    }

    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    try {
      const createdUser = await mysql.$transaction(async (tx) => {
        const userRole = await tx.vAI_TRO.findFirst({
          where: { ten_vai_tro: "Khách hàng" },
        });

        const user = await tx.nGUOI_DUNG.create({
          data: {
            ho_ten: data.fullName,
            email: data.email,
            mat_khau: hashedPassword,
            id_vai_tro: userRole.id_vai_tro,
          },
        });

        const token = crypto.randomBytes(32).toString("hex");
        await tx.tOKEN_XAC_THUC.create({
          data: {
            id_nguoi_dung: user.id_nguoi_dung,
            token: token,
            thoi_gian_het_han: new Date(Date.now() + 10 * 60 * 1000), //hết hạn sau 10p
          },
        });

        const html = await ejs.renderFile("src/templates/verify.ejs", {
          userName: user.ho_ten,
          userEmail: "user@example.com",
          companyName: "My App",
          verificationLink: `http://localhost:3000/api/auth/verify?token=${token}`, // Hoặc null nếu dùng code
        });

        mailService.send(user.email, "Xac thuc tai khoan", html);
        return user;
      });
      return createdUser;
    } catch (error) {
      console.error("Lỗi khi tạo user/token:", error);
    }
  },

  async login(data) {
    const user = await mysql.nGUOI_DUNG.findUnique({
      where: { email: data.email },
      select: {
        id_nguoi_dung: true,
        email: true,
        mat_khau: true,
        da_xac_thuc: true,
        ho_ten: true,
        vai_tro: true,
        nhanVien: true,
        khach: true,
      },
    });

    if (!user || !(await bcrypt.compare(data.password, user.mat_khau))) {
      throw new Error("Email hoặc mật khẩu không đúng");
    }

    if (!user.da_xac_thuc) {
      throw new Error("Chưa xác thực email");
    }

    const payload = {
      email: user.email,
      fullname: user.ho_ten,
      sub: user.id_nguoi_dung,
      role: user.vai_tro.ten_vai_tro,
      id: user.nhanVien?.ma_nhan_vien || user.khach?.ma_khach,
    };

    const access_token = jwt.sign(payload, process.env.ACCESS_KEY, {
      expiresIn: "24h",
    });

    return {
      user: payload,
      access_token,
    };
  },

  async verify(token) {
    const tokenRecord = await mysql.tOKEN_XAC_THUC.findUnique({
      where: { token: token },
    });

    if (!tokenRecord) {
      throw new Error("Token không tồn tại");
    }

    if (tokenRecord.thoi_gian_het_han < new Date()) {
      throw new Error("Token đã hết hạn");
    }

    try {
      return await mysql.$transaction(async (tx) => {
        await tx.nGUOI_DUNG.update({
          where: { id_nguoi_dung: tokenRecord.id_nguoi_dung },
          data: { da_xac_thuc: true },
        });

        const customer = await tx.kHACH.create({
          data: {
            id_nguoi_dung: tokenRecord.id_nguoi_dung,
          },
        });

        await tx.kHACH.update({
          where: { id: customer.id },
          data: { ma_khach: "KH" + customer.id.toString().padStart(8, "0") },
        });

        return 1;
      });
    } catch (error) {
      throw error;
    }
  },

  async resendToken(email) {
    const user = await mysql.nGUOI_DUNG.findUnique({
      where: { email },
    });

    if (user) {
      throw new Error("Không tìm thấy người dùng");
    }

    const token = await mysql.tOKEN_XAC_THUC.findFirst({
      where: { id_nguoi_dung: user.id_nguoi_dung },
      orderBy: { thoi_gian_het_han: "desc" },
    });

    if (token.thoi_gian_het_han <= new Date()) {
      throw new Error("Token còn hiệu lực");
    }

    const newToken = crypto.randomBytes(32).toString("hex");
    await tx.tOKEN_XAC_THUC.create({
      data: {
        id_nguoi_dung: user.id_nguoi_dung,
        token: token,
        thoi_gian_het_han: new Date(Date.now() + 10 * 60 * 1000), //hết hạn sau 10p
      },
    });

    return 1;
  },

  async getMe(token) {
    // const user = await mysql.
  },
};

export default authService;
