import React from "react";
import {
  UserIcon,
  LockClosedIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import { Form, Input, Checkbox, message } from "antd";
import { Link } from "react-router-dom";
import { z } from "zod";
import type { RuleObject } from "antd/es/form";
import handleRegister from "@/api/auth/handleRegister";
// Import từ file schema bạn đã tách
import {
  registerSchema,
  type RegisterFormValues,
} from "@/utils/registerSchema";

const title = "LearnEng";

const RegisterPage: React.FC = () => {
  const [form] = Form.useForm<RegisterFormValues>();

  // ── Validator Bridge (Zod -> Ant Design) ──
  const zodValidator = {
    validator: async (rule: RuleObject, _value: any) => {
      // Ép kiểu rule để lấy được tên field đang validate
      const field = (rule as any).field as keyof RegisterFormValues;
      const allValues = form.getFieldsValue();

      try {
        // Validate toàn bộ object để check được cả các phần liên quan (như confirmPassword)
        await registerSchema.parseAsync(allValues);
        return Promise.resolve();
      } catch (err) {
        if (err instanceof z.ZodError) {
          // Tìm lỗi cụ thể của field hiện tại
          const fieldError = err.issues.find(
            (issue) => issue.path[0] === field,
          );
          if (fieldError) {
            return Promise.reject(fieldError.message);
          }
        }
        return Promise.resolve();
      }
    },
  };

  const onFinish = async (values: RegisterFormValues) => {
    try {
      message.loading({ content: "Đang xử lý...", key: "reg" });

      const res = await handleRegister(
        values.username,
        values.fullname,
        values.email,
        values.password,
        values.confirmPassword,
      );

      message.success({
        content: "Tạo tài khoản thành công!",
        key: "reg",
        duration: 2,
      });
    } catch (error) {
      message.error({
        content: "Có lỗi xảy ra!",
        key: "reg",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 h-screen animated-gradient login-page overflow-hidden">
      {/* ── Left Panel ── */}
      <div className="hidden lg:flex bg-white rounded-br-[150px] relative flex-col items-center justify-center p-12 shadow-2xl">
        <h1 className="text-[60px] font-black flex flex-wrap mb-4 tracking-tight">
          {title.split("").map((char, index) => (
            <span
              key={index}
              className="animate-color-change inline-block"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {char}
            </span>
          ))}
        </h1>
        <p className="text-[20px] text-center max-w-md leading-relaxed text-gray-500 font-medium italic">
          "Hành trình vạn dặm bắt đầu từ một từ vựng."
        </p>
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-60"></div>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex justify-center items-center flex-col gap-4 px-8 overflow-y-auto py-10">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h2 className="text-white text-3xl font-bold mb-2">Đăng ký</h2>
            <div className="h-1 w-16 bg-white mx-auto rounded-full opacity-50"></div>
          </div>

          <Form
            form={form}
            name="register"
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
            requiredMark={false}
          >
            <Form.Item name="username" rules={[zodValidator]} hasFeedback>
              <Input
                prefix={<UserIcon className="w-5 h-5 text-gray-400 mr-2" />}
                placeholder="Username"
                className="custom-input"
              />
            </Form.Item>

            <Form.Item name="fullname" rules={[zodValidator]} hasFeedback>
              <Input
                prefix={<UserIcon className="w-5 h-5 text-gray-400 mr-2" />}
                placeholder="Họ và tên"
                className="custom-input"
              />
            </Form.Item>

            <Form.Item name="email" rules={[zodValidator]} hasFeedback>
              <Input
                prefix={<EnvelopeIcon className="w-5 h-5 text-gray-400 mr-2" />}
                placeholder="Email của bạn"
                className="custom-input"
              />
            </Form.Item>

            <Form.Item name="password" rules={[zodValidator]} hasFeedback>
              <Input.Password
                prefix={
                  <LockClosedIcon className="w-5 h-5 text-gray-400 mr-2" />
                }
                placeholder="Mật khẩu (8+ ký tự, A, 1, @)"
                className="custom-input"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={["password"]}
              rules={[zodValidator]}
              hasFeedback
            >
              <Input.Password
                prefix={
                  <LockClosedIcon className="w-5 h-5 text-gray-400 mr-2" />
                }
                placeholder="Xác nhận mật khẩu"
                className="custom-input"
              />
            </Form.Item>

            <Form.Item
              name="agreement"
              valuePropName="checked"
              rules={[zodValidator]}
            >
              <Checkbox className="!text-white text-[13px]">
                Tôi đồng ý với{" "}
                <a
                  href="#"
                  className="underline font-medium hover:text-blue-200"
                >
                  điều khoản sử dụng
                </a>
              </Checkbox>
            </Form.Item>

            <Form.Item>
              <button
                type="submit"
                className="w-full bg-white text-blue-700 font-bold py-3 rounded-full hover:shadow-2xl transform transition-all duration-300 hover:-translate-y-1 active:scale-95 text-[16px] mt-2"
              >
                Tạo tài khoản ngay
              </button>
            </Form.Item>
          </Form>

          <p className="text-white text-center text-sm mt-4 opacity-90 font-light">
            Bạn đã là thành viên?{" "}
            <Link
              to="/login"
              className="font-bold hover:text-blue-200 underline transition-colors"
            >
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        .custom-input {
          border-radius: 9999px !important;
          padding: 12px 20px !important;
          border: 1px solid transparent !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .custom-input:hover { border-color: rgba(255,255,255,0.5) !important; }
        .custom-input:focus, .ant-input-affix-wrapper-focused {
          border-color: #fff !important;
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.4) !important;
          background: #fff !important;
        }
        .ant-form-item-explain-error {
          color: #ff9494 !important;
          font-size: 12px !important;
          padding-left: 15px;
          margin-top: 4px;
          font-weight: 500;
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animated-gradient {
          background: linear-gradient(-45deg, #1e3a8a, #3b82f6, #0ea5e9, #2dd4bf);
          background-size: 400% 400%;
          animation: gradient 12s ease infinite;
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
};

export default RegisterPage;
