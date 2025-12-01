import { Router } from "express";
import { PrismaClient as MySQLClient } from "../generated/mysql/index.js";
import { nanoid } from "nanoid";
import { VNPay, VnpLocale } from "vnpay";
const mysql = new MySQLClient();

const orderRoute = Router();

orderRoute.post("/", async (req, res) => {
  try {
    const { event, session, selectedSeats, cart } = req.body;
    const user = req.user;
    const order = await mysql.$transaction(async (tx) => {
      let total = 0;
      const donHang = await tx.dON_HANG.create({
        data: {
          tong_tien: 0,
          ma_khach: user.id,
          ma_su_kien: event,
          het_han: new Date(Date.now() + 15 * 60 * 1000), // 15 phút
        },
      });
      // CHAR(10) = "DH" + 8 character
      const ma_don_hang = "DH" + donHang.id.toString().padStart(8, "0");
      await tx.dON_HANG.update({
        where: {
          id: donHang.id,
        },
        data: {
          ma_don_hang,
        },
      });

      // Đặt hàng = ghế
      if (selectedSeats) {
        for (const seat of selectedSeats) {
          const existing = await tx.gHE_DAT.findUnique({
            where: {
              id_ghe_id_phien_su_kien: {
                id_ghe: seat.id,
                id_phien_su_kien: session,
              },
            },
            include: {
              ghe: true,
            },
          });

          if (existing) {
            const error = new Error("Ghế đã được đặt");
            error.seatId = seat.id;
            throw error;
          }

          const ghe = await tx.gHE.findUnique({
            where: {
              id: seat.id,
            },
          });

          const gheDat = await tx.gHE_DAT.create({
            data: {
              id: nanoid(),
              id_ghe: ghe.id,
              id_phien_su_kien: session,
            },
          });

          await tx.cHI_TIET_DON_HANG.create({
            data: {
              id_chi_tiet: nanoid(),
              don_gia: ghe.gia,
              so_luong: 1,
              thanh_tien: ghe.gia,
              ma_don_hang,
              id_ghe_dat: gheDat.id,
              ma_ghe: `${ghe.hang_ghe}-${ghe.ma_ghe}`,
              ten_loai_ve: ghe.loai_ghe,
            },
          });

          total = total + ghe.gia;
        }
      }

      // Đặt hàng = loại vé, số lượng
      if (cart) {
        for (const ticket of cart) {
          const loaiVe = await tx.lOAI_VE.findUnique({
            where: {
              id_loai_ve: ticket.id,
              so_luong_con: { gte: ticket.qty },
            },
          });
          if (!loaiVe) throw new Error("Không đủ vé");
          await tx.lOAI_VE.update({
            where: {
              id_loai_ve: loaiVe.id_loai_ve,
            },
            data: {
              so_luong_con: {
                decrement: ticket.qty,
              },
            },
          });

          await tx.cHI_TIET_DON_HANG.create({
            data: {
              id_chi_tiet: nanoid(),
              don_gia: loaiVe.gia_ve,
              so_luong: ticket.qty,
              ma_don_hang,
              id_loai_ve: ticket.id,
              thanh_tien: loaiVe.gia_ve * ticket.qty,
              ten_loai_ve: loaiVe.ten_ve,
            },
          });

          total = total + loaiVe.gia_ve * ticket.qty;
        }
      }

      const result = await tx.dON_HANG.update({
        where: {
          ma_don_hang,
        },
        data: {
          tong_tien: total,
        },
      });

      return result;
    });

    const vnpay = new VNPay({
      tmnCode: "A2U7JWFG",
      secureSecret: "2W33GE7JUMT120W0D9GITH5NHH6O5731",
      vnpayHost: "https://sandbox.vnpayment.vn",
      testMode: true, // Chế độ test
      hashAlgorithm: "SHA512", // Thuật toán mã hóa
      enableLog: false, // Bật/tắt log
    });

    const paymentUrl = await vnpay.buildPaymentUrl({
      vnp_Amount: order.tong_tien,
      vnp_IpAddr: "127.0.0.1",
      vnp_ReturnUrl: "http://localhost:3000/api/check-payment-vnpay",
      vnp_TxnRef: nanoid(),
      vnp_OrderInfo: order.ma_don_hang,
      vnp_Locale: VnpLocale.VN,
    });

    return res.status(200).json(paymentUrl);
  } catch (error) {
    console.log(error);
    return res.status(400).json(error);
  }
});

export default orderRoute;
