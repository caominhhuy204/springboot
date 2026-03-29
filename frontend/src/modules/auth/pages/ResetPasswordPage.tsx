import { useState, useEffect } from "react";
import { Form, Input, Button, message } from "antd";
import { LockClosedIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { useNavigate, useSearchParams } from "react-router-dom";
import handleResetPassword from "@/api/auth/handleResetPassword";

const title = "LearnEng";

const ResetPasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Lấy dữ liệu từ URL (?token=...&otp=...)
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const otp = searchParams.get("otp");

  useEffect(() => {
    // Kiểm tra nếu thiếu thông tin xác thực thì bắt quay lại từ đầu
    if (!token || !otp) {
      message.error(
        "Thông tin xác thực không hợp lệ. Vui lòng thực hiện lại quy trình quên mật khẩu!",
      );
      // navigate('/forgot-password');
    }
  }, [token, otp, navigate]);

  const onFinish = async (values: any) => {
    // Trong Form của bạn: name="password" và name="confirmPassword"
    const { password, confirmPassword } = values;

    if (!token) {
      message.error("Không tìm thấy Token xác thực!");
      return;
    }

    setLoading(true);
    try {
      // TRUYỀN ĐÚNG 3 THAM SỐ: token, newPassword, confirmNewPassword
      const result = await handleResetPassword(
        token,
        password,
        confirmPassword,
      );

      if (result) {
        message.success("Mật khẩu của bạn đã được cập nhật thành công!");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        message.error("Không thể đặt lại mật khẩu. Vui lòng thử lại!");
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Có lỗi xảy ra";
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen animated-gradient flex items-center justify-center p-6">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg p-10 md:p-16 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
        {/* ── Tiêu đề ── */}
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
          <h2 className="text-2xl font-bold text-gray-800">
            Thiết lập mật khẩu mới
          </h2>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            Nhập mật khẩu mới cho tài khoản của bạn. <br />
            <span className="text-[10px] text-gray-400 font-mono">
              OTP: {otp} | Token: {token?.substring(0, 8)}...
            </span>
          </p>
        </div>

        {/* ── Form Reset Password ── */}
        <Form
          name="reset_password"
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
          className="space-y-4"
        >
          {/* Mật khẩu mới */}
          <Form.Item
            name="password"
            label={
              <span className="font-semibold text-gray-700 ml-2">
                Mật khẩu mới
              </span>
            }
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu mới!" },
              { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" },
            ]}
          >
            <Input.Password
              prefix={<LockClosedIcon className="w-5 h-5 text-gray-400 mr-2" />}
              placeholder="Nhập mật khẩu mới"
              className="!rounded-full !py-3 !px-6 focus:shadow-md transition-all border-gray-200"
            />
          </Form.Item>

          {/* Xác nhận mật khẩu */}
          <Form.Item
            name="confirmPassword"
            label={
              <span className="font-semibold text-gray-700 ml-2">
                Xác nhận mật khẩu
              </span>
            }
            dependencies={["password"]}
            rules={[
              { required: true, message: "Vui lòng xác nhận lại mật khẩu!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Mật khẩu xác nhận không khớp!"),
                  );
                },
              }),
            ]}
          >
            <Input.Password
              prefix={
                <ShieldCheckIcon className="w-5 h-5 text-gray-400 mr-2" />
              }
              placeholder="Nhập lại mật khẩu mới"
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
              {loading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
            </Button>
          </Form.Item>
        </Form>

        {/* ── Ghi chú ── */}
        <div className="mt-8 p-4 bg-gray-50 rounded-2xl flex items-start gap-3 border border-gray-100">
          <div className="bg-blue-100 p-1 rounded-full">
            <ShieldCheckIcon className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-[12px] text-gray-500 leading-relaxed">
            Mẹo: Hãy sử dụng mật khẩu khác với mật khẩu cũ và không nên dùng các
            thông tin dễ đoán như ngày sinh.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
