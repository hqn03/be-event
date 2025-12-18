import { Router } from "express";
import { PrismaClient as MySQLClient } from "../generated/mysql/index.js";
import { nanoid } from "nanoid";
import { dateFormat, VNPay, VnpLocale } from "vnpay";
import QRCode from "qrcode";
import ejs from "ejs";
import { transport } from "../services/mailService.js";
import { createInvoicePDF } from "./orderRoute.js";
import PDFDocument from "pdfkit";
import { formatTimeRange } from "../utils/datetime.js";
import { getEmailTemplate } from "../utils/file.js";

const mysql = new MySQLClient();

const vnpay = new VNPay({
  tmnCode: "A2U7JWFG",
  secureSecret: "2W33GE7JUMT120W0D9GITH5NHH6O5731",
  vnpayHost: "https://sandbox.vnpayment.vn",
  testMode: true, // Chế độ test
  hashAlgorithm: "SHA512", // Thuật toán mã hóa
  enableLog: false, // Bật/tắt log
});

const paymentRoute = Router();

paymentRoute.post("/", async (req, res) => {
  const { so_tien, ma_don_hang, cong_thanh_toan, het_han, hoa_don } = req.body;
  try {
    const id_thanh_toan = nanoid();
    let paymentUrl;

    switch (cong_thanh_toan) {
      case "VNPAY": {
        paymentUrl = vnpay.buildPaymentUrl({
          vnp_Amount: so_tien,
          vnp_IpAddr: "127.0.0.1",
          vnp_ReturnUrl: `http://localhost:3000/api/payment/check-payment-vnpay/?invoice=${hoa_don}`,
          vnp_TxnRef: id_thanh_toan,
          vnp_OrderInfo: ma_don_hang,
          vnp_Locale: VnpLocale.VN,
          vnp_ExpireDate: dateFormat(new Date(het_han)),
        });
      }
    }

    await mysql.tHANH_TOAN.create({
      data: {
        id: id_thanh_toan,
        cong_thanh_toan: cong_thanh_toan,
        so_tien,
        ma_don_hang,
        trang_thai: "DANG_XU_LY",
      },
    });

    return res.status(201).send(paymentUrl);
  } catch (error) {
    console.log(error);
    return res.status(400).send(error.message);
  }
});

