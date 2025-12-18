import { Router } from "express";
import { PrismaClient as MySQLClient } from "../generated/mysql/index.js";
import { nanoid } from "nanoid";
// import { dateFormat, VNPay, VnpLocale } from "vnpay";
import { formatTimeRange, toGMT7 } from "../utils/datetime.js";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

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

orderRoute.get("/manager", async (req, res) => {
  try {
    const id_nhan_vien = req.user.id;
    const datVe = await mysql.dAT_VE.findMany({
      where: {
        trang_thai: "HOAN_TAT",
        phienSuKien: {
          su_kien: {
            ma_nhan_vien: id_nhan_vien,
          },
        },
      },
      include: {
        phienSuKien: {
          select: {
            su_kien: {
              select: {
                ten_su_kien: true,
                ma_su_kien: true,
              },
            },
          },
        },
      },
    });

    return res.status(200).json(datVe);
  } catch (error) {
    console.log(error);
    return res.status(200).json(error);
  }
});

orderRoute.get("/admin", async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1); // 1-based
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const { from, to, q } = req.query;

    const where = { trang_thai: "HOAN_TAT" };

    if (q) {
      where.OR = [
        { phienSuKien: { su_kien: { ten_su_kien: { contains: q } } } },
        { phienSuKien: { su_kien: { ma_su_kien: { contains: q } } } },
      ];
    }

    // filter date
    if (from || to) {
      where.ngay_tao = {};
      if (from) where.ngay_tao.gte = new Date(from);
      if (to) where.ngay_tao.lte = new Date(to);
    }

    // Đếm tổng bản ghi
    const totalItems = await mysql.dAT_VE.count({ where });
    const totalPages = Math.ceil(totalItems / limit);

    // Lấy dữ liệu theo page
    const items = await mysql.dAT_VE.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        ngay_tao: "desc", // nên có
      },
      include: {
        phienSuKien: {
          select: {
            su_kien: {
              select: {
                ten_su_kien: true,
                ma_su_kien: true,
                ma_nhan_vien: true,
              },
            },
          },
        },
      },
    });

    return res.status(200).json({
      items,
      page,
      limit,
      totalItems,
      totalPages,
    });
  } catch (error) {
    console.log(error);
    return res.status(200).json(error);
  }
});

orderRoute.get("/admin/summary-by-event", async (req, res) => {
  try {
    const { from, to } = req.query;

    const where = { trang_thai: "HOAN_TAT" };

    if (from || to) {
      where.ngay_tao = {};
      if (from) where.ngay_tao.gte = new Date(from);
      if (to) where.ngay_tao.lte = new Date(to);
    }

    const grouped = await mysql.dAT_VE.groupBy({
      by: ["id_phien_su_kien"],
      where,
      _sum: {
        tong_tien: true,
      },
      _count: {
        _all: true,
      },
    });

    const phienIds = grouped.map((i) => i.id_phien_su_kien);

    const phienMap = await mysql.pHIEN_SU_KIEN.findMany({
      where: { id_phien_su_kien: { in: phienIds } },
      select: {
        id_phien_su_kien: true,
        su_kien: { select: { ma_su_kien: true, ten_su_kien: true } },
      },
    });

    const map = {};

    grouped.forEach((g) => {
      const phien = phienMap.find(
        (p) => p.id_phien_su_kien === g.id_phien_su_kien
      );
      if (!phien) return;

      const key = phien.su_kien.ma_su_kien;

      if (!map[key]) {
        map[key] = {
          ma_su_kien: phien.su_kien.ma_su_kien,
          ten_su_kien: phien.su_kien.ten_su_kien,
          doanh_thu: 0,
          so_don: 0,
        };
      }

      map[key].doanh_thu += g._sum.tong_tien ?? 0;
      map[key].so_don += g._count._all;
    });

    const result = Object.values(map);

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json(error);
  }
});

