import fs from "fs";

const res = await fetch(
  "https://api-v2.ticketbox.vn/search/v2/events?limit=20&page=1&categories=others"
).then((res) => res.json());

const results = res.data.results;

const test2 = results.map((e) => {
  return {
    ma_nhan_vien: "NV001",
    ten_su_kien: e.name,
    mo_ta: "",
    ngay_bat_dau: e.day,
    ngay_ket_thuc: e.day,
    dia_diem: "48 Cao Thắng, Phường Hải Châu, Thành phố Đà Nẵng",
    kinh_do: 108.212682,
    vi_do: 16.077222,
    trang_thai: "DA_DUYET",
    hinh_anh: e.imageUrl,
    duong_dan: e.url,
    id_loai_su_kien: 1,
    ma_su_kien: "SK" + e.id,
  };
});

const jsonString = JSON.stringify(test2, null, 2); // null,2 để format đẹp
fs.writeFile("data.json", jsonString, (err) => {
  if (err) {
    console.error("Lỗi khi ghi file:", err);
  } else {
    console.log("Xuất JSON thành công!");
  }
});
