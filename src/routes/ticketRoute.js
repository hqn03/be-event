import express from "express";

const ticketRoute = express.Router();
import { PrismaClient as MySQLClient } from "../generated/mysql/index.js";
import { formatTimeRange } from "../utils/datetime.js";
const mysql = new MySQLClient();

const getTicket = async (id) => {
  const ticket = await mysql.vE.findUnique({
    where: { id_ve: id },
    include: {
      chiTietDatVe: {
        select: {
          ten_loai_ve: true,
          ma_ghe: true,
          don_gia: true,
          datVe: { select: { ma_don_hang: true } },
        },
      },
    },
  });

  const phienSuKien = await mysql.pHIEN_SU_KIEN.findFirst({
    where: {
      datVes: {
        some: {
          ma_don_hang: ticket.chiTietDatVe.datVe.ma_don_hang,
        },
      },
    },
    select: {
      thoi_gian_bat_dau: true,
      thoi_gian_ket_thuc: true,

      su_kien: {
        select: { ten_su_kien: true, dia_diem: true },
      },
    },
  });

  const { chiTietDatVe, ...rest } = ticket;
  const { ten_loai_ve, ma_ghe, don_gia } = chiTietDatVe;
  const { su_kien } = phienSuKien;
  const thoi_gian = formatTimeRange(
    phienSuKien.thoi_gian_bat_dau,
    phienSuKien.thoi_gian_ket_thuc
  );

  return {
    ...rest,
    ten_loai_ve,
    ma_ghe,
    gia: don_gia,
    thoi_gian,
    ...su_kien,
  };
};

ticketRoute.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await getTicket(id);
    return res.status(200).json(ticket);
  } catch (error) {
    console.log(error);
    return res.status(200).json(error);
  }
});

ticketRoute.put("/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    if (req.user?.role === "Khách hàng") throw Error("Không có quyền");
    const ticket = await mysql.vE.update({
      where: { id_ve: id },
      data: { trang_thai: status, ngay_check_in: new Date() },
    });
    return res.status(200).json(ticket);
  } catch (error) {
    console.log(error);
    return res.status(400).json(error);
  }
});

export default ticketRoute;
