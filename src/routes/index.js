import { Router } from "express";
import authRoute from "./authRoute.js";
import eventTypeRoute from "./eventTypeRoute.js";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";
import sessionTicketRoute from "./sessionTicketRoute.js";
import eventApprovalRoute from "./eventApprovalRoute.js";
import userRoute from "./userRoute.js";
import roleRouter from "./roleRoute.js";
import seatRoute from "./seatRoute.js";
import managerEventRoute from "./managerEventRoute.js";
import eventRoute from "./eventRoute.js";
import orderRoute from "./orderRoute.js";
import { toDataURL } from "qrcode";

import { PrismaClient as MySQLClient } from "../generated/mysql/index.js";
import { VNPay } from "vnpay";

import mailService, { transport } from "../services/mailService.js";
import ejs from "ejs";
import ticketRoute from "./ticketRoute.js";
import paymentRoute from "./paymentRoute.js";

const mysql = new MySQLClient();
const router = Router();

router.use("/auth", authRoute);
router.use("/roles", roleRouter);
router.use("/users", userRoute);
router.use("/manager/events", managerEventRoute);
router.use("/event-types", eventTypeRoute);
router.use("/sessions", sessionTicketRoute);
router.use("/event-approvals", eventApprovalRoute);
router.use("/seats", seatRoute);
router.use("/events", eventRoute);
router.use("/orders", orderRoute);
router.use("/tickets", ticketRoute);
router.use("/payment", paymentRoute);

const s3 = new S3Client({
  region: "auto",
  endpoint: "https://668f0b6ae2f941f596942e6f6777164e.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: "819160d50fd96f295dd24aeab7babdf5",
    secretAccessKey:
      "11ef135063c91537a55dfb050b7bf44677169e9b138a2091cb0fa93cdcaefd11",
  },
});

router.post("/create-qr", async (req, res) => {
  return res.status(200).json(paymentUrl);
});

