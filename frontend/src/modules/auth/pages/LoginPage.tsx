import { UserIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { Button, Checkbox, Form, Input, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useUser } from "@/context/authContext";
import { googleAuthUrl } from "@/config/runtime";

const title = "LearnEng";

function LoginPage() {
  const { login, user, isBackendWaking } = useUser();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      const roleName = String(user?.role || "");
      if (roleName.includes("TEACHER") || roleName.includes("ADMIN")) {
        navigate("/teacher/assignments");
      } else {
        navigate("/");
      }
    }
  }, [user, navigate]);

  const onFinish = async (values: any) => {
    setIsSubmitting(true);

    try {
      const { email, password } = values;
      const result = await login(email, password);
      if (result.success) {
        message.success("Dang nhap thanh cong!");
        navigate("/");
      } else {
        message.error(result.message || "Dang nhap that bai!");
      }
    } catch (error: any) {
      console.error(error);
      const errorMessage = error?.response?.data?.message ?? "Co loi xay ra, vui long thu lai!";
      message.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = googleAuthUrl;
  };

  return (
    <div className="grid h-screen grid-cols-2 animated-gradient login-page">
      <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-br-[50%] bg-white p-12">
        <h1 className="flex flex-wrap text-[50px] font-bold">
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

        <p className="max-w-md text-center !text-[20px] leading-relaxed text-gray-600">
          Welcome back and have a productive day.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-8 px-6">
        <Form
          name="login"
          layout="vertical"
          className="w-full max-w-sm space-y-4"
          onFinish={onFinish}
        >
          {isBackendWaking ? (
            <div className="rounded-2xl border border-white/30 bg-white/15 px-4 py-3 text-sm text-white backdrop-blur-md">
              Backend tren Render dang duoc danh thuc. Neu app vua bi sleep, lan truy cap dau tien
              co the cham hon binh thuong.
            </div>
          ) : null}

          <Form.Item
            name="email"
            rules={[{ required: true, message: "Vui long nhap email hoac username!" }]}
          >
            <Input
              name="email"
              prefix={<UserIcon className="mr-2 h-5 w-5 text-gray-400" />}
              placeholder="Nhap email hoac username"
              className="!rounded-full !border !border-white/30 !bg-white/20 !px-6 !py-3 !text-[14px] !backdrop-blur-md placeholder:!text-white/60 focus:shadow-lg transition-all duration-300"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "Vui long nhap mat khau!" }]}
          >
            <Input.Password
              name="password"
              prefix={<LockClosedIcon className="mr-2 h-5 w-5 text-gray-400" />}
              placeholder="Nhap mat khau"
              className="!rounded-full !border !border-white/30 !bg-white/20 !px-6 !py-3 !text-[14px] !backdrop-blur-md placeholder:!text-white/60 focus:shadow-lg transition-all duration-300"
            />
          </Form.Item>

          <div className="mb-4 flex items-center justify-between">
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox className="!text-white">Nho mat khau</Checkbox>
            </Form.Item>
            <Link to="/forgot-password" className="text-sm !text-white underline hover:!text-gray-200">
              Quen mat khau?
            </Link>
          </div>

          <Form.Item className="!mb-2">
            <Button
              htmlType="submit"
              loading={isSubmitting}
              disabled={isBackendWaking || isSubmitting}
              className="!h-auto !w-full !rounded-full !border-none !bg-black !py-3 !text-[15px] !font-bold !text-white shadow-md transition-all duration-300 hover:!bg-gray-800 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isBackendWaking ? "Dang ket noi may chu..." : "Dang nhap"}
            </Button>
          </Form.Item>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="mx-4 flex-shrink text-xs uppercase text-white">Hoac</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isBackendWaking}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white py-3 text-[15px] font-semibold text-gray-700 shadow-sm transition-all duration-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <img
              src="https://play-lh.googleusercontent.com/Eh-N9HKWJgQ4Oa5wmhaE5RbHkB3m3Ud9tsW6saUHis05BL7Xnpubi5iamR5lDKd-Ew"
              alt="Google"
              className="h-5 w-5"
            />
            Dang nhap voi Google
          </button>
        </Form>

        <p className="!-mt-2 text-sm text-white">
          Chua co tai khoan?{" "}
          <Link to="/register" className="font-semibold underline hover:text-gray-200">
            Dang ky ngay
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
