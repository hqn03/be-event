import { z } from "zod";

const creatEventSchema = z.object({
  body: z
    .object({
      name: z.string().nonempty("Tiêu đề sự kiện không được để trống"),
      description: z.string().nonempty("Mô tả không được để trống"),
      startDate: z.coerce.date().refine((val) => val > new Date(), {
        error: "Ngày bắt đầu lớn hơn ngày hiện tại",
        path: ["startDate"],
      }),
      endDate: z.coerce.date(),
      imageUrl: z.url("URL không hợp lệ"),
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      address: z.string().nonempty("Địa chỉ không được để trống"),
    })
    .refine((data) => data.endDate >= new Date(data.startDate), {
      error: "Ngày kết thúc phải bằng hoặc lớn hơn ngày bắt đầu",
      path: ["endDate"],
    }),
});

const updateEventSchema = z.object({
  body: z
    .object({
      title: z.string().nonempty("Tiêu đề sự kiện không được để trống"),
      description: z.string().nonempty("Mô tả không được để trống"),
      startDate: z.iso.date().refine((val) => new Date(val) > new Date(), {
        error: "Ngày bắt đầu lớn hơn ngày hiện tại",
        path: ["startDate"],
      }),
      endDate: z.iso.date(),
    })
    .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
      error: "Ngày kết thúc phải bằng hoặc lớn hơn ngày bắt đầu",
      path: ["endDate"],
    }),
});

export { creatEventSchema };
