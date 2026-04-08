import { useState, useEffect } from "react";
import { Form, Input, Button, message } from "antd";
import { LockClosedIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { useNavigate, useSearchParams } from "react-router-dom";
import handleResetPassword from "@/api/auth/handleResetPassword";

const title = "LearnEng";

const ResetPasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const otp = searchParams.get("otp");

  useEffect(() => {
    if (!token || !otp) {
      message.error(
        "Thong tin xac thuc khong hop le. Vui long thuc hien lai quy trinh quen mat khau!",
      );
    }
  }, [token, otp, navigate]);

  const onFinish = async (values: any) => {
    const { password, confirmPassword } = values;

    if (!token) {
      message.error("Khong tim thay token xac thuc!");
      return;
    }

    setLoading(true);
    try {
      const result = await handleResetPassword(token, password, confirmPassword);

      if (result) {
        message.success("Mat khau cua ban da duoc cap nhat thanh cong!");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        message.error("Khong the dat lai mat khau. Vui long thu lai!");
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Co loi xay ra";
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen animated-gradient flex items-center justify-center p-6">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg p-10 md:p-16 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold mb-4 flex justify-center">
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
          <h2 className="text-2xl font-bold text-gray-800">Thiet lap mat khau moi</h2>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            Nhap mat khau moi cho tai khoan cua ban.
          </p>
        </div>

        <Form
          name="reset_password"
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
          className="space-y-4"
        >
          <Form.Item
            name="password"
            label={<span className="font-semibold text-gray-700 ml-2">Mat khau moi</span>}
            rules={[
              { required: true, message: "Vui long nhap mat khau moi!" },
              { min: 6, message: "Mat khau phai co it nhat 6 ky tu!" },
            ]}
          >
            <Input.Password
              prefix={<LockClosedIcon className="w-5 h-5 text-gray-400 mr-2" />}
              placeholder="Nhap mat khau moi"
              className="!rounded-full !py-3 !px-6 focus:shadow-md transition-all border-gray-200"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label={
              <span className="font-semibold text-gray-700 ml-2">Xac nhan mat khau</span>
            }
            dependencies={["password"]}
            rules={[
              { required: true, message: "Vui long xac nhan lai mat khau!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Mat khau xac nhan khong khop!"));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<ShieldCheckIcon className="w-5 h-5 text-gray-400 mr-2" />}
              placeholder="Nhap lai mat khau moi"
              className="!rounded-full !py-3 !px-6 focus:shadow-md transition-all border-gray-200"
            />
          </Form.Item>

          <Form.Item className="pt-4">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full !h-[52px] bg-black text-white font-bold rounded-full hover:!bg-gray-800 border-none text-base shadow-lg transition-all transform hover:-translate-y-1"
            >
              {loading ? "Dang cap nhat..." : "Cap nhat mat khau"}
            </Button>
          </Form.Item>
        </Form>

        <div className="mt-8 p-4 bg-gray-50 rounded-2xl flex items-start gap-3 border border-gray-100">
          <div className="bg-blue-100 p-1 rounded-full">
            <ShieldCheckIcon className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-[12px] text-gray-500 leading-relaxed">
            Meo: Hay su dung mat khau khac voi mat khau cu va khong nen dung cac thong
            tin de doan nhu ngay sinh.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
