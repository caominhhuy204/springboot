import React from "react";
import { UserIcon, LockClosedIcon, EnvelopeIcon } from "@heroicons/react/24/outline";
import { Form, Input, Checkbox, message } from "antd";
import { Link } from "react-router-dom";
import { z } from "zod";
import type { RuleObject } from "antd/es/form";
import handleRegister from "@/api/auth/handleRegister";
import { registerSchema, type RegisterFormValues } from "@/utils/registerSchema";

const title = "LearnEng";

const RegisterPage: React.FC = () => {
  const [form] = Form.useForm<RegisterFormValues>();

  const zodValidator = {
    validator: async (rule: RuleObject) => {
      const field = (rule as any).field as keyof RegisterFormValues;
      const allValues = form.getFieldsValue();

      try {
        await registerSchema.parseAsync(allValues);
        return Promise.resolve();
      } catch (err) {
        if (err instanceof z.ZodError) {
          const fieldError = err.issues.find((issue) => issue.path[0] === field);
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
      message.loading({ content: "Dang xu ly...", key: "reg" });

      const res = await handleRegister(
        values.username,
        values.fullname,
        values.email,
        values.password,
        values.confirmPassword,
      );

      if (res.success) {
        message.success({
          content: "Tao tai khoan thanh cong!",
          key: "reg",
          duration: 2,
        });
        window.location.href = "/login";
      } else {
        message.error({
          content: res.message || "Dang ky that bai!",
          key: "reg",
        });
      }
    } catch {
      message.error({
        content: "Co loi xay ra!",
        key: "reg",
      });
    }
  };

  return (
    <div className="login-page animated-gradient min-h-screen md:grid md:grid-cols-2">
      <div className="relative hidden overflow-hidden rounded-br-[18%] bg-white px-8 py-12 md:flex md:flex-col md:items-center md:justify-center lg:p-12">
        <h1 className="flex flex-wrap text-4xl font-bold lg:text-[50px]">
          {title.split(" ").map((word, wordIndex) => (
            <span key={wordIndex} className="flex">
              {word.split("").map((char, charIndex) => (
                <span
                  key={charIndex}
                  className="animate-color-change inline-block"
                  style={{ animationDelay: `${(wordIndex * 7 + charIndex) * 100}ms` }}
                >
                  {char}
                </span>
              ))}
              <span className="inline-block w-2" />
            </span>
          ))}
        </h1>

        <p className="max-w-md text-center text-lg leading-relaxed text-gray-600 lg:text-[20px]">
          Hanh trinh van dam bat dau tu mot tu vung.
        </p>
      </div>

      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:px-6">
        <div className="mb-8 text-center md:hidden">
          <h1 className="text-4xl font-bold text-white">{title}</h1>
          <p className="mt-2 text-sm text-white/85">Tao tai khoan moi de bat dau hoc va lam bai tap.</p>
        </div>

        <Form
          form={form}
          name="register"
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          requiredMark={false}
          className="w-full max-w-sm rounded-[28px] border border-white/20 bg-white/12 p-5 shadow-xl backdrop-blur-md sm:p-6 md:max-w-sm md:rounded-none md:border-none md:bg-transparent md:p-0 md:shadow-none"
        >
          <Form.Item name="username" rules={[zodValidator]}>
            <Input
              prefix={<UserIcon className="mr-2 h-5 w-5 text-gray-400" />}
              placeholder="Username"
              className="!rounded-full !border !border-white/30 !bg-white/20 !px-5 !py-3 !text-[14px] !backdrop-blur-md"
            />
          </Form.Item>

          <Form.Item name="fullname" rules={[zodValidator]}>
            <Input
              prefix={<UserIcon className="mr-2 h-5 w-5 text-gray-400" />}
              placeholder="Ho va ten"
              className="!rounded-full !border !border-white/30 !bg-white/20 !px-5 !py-3 !text-[14px] !backdrop-blur-md"
            />
          </Form.Item>

          <Form.Item name="email" rules={[zodValidator]}>
            <Input
              prefix={<EnvelopeIcon className="mr-2 h-5 w-5 text-gray-400" />}
              placeholder="Email cua ban"
              className="!rounded-full !border !border-white/30 !bg-white/20 !px-5 !py-3 !text-[14px] !backdrop-blur-md"
            />
          </Form.Item>

          <Form.Item name="password" rules={[zodValidator]}>
            <Input.Password
              prefix={<LockClosedIcon className="mr-2 h-5 w-5 text-gray-400" />}
              placeholder="Mat khau"
              className="!rounded-full !border !border-white/30 !bg-white/20 !px-5 !py-3 !text-[14px] !backdrop-blur-md"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={["password"]}
            rules={[zodValidator]}
          >
            <Input.Password
              prefix={<LockClosedIcon className="mr-2 h-5 w-5 text-gray-400" />}
              placeholder="Xac nhan mat khau"
              className="!rounded-full !border !border-white/30 !bg-white/20 !px-5 !py-3 !text-[14px] !backdrop-blur-md"
            />
          </Form.Item>

          <Form.Item name="agreement" valuePropName="checked" rules={[zodValidator]}>
            <Checkbox className="!text-white">
              Toi dong y voi{" "}
              <a href="#" className="font-medium underline hover:!text-gray-200">
                dieu khoan su dung
              </a>
            </Checkbox>
          </Form.Item>

          <Form.Item className="!mb-2">
            <button
              type="submit"
              className="w-full rounded-full bg-black py-3 text-[15px] font-bold text-white shadow-md transition-all duration-300 hover:bg-gray-800 hover:shadow-lg"
            >
              Dang ky
            </button>
          </Form.Item>
        </Form>

        <p className="mt-6 text-center text-sm text-white">
          Ban da la thanh vien?{" "}
          <Link to="/login" className="font-semibold underline hover:text-gray-200">
            Dang nhap
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