orderRoute.get("/export-excel", async (req, res) => {
  try {
    const { from, to, q } = req.query;

    const where = { trang_thai: "HOAN_TAT" };

    if (q) {
      where.OR = [
        { phienSuKien: { su_kien: { ten_su_kien: { contains: q } } } },
        { phienSuKien: { su_kien: { ma_su_kien: { contains: q } } } },
      ];
    }

    // filter date
    if (from || to) {
      where.ngay_tao = {};
      if (from) where.ngay_tao.gte = new Date(from);
      if (to) where.ngay_tao.lte = new Date(to);
    }

    const data = await mysql.dAT_VE.findMany({
      where,
      orderBy: {
        ngay_tao: "desc", // nên có
      },
      include: {
        phienSuKien: {
          select: {
            su_kien: {
              select: {
                ten_su_kien: true,
                ma_su_kien: true,
                ma_nhan_vien: true,
              },
            },
          },
        },
      },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Dat_ve");

    sheet.columns = [
      { header: "Mã đơn", key: "ma_don_hang", width: 20 },
      {
        header: "Mã sự kiện",
        key: "ma_su_kien",
        width: 15,
      },
      { header: "Sự kiện", key: "ten_su_kien", width: 30 },
      {
        header: "Mã nhân viên",
        key: "ma_nhan_vien",
        width: 20,
      },
      { header: "Mã khách", key: "ma_khach", width: 20 },
      { header: "Tổng tiền", key: "tong_tien", width: 20 },
      { header: "Ngày tạo", key: "ngay_tao", width: 20 },
    ];

    const rows = data.map((i) => ({
      ma_don_hang: i.ma_don_hang,
      ma_su_kien: i.phienSuKien?.su_kien?.ma_su_kien,
      ten_su_kien: i.phienSuKien?.su_kien?.ten_su_kien,
      ma_nhan_vien: i.phienSuKien?.su_kien?.ma_nhan_vien,
      ma_khach: i.ma_khach,
      tong_tien: i.tong_tien,
      ngay_tao: toGMT7(i.ngay_tao),
    }));

    sheet.addRows(rows);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=orders.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Export excel failed" });
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

orderRoute.get("/:orderId/pdf-preview", async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await mysql.dAT_VE.findUnique({
      where: { ma_don_hang: orderId },
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

    // // Load template
    // let html = fs.readFileSync(
    //   path.join(process.cwd(), "src/templates/invoice.html"),
    //   "utf8"
    // );

    // // Build rows (10 dòng giống mẫu)
    // const rows = Array.from({ length: 10 })
    //   .map((_, i) => {
    //     const item = order.chiTietDatVes[i];

    //     return `
    //   <tr>
    //     <td style="text-align:center">${i + 1}</td>
    //     <td>${
    //       item ? (item.id_ghe_dat ? item.ma_ghe : item.ten_loai_ve) : ""
    //     }</td>
    //     <td style="text-align:center">${
    //       item ? (item.id_ghe_dat ? "Ghế" : "Vé") : ""
    //     }</td>
    //     <td style="text-align:center">${item ? item.so_luong : ""}</td>
    //     <td style="text-align:right">${
    //       item ? item.don_gia.toLocaleString() : ""
    //     }</td>
    //     <td style="text-align:right">${
    //       item ? (item.don_gia * item.so_luong).toLocaleString() : ""
    //     }</td>
    //   </tr>
    // `;
    //   })
    //   .join("");

    // html = html
    //   .replace(
    //     "{{LOGO}}",
    //     "https://upload.wikimedia.org/wikipedia/commons/3/3f/Placeholder.png"
    //   )
    //   .replace("{{INVOICE_NO}}", order.ma_don_hang)
    //   .replace("{{EVENT}}", order.phienSuKien.su_kien.ten_su_kien)
    //   .replace(
    //     "{{TIME}}",
    //     formatTimeRange(
    //       order.phienSuKien.thoi_gian_bat_dau,
    //       order.phienSuKien.thoi_gian_ket_thuc
    //     )
    //   )
    //   .replace("{{PLACE}}", order.phienSuKien.su_kien.dia_diem)
    //   .replace("{{CUSTOMER}}", order.nguoi_dat_ve.nguoi_dung.ho_ten)
    //   .replace("{{PHONE}}", order.nguoi_dat_ve.nguoi_dung.so_dien_thoai)
    //   .replace("{{EMAIL}}", order.nguoi_dat_ve.nguoi_dung.email)
    //   .replace("{{ROWS}}", rows)
    //   .replace("{{TOTAL}}", Number(order.tong_tien).toLocaleString())
    //   .replace("{{TOTAL_TEXT}}", order.totalText || "")
    //   .replace("{{DAY}}", new Date(order.ngay_tao).getDate())
    //   .replace("{{MONTH}}", new Date(order.ngay_tao).getMonth() + 1)
    //   .replace("{{YEAR}}", new Date(order.ngay_tao).getFullYear());

    // // Render PDF
    // const browser = await getBrowser();
    // const page = await browser.newPage();
    // await page.setContent(html, { waitUntil: "networkidle0" });

    // const pdfBuffer = await page.pdf({
    //   format: "A4",
    //   margin: { top: "20px", left: "20px", bottom: "20px", right: "20px" },
    // });

    // await page.close();

    // res.setHeader("Content-Type", "application/pdf");
    // res.send(pdfBuffer);

    // order.chiTietDatVes.map(x => {
    //   x.ten_loai_ve,
    //   x.so_luong,
    //   x.don_gia,
    //   x.thanh
    // })
    const data = {
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
    addPreviewWatermark(doc);

    const pdfBuffer = await createInvoicePDF(doc, data);

    res.setHeader("Content-Type", "application/pdf");
    res.send(pdfBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to generate PDF" });
  }
});

export default orderRoute;

export function createInvoicePDF(doc, data) {
  doc.restore();
  let chunks = [];
  doc.on("data", (d) => chunks.push(d));

  const done = new Promise((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  doc.registerFont("Inter", "src/fonts/Inter_18pt-Regular.ttf");
  doc
    .font("Inter")
    .fontSize(16)
    .text("CÔNG TY TNHH 1 THÀNH VIÊN NHATEVENT", 40, 40, { align: "center" })
    .moveDown(0.2)
    .fontSize(12)
    .text("SDT: 0789.468.060 — Email: nhatld1410@gmail.com", {
      align: "center",
    })
    .moveDown(2)
    .fontSize(24)
    .text("HÓA ĐƠN ĐẶT VÉ", { align: "center" })
    .fontSize(16)
    .fillColor("red")
    .text(`Số HĐ: ${data.invoiceNo}`, { align: "center" })
    .fillColor("#003399")
    .moveDown(2)
    .fontSize(13)
    .text(`Tên sự kiện: ${data.event}`)
    .text(`Thời gian: ${data.time}`)
    .text(`Địa điểm: ${data.place}`)
    .moveDown(1)
    .text(
      `Khách hàng: ${data.customer}        Email: ${data.email}        SĐT: ${data.phone}`
    )
    .moveDown(1);

  const cols = [40, 150, 50, 50, 100, 120];
  function drawRow(row, y) {
    let x = 40;
    const h = 25;

    row.forEach((text, i) => {
      // Vẽ khung ô
      doc.rect(x, y, cols[i], h).stroke();

      // Vẽ text (không sử dụng doc.y)
      doc.fontSize(12).text(text, x + 5, y + 11, {
        width: cols[i],
      });

      x += cols[i];
    });
  }

  const tableTop = doc.y;

  // Vẽ header
  drawRow(["STT", "Tên vé", "ĐVT", "SL", "Đơn giá", "Thành tiền"], tableTop);

  data.ROWS.forEach((r, i) => {
    drawRow(
      [
        i + 1,
        r.ten_loai_ve + (r.ma_ghe ? `(${r.ma_ghe})` : ""),
        "Vé",
        r.so_luong,
        Number(r.don_gia).toLocaleString("vi-vn"),
        Number(r.thanh_tien).toLocaleString("vi-vn"),
      ],
      doc.y
    );
  });

  doc.moveDown(1);
  doc.text(`Tổng: ${data.TOTAL}`);
  // doc.text(`Bằng chữ: ${data.TOTAL_TEXT}`);

  doc.moveDown(2);

  doc
    .fontSize(12)
    .text(
      `Đà Nẵng, ngày ${new Date().getDate()} tháng ${new Date().getMonth()} năm ${new Date().getFullYear()}`,
      0,
      doc.y,
      { align: "right" }
    );

  // doc.moveDown(2);

  // doc.text("Người bán hàng", { align: "right" });
  // doc.moveDown(3);
  // doc.text("(Ký, ghi rõ họ tên)", { align: "right" });

  // doc.moveUp(4);
  // doc.text("Người mua hàng", { align: "left" });
  // doc.moveDown(3);
  // doc.text("(Ký, ghi rõ họ tên)", { align: "left" });

  doc.end();

  return done;
}

function addPreviewWatermark(doc) {
  const text = "PREVIEW HOA DON";
  doc.save();

  const centerX = doc.page.width / 2;
  const centerY = doc.page.height / 2;

  // chỉ rotate text, không làm lệch layout
  doc.translate(centerX, centerY);
  doc.rotate(45);

  doc
    .fontSize(60)
    .fillColor("gray", 0.5)
    .text(text, -300, 0, { width: 600, align: "center" });
  doc.restore();
}
