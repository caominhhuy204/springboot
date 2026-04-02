import { UserIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { Checkbox, Form, Input, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useUser } from "@/context/authContext";

const title = "LearnEng";

function LoginPage() {
  const { login, accessToken } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const roleName = String(user?.role?.name || user?.role || '');
      if (roleName.includes('TEACHER') || roleName.includes('ADMIN')) {
        navigate("/teacher/assignments");
      } else {
        navigate("/");
      }
    }
  }, [user, navigate]);

  const onFinish = async (values: any) => {
    try {
      const { email, password } = values;
      const result = await login(email, password);
      if (result.success) {
        message.success("Đăng nhập thành công!");
        navigate("/");
      } else {
        message.error(result.message || "Đăng nhập thất bại!");
      }
    } catch (error) {
      console.error(error);
      message.error("Có lỗi xảy ra, vùi lòng thử lại!");
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8080/oauth2/authorization/google";
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
          Welcome back & Have a productive day!
        </p>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex justify-center items-center flex-col gap-8 px-6">
        <Form
          name="login"
          layout="vertical"
          className="w-full max-w-sm space-y-4"
          onFinish={onFinish}
        >
          {/* Email */}
          <Form.Item
            name="email"
            rules={[{ required: true, message: "Vui lòng nhập email!" }]}
          >
            <Input
              name="email"
              prefix={<UserIcon className="w-5 h-5 text-gray-400 mr-2" />}
              placeholder="Nhập email"
              className="!rounded-full !py-3 !px-6 !text-[14px] focus:shadow-lg transition-all duration-300"
            />
          </Form.Item>

          {/* Password */}
          <Form.Item
            name="password"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
          >
            <Input.Password
              name="password"
              prefix={<LockClosedIcon className="w-5 h-5 text-gray-400 mr-2" />}
              placeholder="Nhập mật khẩu"
              className="!rounded-full !py-3 !px-6 !text-[14px] focus:shadow-lg transition-all duration-300"
            />
          </Form.Item>

          {/* Options */}
          <div className="flex justify-between items-center mb-4">
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox className="!text-white">Nhớ mật khẩu</Checkbox>
            </Form.Item>
            <Link
              to="/forgot-password"
              className="!text-white text-sm underline hover:!text-gray-200"
            >
              Quên mật khẩu?
            </Link>
          </div>

          {/* Submit */}
          <Form.Item className="!mb-2">
            <button
              type="submit"
              className="w-full bg-black text-white font-bold py-3 rounded-full hover:bg-gray-800 transition-all duration-300 text-[15px] shadow-md hover:shadow-lg"
            >
              Đăng nhập
            </button>
          </Form.Item>

          {/* ── Google Login Button (Thêm mới) ── */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink mx-4 text-white text-xs uppercase">
              Hoặc
            </span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full bg-white text-gray-700 font-semibold py-3 rounded-full border border-gray-300 hover:bg-gray-50 transition-all duration-300 text-[15px] flex items-center justify-center gap-2 shadow-sm"
          >
            <img
              src="https://play-lh.googleusercontent.com/Eh-N9HKWJgQ4Oa5wmhaE5RbHkB3m3Ud9tsW6saUHis05BL7Xnpubi5iamR5lDKd-Ew"
              alt="Google"
              className="w-5 h-5"
            />
            Đăng nhập với Google
          </button>
        </Form>

        {/* Chưa có tài khoản? */}
        <p className="text-white text-sm !-mt-2">
          Chưa có tài khoản?{" "}
          <Link
            to="/register"
            className="underline hover:text-gray-200 font-semibold"
          >
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
