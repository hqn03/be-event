import { z } from "zod";

const signUpSchema = z.object({
  body: z.object({
    fullName: z
      .string()
      .regex(/^[\p{L}\s]+$/u, "Họ tên không hợp lệ")
      .nonempty("Họ tên không được để trống"),
    email: z.email("Email không hợp lệ").nonempty("Email không được để trống"),
    password: z
      .string()
      .min(8, "Mật khẩu ít nhất 8 kí tự")
      .nonempty("Email không được để trống"),
  }),
});

const signInSchema = z.object({
  body: z.object({
    email: z.email("Email không hợp lệ").nonempty("Email không được để trống"),
    password: z
      .string()
      .min(8, "Mật khẩu ít nhất 8 kí tự")
      .nonempty("Email không được để trống"),
  }),
});

export { signUpSchema, signInSchema };
