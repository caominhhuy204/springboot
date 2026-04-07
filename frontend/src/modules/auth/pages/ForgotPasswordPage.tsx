import { useState } from "react";
import { Form, Input, Button, message } from "antd";
import {
  EnvelopeIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import handleForgotPassword from "@/api/auth/handleForgotPassword";

const title = "LearnEng";

const ForgotPasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState("");

  const onFinish = async (values: { email: string }) => {
    setLoading(true);
    try {
      const result = await handleForgotPassword(values.email);
      setEmailSubmitted(values.email);
      setIsSuccess(true);
      message.success(result?.message || "Yeu cau da duoc gui thanh cong.");
    } catch (error: any) {
      console.error("Forgot password failed:", error);
      const errorMsg =
        error.response?.data?.message || "Khong the gui email. Vui long thu lai sau.";
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen animated-gradient flex items-center justify-center p-6">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg p-10 md:p-14 transition-all duration-300 transform hover:scale-[1.01]">
        {!isSuccess ? (
          <>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-8 transition-colors group"
            >
              <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Quay lai Dang nhap</span>
            </Link>

            <div className="text-center mb-10">
              <h1 className="text-4xl font-extrabold mb-3">
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
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Quen mat khau?</h2>
              <p className="text-gray-600 text-[15px] leading-relaxed max-w-sm mx-auto">
                Vui long nhap email cua ban. Chung toi se gui mot lien ket de ban dat lai mat
                khau moi.
              </p>
            </div>

            <Form
              name="forgot_password"
              layout="vertical"
              onFinish={onFinish}
              className="space-y-6"
            >
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: "Vui long nhap dia chi email!" },
                  { type: "email", message: "Dia chi email khong hop le!" },
                ]}
              >
                <Input
                  prefix={<EnvelopeIcon className="w-5 h-5 text-gray-400 mr-2" />}
                  placeholder="Vi du: your.email@example.com"
                  className="!rounded-full !py-3.5 !px-6 !text-[15px] focus:shadow-md transition-all duration-300 focus:border-black"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  className="w-full !h-auto bg-black text-white font-bold py-3.5 rounded-full hover:bg-gray-800 transition-all duration-300 text-[16px] shadow-md hover:shadow-lg border-none"
                >
                  {loading ? "Dang gui..." : "Gui yeu cau dat lai mat khau"}
                </Button>
              </Form.Item>
            </Form>
          </>
        ) : (
          <div className="text-center py-4 animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <CheckCircleIcon className="w-14 h-14" />
            </div>

            <h2 className="text-3xl font-extrabold text-gray-800 mb-4">Kiem tra email cua ban</h2>

            <p className="text-gray-600 text-[16px] mb-8 leading-relaxed">
              Chung toi da gui huong dan khoi phuc mat khau den dia chi:
              <br />
              <span className="font-bold text-black break-all">{emailSubmitted}</span>
            </p>

            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 mb-10 text-gray-600 text-sm italic">
              Vui long kiem tra ca hop thu den va thu muc spam de hoan tat qua trinh doi mat
              khau.
            </div>

            <div className="space-y-4">
              <Link
                to="/login"
                className="block w-full bg-black text-white font-bold py-4 rounded-full hover:bg-gray-800 transition-all text-center shadow-lg"
              >
                Quay lai Dang nhap
              </Link>

              <button
                onClick={() => setIsSuccess(false)}
                className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-black transition-colors font-medium"
              >
                <PaperAirplaneIcon className="w-4 h-4" />
                Dung email khac
              </button>
            </div>
          </div>
        )}

        {!isSuccess && (
          <div className="text-center mt-10 text-gray-500 text-sm">
            Neu ban khong nhan duoc email, hay{" "}
            <Link
              to="/contact"
              className="text-gray-700 underline font-semibold hover:text-gray-900"
            >
              lien he ho tro
            </Link>
            .
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