paymentRoute.get("/check-payment-vnpay", async (req, res) => {
  const invoice = req.query.invoice === "true";
  const verify = vnpay.verifyReturnUrl(req.query);
  const { vnp_OrderInfo, vnp_TxnRef, vnp_Amount } = req.query;
  const frontendUrl = process.env.FRONTEND_URL;

  const tickets = [];
  if (verify.isSuccess) {
    const order = await mysql.$transaction(async (tx) => {
      // Tìm hóa đơn
      await tx.dAT_VE.update({
        where: {
          ma_don_hang: vnp_OrderInfo,
        },
        data: {
          trang_thai: "HOAN_TAT",
        },
      });

      const order = await tx.dAT_VE.findUnique({
        where: {
          ma_don_hang: vnp_OrderInfo,
        },
        include: {
          chiTietDatVes: true,
          phienSuKien: {
            select: {
              su_kien: { select: { ten_su_kien: true, dia_diem: true } },
              thoi_gian_bat_dau: true,
              thoi_gian_ket_thuc: true,
            },
          },
          nguoi_dat_ve: {
            select: {
              nguoi_dung: {
                select: { email: true, ho_ten: true, so_dien_thoai: true },
              },
            },
          },
        },
      });

      for (const chiTiet of order.chiTietDatVes) {
        let gheDat = null;
        let loaiVe = null;
        if (chiTiet.id_ghe_dat) {
          gheDat = await mysql.gHE_DAT.findUnique({
            where: { id: chiTiet.id_ghe_dat },
            include: { ghe: true },
          });

          const id_ve = nanoid();

          const qr = await QRCode.toDataURL(
            `${frontendUrl}/ticket?id=${id_ve}`
          );
          const saved = await mysql.vE.create({
            data: {
              id_ve,
              ngay_phat_hanh: new Date(),
              QR_code: qr,
              id_chi_tiet: chiTiet.id_chi_tiet,
            },
            include: {
              chiTietDatVe: { select: { ten_loai_ve: true, ma_ghe: true } },
            },
          });
          const { chiTietDatVe, ...rest } = saved;
          tickets.push({
            ...rest,
            ten_loai_ve: chiTietDatVe.ten_loai_ve,
            ma_ghe: chiTietDatVe.ma_ghe,
          });
        }

        // Trừ stock nếu là vé + số lượng
        if (chiTiet.id_loai_ve) {
          loaiVe = await mysql.lOAI_VE.update({
            where: { id_loai_ve: chiTiet.id_loai_ve },
            data: { so_luong_con: { decrement: chiTiet.so_luong } },
          });

          for (let i = 1; i <= chiTiet.so_luong; i++) {
            // Tạo vé
            const id_ve = nanoid();

            const qr = await QRCode.toDataURL(
              `${frontendUrl}/ticket?id=${id_ve}`
            );
            const saved = await mysql.vE.create({
              data: {
                id_ve,
                ngay_phat_hanh: new Date(),
                QR_code: qr,
                id_chi_tiet: chiTiet.id_chi_tiet,
              },
              include: {
                chiTietDatVe: { select: { ten_loai_ve: true, ma_ghe: true } },
              },
            });
            const { chiTietDatVe, ...rest } = saved;
            tickets.push({
              ...rest,
              ten_loai_ve: chiTietDatVe.ten_loai_ve,
              ma_ghe: chiTietDatVe.ma_ghe,
            });
          }
        }
      }

      await tx.tHANH_TOAN.update({
        where: { id: vnp_TxnRef },
        data: { trang_thai: "THANH_CONG" },
      });

      // Chuẩn bị attachments cho QR
      // const attachments = tickets.map((t) => ({
      //   filename: `ticket-${t.id_ve}.png`,
      //   content: Buffer.from(t.QR_code, "base64"),
      //   cid: t.id_ve, // để hiển thị inline
      // }));

      // if()
      return order;
    });

    let pdfBuffer = null;
    if (invoice) {
      const dataInvoice = {
        invoiceNo: order.ma_don_hang,
        event: order.phienSuKien.su_kien.ten_su_kien,
        time: formatTimeRange(
          order.phienSuKien.thoi_gian_bat_dau,
          order.phienSuKien.thoi_gian_ket_thuc
        ),
        place: order.phienSuKien.su_kien.dia_diem,
        customer: order.nguoi_dat_ve.nguoi_dung.ho_ten,
        email: order.nguoi_dat_ve.nguoi_dung.email,
        phone: order.nguoi_dat_ve.nguoi_dung.so_dien_thoai,
        TOTAL: Intl.NumberFormat("vi-vn", {
          style: "currency",
          currency: "VND",
        }).format(order.tong_tien),
        ROWS: order.chiTietDatVes,
      };

      const doc = new PDFDocument({ size: "A4", margin: 20 });
      pdfBuffer = await createInvoicePDF(doc, dataInvoice);
    }

    // HTMLMail
    const htmlData = {
      ten_khach: order.nguoi_dat_ve.nguoi_dung.ho_ten,
      ma_don_hang: order.ma_don_hang,
      ten_su_kien: order.phienSuKien.su_kien.ten_su_kien,
      thoi_gian: formatTimeRange(
        order.phienSuKien.thoi_gian_bat_dau,
        order.phienSuKien.thoi_gian_ket_thuc
      ),
      dia_diem: order.phienSuKien.su_kien.dia_diem,
      tickets: tickets,
    };

    const htmlTickets = await ejs.renderFile(
      "src/templates/tickets.ejs",
      htmlData
    );

    const mailOptions = {
      from: "EVENT DAY NE",
      to: order.nguoi_dat_ve.nguoi_dung.email,
      subject: "vé sự kiện của bạn",
      html: htmlTickets,
    };

    if (pdfBuffer) {
      mailOptions.attachments = [
        {
          filename: `${order.ma_don_hang}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ];
    }

    transport.sendMail(mailOptions);

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
    });

    res.redirect(`http://localhost:5173/orders/${vnp_OrderInfo}/payment`);
  }
});

export default paymentRoute;
