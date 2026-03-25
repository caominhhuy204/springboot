import { UserIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { Checkbox, Form, Input } from "antd";
import { Link } from "react-router-dom";

const title = "LearnEng";

function LoginPage() {
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
        {/* Logo */}
       <a href="/" className="text-2xl">LOGO</a>
        {/* Form */}
        <Form
          name="login"
          layout="vertical"
          className="w-full max-w-sm space-y-4"
        >
          {/* ── Account ── */}
          <div className="relative">
            <Form.Item>
              <Input
                prefix={<UserIcon className="w-5 h-5 text-gray-400 mr-2" />}
                placeholder="Nhập tài khoản"
                className="!rounded-full !py-3 !px-6 !text-[14px] focus:shadow-lg transition-all duration-300"
              />
            </Form.Item>
          </div>

          {/* ── Password ── */}
          <div className="relative">
            <Form.Item>
              <Input.Password
                prefix={<LockClosedIcon className="w-5 h-5 text-gray-400 mr-2" />}
                placeholder="Nhập mật khẩu"
                className="!rounded-full !py-3 !px-6 !text-[14px] focus:shadow-lg transition-all duration-300"
              />
            </Form.Item>
          </div>

          {/* ── Options ── */}
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

          {/* ── Submit ── */}
          <Form.Item>
            <button
              type="button"
              className="w-full bg-black text-white font-bold py-3 rounded-full hover:bg-gray-800 transition-all duration-300 text-[15px] shadow-md hover:shadow-lg"
            >
              Đăng nhập
            </button>
          </Form.Item>
        </Form>

        {/* <p className="text-white text-sm !-mt-10">
          Chưa có tài khoản?{" "}
          <a href="#" className="underline hover:text-gray-200">
            Đăng ký ngay
          </a>
        </p> */}
      </div>
    </div>
  );
}

export default LoginPage;
