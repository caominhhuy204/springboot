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
import {
  registerSchema,
  type RegisterFormValues,
} from "@/utils/registerSchema";

const title = "LearnEng";

const RegisterPage: React.FC = () => {
  const [form] = Form.useForm<RegisterFormValues>();

  const zodValidator = {
    validator: async (rule: RuleObject, _value: any) => {
      const field = (rule as any).field as keyof RegisterFormValues;
      const allValues = form.getFieldsValue();

      try {
        await registerSchema.parseAsync(allValues);
        return Promise.resolve();
      } catch (err) {
        if (err instanceof z.ZodError) {
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

      if (res.success) {
        message.success({
          content: "Tạo tài khoản thành công!",
          key: "reg",
          duration: 2,
        });
        window.location.href = "/login";
      } else {
        message.error({
          content: res.message || "Đăng ký thất bại!",
          key: "reg",
        });
      }
    } catch (error) {
      message.error({
        content: "Có lỗi xảy ra!",
        key: "reg",
      });
    }
  };

  return (
    <div className="grid grid-cols-2 h-screen animated-gradient login-page">
      {/* ── Left Panel ── */}
      <div className="bg-white rounded-br-[50%] relative flex flex-col items-center justify-center overflow-hidden p-12">
        <h1 className="text-[50px] font-bold flex flex-wrap">
          {title.split(" ")?.map((word, wordIndex) => (
            <span key={wordIndex} className="flex">
              {word.split("")?.map((char, charIndex) => (
                <span
                  key={charIndex}
                  className="animate-color-change inline-block"
                  style={{
                    animationDelay: `${(wordIndex * 7 + charIndex) * 100}ms`,
                  }}
                >
                  {char}
                </span>
              ))}
              <span className="inline-block w-2"></span>
            </span>
          ))}
        </h1>

        <p className="!text-[20px] text-center max-w-md leading-relaxed text-gray-600">
          "Hành trình vạn dặm bắt đầu từ một từ vựng."
        </p>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex justify-center items-center flex-col gap-6 px-6">
        <Form
          form={form}
          name="register"
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          requiredMark={false}
          className="w-full max-w-sm space-y-4"
        >
          <Form.Item name="username" rules={[zodValidator]}>
            <Input
              prefix={<UserIcon className="w-5 h-5 text-gray-400 mr-2" />}
              placeholder="Username"
              className="!rounded-full !py-3 !px-6 !text-[14px] focus:shadow-lg transition-all duration-300 !bg-white/20 !backdrop-blur-md !border !border-white/30  placeholder:/60"
            />
          </Form.Item>

          <Form.Item name="fullname" rules={[zodValidator]}>
            <Input
              prefix={<UserIcon className="w-5 h-5 text-gray-400 mr-2" />}
              placeholder="Họ và tên"
              className="!rounded-full !py-3 !px-6 !text-[14px] focus:shadow-lg transition-all duration-300 !bg-white/20 !backdrop-blur-md !border !border-white/30  placeholder:/60"
            />
          </Form.Item>

          <Form.Item name="email" rules={[zodValidator]}>
            <Input
              prefix={<EnvelopeIcon className="w-5 h-5 text-gray-400 mr-2" />}
              placeholder="Email của bạn"
              className="!rounded-full !py-3 !px-6 !text-[14px] focus:shadow-lg transition-all duration-300 !bg-white/20 !backdrop-blur-md !border !border-white/30  placeholder:/60"
            />
          </Form.Item>

          <Form.Item name="password" rules={[zodValidator]}>
            <Input.Password
              prefix={
                <LockClosedIcon className="w-5 h-5 text-gray-400 mr-2" />
              }
              placeholder="Mật khẩu (8+ ký tự, A, 1, @)"
              className="!rounded-full !py-3 !px-6 !text-[14px] focus:shadow-lg transition-all duration-300 !bg-white/20 !backdrop-blur-md !border !border-white/30  placeholder:/60"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={["password"]}
            rules={[zodValidator]}
          
          >
            <Input.Password
              prefix={
                <LockClosedIcon className="w-5 h-5 text-gray-400 mr-2" />
              }
              placeholder="Xác nhận mật khẩu"
              className="!rounded-full !py-3 !px-6 !text-[14px] focus:shadow-lg transition-all duration-300 !bg-white/20 !backdrop-blur-md !border !border-white/30  placeholder:/60"
            />
          </Form.Item>

          <Form.Item
            name="agreement"
            valuePropName="checked"
            rules={[zodValidator]}
          >
            <Checkbox className="!text-white">
              Tôi đồng ý với{" "}
              <a href="#" className="underline hover:!text-gray-200 font-medium">
                điều khoản sử dụng
              </a>
            </Checkbox>
          </Form.Item>

          <Form.Item className="!mb-2">
            <button
              type="submit"
              className="w-full bg-black text-white font-bold py-3 rounded-full hover:bg-gray-800 transition-all duration-300 text-[15px] shadow-md hover:shadow-lg"
            >
              Đăng ký
            </button>
          </Form.Item>
        </Form>

        <p className="text-white text-sm !-mt-2">
          Bạn đã là thành viên?{" "}
          <Link
            to="/login"
            className="underline hover:text-gray-200 font-semibold"
          >
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
