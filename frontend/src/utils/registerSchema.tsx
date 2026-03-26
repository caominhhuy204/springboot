import { z } from "zod";

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Tên đăng nhập phải có ít nhất 3 ký tự")
      .max(20, "Tên đăng nhập không quá 20 ký tự"),
    fullname: z
      .string()
      .min(2, "Vui lòng nhập đầy đủ họ tên"),
    email: z
      .string()
      .email("Email không đúng định dạng"),
    password: z
      .string()
      .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
      .regex(/[A-Z]/, "Cần ít nhất 1 chữ cái in hoa")
      .regex(/[0-9]/, "Cần ít nhất 1 chữ số")
      .regex(/[@$!%*?&]/, "Cần ít nhất 1 ký tự đặc biệt (@$!%*?&)"),
    confirmPassword: z.string(),
    agreement: z.boolean().refine((val) => val === true, {
      message: "Bạn phải đồng ý với điều khoản sử dụng",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

// Export Type để dùng ở các Component khác nếu cần
export type RegisterFormValues = z.infer<typeof registerSchema>;