router.get("/check-payment-vnpay", async (req, res) => {
  const vnpay = new VNPay({
    tmnCode: "A2U7JWFG",
    secureSecret: "2W33GE7JUMT120W0D9GITH5NHH6O5731",
    vnpayHost: "https://sandbox.vnpayment.vn",
    testMode: true, // Chế độ test
    hashAlgorithm: "SHA512", // Thuật toán mã hóa
    enableLog: false, // Bật/tắt log
  });
  const verify = vnpay.verifyReturnUrl(req.query);
  const { vnp_OrderInfo, vnp_TxnRef, vnp_Amount } = req.query;
  if (verify.isSuccess) {
    await mysql.$transaction(async (tx) => {
      // Tìm hóa đơn
      const donHang = await tx.dON_HANG.update({
        where: {
          ma_don_hang: vnp_OrderInfo,
        },
        data: {
          trang_thai: "HOAN_TAT",
        },
        include: {
          chi_tiet_don_hang: true,
        },
      });

      // Từng chi tiết hóa đơn -> tạo vé
      const tickets = [];
      for (const chiTiet of donHang.chi_tiet_don_hang) {
        let gheDat = null;
        let loaiVe = null;
        if (chiTiet.id_ghe_dat) {
          gheDat = await mysql.gHE_DAT.findUnique({
            where: {
              id: chiTiet.id_ghe_dat,
            },
            include: {
              ghe: true,
            },
          });

          // Tạo vé
          const id_ve = nanoid();
          const qrData = JSON.stringify({
            id_ve,
            verifyUrl: `http://localhost:5173/check-ticket/${id_ve}`,
          });

          const qrBase64 = await toDataURL(qrData);
          const saved = await mysql.vE.create({
            data: {
              id_ve,
              ngay_phat_hanh: new Date(),
              QR_code: qrBase64,
              id_chi_tiet: chiTiet.id_chi_tiet,
            },
          });
          tickets.push(saved);
        }

        if (chiTiet.id_loai_ve) {
          loaiVe = await mysql.lOAI_VE.update({
            where: {
              id_loai_ve: chiTiet.id_loai_ve,
            },
            data: {
              so_luong_con: {
                decrement: chiTiet.so_luong,
              },
            },
          });

          for (let i = 1; i <= chiTiet.so_luong; i++) {
            // Tạo vé
            const id_ve = nanoid();
            const qrData = JSON.stringify({
              id_ve,
              verifyUrl: `http://localhost:5173/check-ticket/${id_ve}`,
            });

            const qrBase64 = await toDataURL(qrData);
            const saved = await mysql.vE.create({
              data: {
                id_ve,
                ngay_phat_hanh: new Date(),
                QR_code: qrBase64,
                id_chi_tiet: chiTiet.id_chi_tiet,
              },
            });
            tickets.push(saved);
          }
        }
      }

      // Cập nhật trạng thái đơn hàng -> HOÀN TẤT
      await tx.dON_HANG.update({
        where: {
          ma_don_hang: vnp_OrderInfo,
        },
        data: {
          trang_thai: "HOAN_TAT",
        },
      });

      await tx.tHANH_TOAN.update({
        where: {
          id: vnp_TxnRef,
        },
        data: {
          trang_thai: "THANH_CONG",
        },
      });

      const user = await tx.kHACH.findUnique({
        where: {
          ma_khach: donHang.ma_khach,
        },
        include: {
          nguoi_dung: {
            select: {
              email: true,
            },
          },
        },
      });

      // Gửi mail
      const html = await ejs.renderFile("src/templates/tickets.ejs", {
        tickets,
      });

      // Chuẩn bị attachments cho QR
      const attachments = tickets.map((t) => ({
        filename: `ticket-${t.id_ve}.png`,
        content: Buffer.from(t.QR_code, "base64"),
        cid: t.id_ve, // để hiển thị inline
      }));

      transport.sendMail({
        from: "EVENT DAY NE",
        to: user.nguoi_dung.email,
        subject: "vé sự kiện của bạn",
        html,
        attachments,
      });
    });

    return res.redirect(
      "http://localhost:5173/?status=success&msg=Dat+ve+thanh+cong"
    );
  } else {
    //THANH TOÁN THẤT BẠI
    await mysql.$transaction(async (tx) => {
      await tx.tHANH_TOAN.update({
        where: {
          id: vnp_TxnRef,
        },
        data: {
          trang_thai: "THAT_BAI",
        },
      });

      // Thay đổi trạng thái đơn hàng -> HỦY
      await tx.dAT_VE.update({
        where: {
          ma_don_hang: vnp_OrderInfo,
        },
        data: {
          trang_thai: "HUY",
        },
      });

      const chiTiets = await tx.cHI_TIET_DAT_VE.findMany({
        where: {
          ma_don_hang: vnp_OrderInfo,
        },
      });

      for (const chiTiet of chiTiets) {
        // Đặt hàng = loại vé, số lượng -> tăng lại số lượng vé ở tb LOAI_VE
        if (chiTiet.id_loai_ve) {
          await tx.lOAI_VE.update({
            where: {
              id_loai_ve: chiTiet.id_loai_ve,
            },
            data: {
              so_luong_con: {
                increment: chiTiet.so_luong,
              },
            },
          });
        }

        if (chiTiet.id_ghe_dat) {
          await tx.gHE_DAT.delete({
            where: {
              id: chiTiet.id_ghe_dat,
            },
          });
        }
      }
    });

    res.redirect("http://localhost:5173");
  }
});

router.post("/sign-url", async (req, res) => {
  const { name } = req.body;
  try {
    const key = nanoid() + name;
    const command = new PutObjectCommand({
      Bucket: "my-image",
      Key: key,
    });
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    return res.json({ url, key });
  } catch (error) {
    console.log(error);
  }
});

export default router;
