import slugify from "slugify";
import { mysql } from "./utils/prisma.js";
import crypto from "crypto";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, "data.json");
const eventData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

function randInt(min, max) {
  return crypto.randomInt(min, max + 1);
}

function randomCCCD12() {
  let s = "";
  for (let i = 0; i < 12; i++) s += String(randInt(0, 9));
  return s;
}

function randomPhone() {
  const prefixes = [
    "032",
    "033",
    "034",
    "035",
    "036",
    "037",
    "038",
    "039",
    "070",
    "076",
    "077",
    "078",
    "079",
    "081",
    "082",
    "083",
    "084",
    "085",
    "086",
    "088",
    "089",
    "090",
    "091",
    "092",
    "093",
    "094",
    "095",
    "096",
    "097",
    "098",
    "099",
    "052",
    "053",
    "056",
    "058",
    "059", // một số prefix khác / nhà mạng
  ];
  const p = prefixes[randInt(0, prefixes.length - 1)];
  let rest = "";
  for (let i = 0; i < 7; i++) rest += String(randInt(0, 9));
  return p + rest;
}

function randomDOB({ minAge = 18, maxAge = 90, wantDate = false } = {}) {
  const now = new Date();
  const latestBirth = new Date(
    now.getFullYear() - minAge,
    now.getMonth(),
    now.getDate()
  ); // ngày lớn nhất có thể
  const earliestBirth = new Date(
    now.getFullYear() - maxAge,
    now.getMonth(),
    now.getDate()
  ); // ngày nhỏ nhất
  const start = earliestBirth.getTime();
  const end = latestBirth.getTime();
  const t = randInt(start, end);
  const d = new Date(t);
  if (wantDate) return d;
  // format YYYY-MM-DD
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const loaiSuKiens = ["Ca nhạc", "Thể thao", "Khác"];

async function main() {
  await mysql.$transaction(async (tx) => {
    // tạo Role
    await tx.vAI_TRO.createMany({
      data: [
        {
          ten_vai_tro: "Super Admin",
          mo_ta:
            "Quản lý toàn bộ hệ thống, duyệt sự kiện do nhân viên tạo, quản lý người dùng",
        },
        {
          ten_vai_tro: "Nhân viên",
          mo_ta:
            "Tạo và quản lý sự kiện, theo dõi bán vé, nhưng không có quyền duyệt sự kiện của người khác.",
        },
        {
          ten_vai_tro: "Khách hàng",
          mo_ta: "Xem và đặt vé cho các sự kiện, quản lý thông tin cá nhân.",
        },
      ],
    });

    // vai trò super admin
    const vaiTroAdmin = await tx.vAI_TRO.findFirst({
      where: { ten_vai_tro: "Super Admin" },
    });

    // vai trò Khách
    const vaiTroKhach = await tx.vAI_TRO.findFirst({
      where: { ten_vai_tro: "Khách hàng" },
    });

    // vai trò Nhân viên
    const vaiTroNhanVien = await tx.vAI_TRO.findFirst({
      where: { ten_vai_tro: "Nhân viên" },
    });

    // tạo tài khoản super admin
    const superAdmin = await tx.nGUOI_DUNG.create({
      data: {
        email: `superadmin@example.com`,
        mat_khau:
          "$2b$10$/EWB1ph04DFIHAxlQjMEnO8uHnJh1XxKTBrK7MA/5aFKPzZBFcE1K",
        da_xac_thuc: true,
        ho_ten: `Super Admin`,
        id_vai_tro: vaiTroAdmin.id_vai_tro,
      },
    });

    // tạo 5 tài khoản khách
    for (let index = 1; index <= 5; index++) {
      // tạo người dùng
      const user = await tx.nGUOI_DUNG.create({
        data: {
          email: `khachhang${index}@example.com`,
          mat_khau:
            "$2b$10$/EWB1ph04DFIHAxlQjMEnO8uHnJh1XxKTBrK7MA/5aFKPzZBFcE1K",
          da_xac_thuc: true,
          ho_ten: `Khách hàng ${index}`,
          id_vai_tro: vaiTroKhach.id_vai_tro,
          ngay_sinh: randomDOB({ minAge: 18, maxAge: 55, wantDate: true }),
          so_dien_thoai: randomPhone(),
        },
      });

      // tạo khách
      const khach = await tx.kHACH.create({
        data: {
          id_nguoi_dung: user.id_nguoi_dung,
        },
      });

      // tạo mã khách
      await tx.kHACH.update({
        where: { id: khach.id },
        data: {
          ma_khach: "KH" + khach.id.toString().padStart(5, "0"),
        },
      });
    }

    // tạo 5 tài khoản nhân viên
    for (let index = 1; index <= 5; index++) {
      // tạo người dùng
      const user = await tx.nGUOI_DUNG.create({
        data: {
          email: `nhanvien${index}@example.com`,
          mat_khau:
            "$2b$10$/EWB1ph04DFIHAxlQjMEnO8uHnJh1XxKTBrK7MA/5aFKPzZBFcE1K",
          da_xac_thuc: true,
          ho_ten: `Nhân Viên ${index}`,
          ngay_sinh: randomDOB({ minAge: 18, maxAge: 55, wantDate: true }),
          so_dien_thoai: randomPhone(),
          id_vai_tro: vaiTroNhanVien.id_vai_tro,
        },
      });

      // tạo nhân viên
      const nhanvien = await tx.nHAN_VIEN.create({
        data: {
          id_nguoi_dung: user.id_nguoi_dung,
          id_admin: superAdmin.id_nguoi_dung,
        },
      });

      await tx.nHAN_VIEN.update({
        where: { id: nhanvien.id },
        data: { ma_nhan_vien: "NV" + nhanvien.id.toString().padStart(3, "0") },
      });
    }

    await Promise.all(
      loaiSuKiens.map((e) =>
        tx.lOAI_SU_KIEN.create({
          data: {
            ten_loai_su_kien: e,
            duong_dan: slugify(e, { lower: true }),
          },
        })
      )
    );

    await tx.sU_KIEN.createMany({
      data: eventData,
    });
  });
}

main()
  .catch(console.error)
  .finally(() => process.exit());
