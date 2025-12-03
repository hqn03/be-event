import { Router } from "express";
import { PrismaClient as MySQLClient } from "../generated/mysql/index.js";
import { nanoid } from "nanoid";
import { dateFormat, VNPay, VnpLocale } from "vnpay";
const mysql = new MySQLClient();

const orderRoute = Router();

orderRoute.post("/", async (req, res) => {
  try {
    const { eventId, sessionId, items } = req.body;
    // console.log(req.body);
    const user = req.user;

    const order = await mysql.$transaction(async (tx) => {
      let total = 0;
      const donHang = await tx.dAT_VE.create({
        data: {
          tong_tien: 0,
          ma_khach: user.id,
          id_phien_su_kien: sessionId,
          het_han: new Date(Date.now() + 15 * 60 * 1000), // 15 phút
        },
      });

      // CHAR(10) = "DH" + 8 character
      const ma_don_hang = "DH" + donHang.id.toString().padStart(8, "0");
      await tx.dAT_VE.update({
        where: {
          id: donHang.id,
        },
        data: {
          ma_don_hang,
        },
      });

      // Đặt hàng = ghế
      // if (selectedSeats) {
      //   for (const seat of selectedSeats) {
      //     const existing = await tx.gHE_DAT.findUnique({
      //       where: {
      //         id_ghe_id_phien_su_kien: {
      //           id_ghe: seat.id,
      //           id_phien_su_kien: session,
      //         },
      //       },
      //       include: {
      //         ghe: true,
      //       },
      //     });

      //     if (existing) {
      //       const error = new Error("Ghế đã được đặt");
      //       error.seatId = seat.id;
      //       throw error;
      //     }

      //     const ghe = await tx.gHE.findUnique({
      //       where: {
      //         id: seat.id,
      //       },
      //     });

      //     const gheDat = await tx.gHE_DAT.create({
      //       data: {
      //         id: nanoid(),
      //         id_ghe: ghe.id,
      //         id_phien_su_kien: session,
      //       },
      //     });

      //     await tx.cHI_TIET_DAT_VE.create({
      //       data: {
      //         id_chi_tiet:nanoid(),
      //         don_gia: ghe.gia,
      //         so_luong: 1,
      //         thanh_tien: ghe.gia,
      //         ma_don_hang,
      //         id_ghe_dat: gheDat.id,
      //         ma_ghe: `${ghe.hang_ghe}-${ghe.ma_ghe}`,
      //         ten_loai_ve: ghe.loai_ghe,
      //       },
      //     });

      //     total = total + ghe.gia;
      //   }
      // }

      // Đặt hàng = loại vé, số lượng
      // if (cart) {
      //   for (const ticket of cart) {
      //     const loaiVe = await tx.lOAI_VE.findUnique({
      //       where: {
      //         id_loai_ve: ticket.id,
      //         so_luong_con: { gte: ticket.qty },
      //       },
      //     });
      //     if (!loaiVe) throw new Error("Không đủ vé");
      //     await tx.lOAI_VE.update({
      //       where: {
      //         id_loai_ve: loaiVe.id_loai_ve,
      //       },
      //       data: {
      //         so_luong_con: {
      //           decrement: ticket.qty,
      //         },
      //       },
      //     });

      //     await tx.cHI_TIET_DAT_VE.create({
      //       data: {
      //         id_chi_tiet: nanoid(),
      //         don_gia: loaiVe.gia_ve,
      //         so_luong: ticket.qty,
      //         ma_don_hang,
      //         id_loai_ve: ticket.id,
      //         thanh_tien: loaiVe.gia_ve * ticket.qty,
      //         ten_loai_ve: loaiVe.ten_ve,
      //       },
      //     });

      //     total = total + loaiVe.gia_ve * ticket.qty;
      //   }
      // }

      for (const item of items) {
        let gheDat = null;
        if (item.hang_ghe && item.ma_ghe) {
          const existing = await tx.gHE_DAT.findUnique({
            where: {
              id_ghe_id_phien_su_kien: {
                id_ghe: item.id,
                id_phien_su_kien: sessionId,
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
              id: item.id,
            },
          });
          gheDat = await tx.gHE_DAT.create({
            data: {
              id: nanoid(),
              id_ghe: item.id,
              id_phien_su_kien: sessionId,
            },
          });
          item.don_gia = Number(ghe.gia);
        } else {
          const loaiVe = await tx.lOAI_VE.findUnique({
            where: {
              id_loai_ve: item.id,
              so_luong_con: { gte: item.so_luong },
            },
          });
          if (!loaiVe) throw new Error("Không đủ vé");
          await tx.lOAI_VE.update({
            where: {
              id_loai_ve: loaiVe.id_loai_ve,
            },
            data: {
              so_luong_con: {
                decrement: item.so_luong,
              },
            },
          });
          item.don_gia = Number(loaiVe.gia_ve);
        }

        const test = await tx.cHI_TIET_DAT_VE.create({
          data: {
            id_chi_tiet: nanoid(),
            don_gia: item.don_gia,
            so_luong: item.so_luong,
            thanh_tien: item.don_gia * item.so_luong,
            ma_don_hang,
            id_ghe_dat: gheDat?.id || null,
            ma_ghe: item.ma_ghe ? `${item.hang_ghe}-${item.ma_ghe}` : null,
            ten_loai_ve: item.loai_ve,
            id_loai_ve: item.ma_ghe ? null : item.id,
          },
        });

        total = total + item.don_gia * item.so_luong;
      }

      const result = await tx.dAT_VE.update({
        where: {
          ma_don_hang,
        },
        data: {
          tong_tien: total,
        },
      });
      return result;
    });

    return res.status(200).json(order);
  } catch (error) {
    console.log(error);
    return res.status(400).json(error);
  }
});

orderRoute.get("/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await mysql.dAT_VE.findUnique({
      where: { ma_don_hang: orderId },
      include: {
        chiTietDatVes: true,
        nguoi_dat_ve: {
          select: {
            nguoi_dung: {
              select: {
                ho_ten: true,
                email: true,
                so_dien_thoai: true,
              },
            },
          },
        },
        phienSuKien: {
          select: {
            thoi_gian_bat_dau: true,
            thoi_gian_ket_thuc: true,
            su_kien: {
              select: {
                ma_su_kien: true,
                ten_su_kien: true,
                dia_diem: true,
              },
            },
          },
        },
        thanhToans: true,
      },
    });
    return res.status(200).json(order);
  } catch (error) {}
});

export default orderRoute;
