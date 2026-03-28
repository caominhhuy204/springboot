import { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { EnvelopeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const title = "LearnEng";

const ForgotPasswordPage = () => {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { email: string }) => {
    setLoading(true);
    try {
      console.log('Đã gửi yêu cầu khôi phục mật khẩu cho email:', values.email);
      // GỌI API KHÔI PHỤC MẬT KHẨU Ở ĐÂY
      // Ví dụ: await authService.forgotPassword(values.email);

      message.success('Đã gửi liên kết đặt lại mật khẩu đến email của bạn. Vui lòng kiểm tra hộp thư!');
    } catch (error) {
      console.error(error);
      message.error('Có lỗi xảy ra, vui lòng thử lại sau hoặc liên hệ hỗ trợ!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen animated-gradient flex items-center justify-center p-6">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg p-10 md:p-14 transition-all duration-300 transform hover:scale-[1.01]">
        
        {/* ── Nút Quay Lại ── */}
        <Link 
          to="/login" 
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-8 transition-colors group"
        >
          <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Quay lại Đăng nhập</span>
        </Link>

        {/* ── Tiêu đề & Mô tả ── */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold mb-3">
            {title.split(" ")?.map((word, wordIndex) => (
              <span key={wordIndex} className="flex justify-center">
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Quên mật khẩu?
          </h2>
          <p className="text-gray-600 text-[15px] leading-relaxed max-w-sm mx-auto">
            Vui lòng nhập email của bạn. Chúng tôi sẽ gửi một liên kết để bạn đặt lại mật khẩu mới.
          </p>
        </div>

        {/* ── Form Quên Mật Khẩu ── */}
        <Form
          name="forgot_password"
          layout="vertical"
          onFinish={onFinish}
          className="space-y-6"
        >
          {/* Email Input */}
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập địa chỉ email!' },
              { type: 'email', message: 'Địa chỉ email không hợp lệ!' }
            ]}
          >
            <Input
              prefix={<EnvelopeIcon className="w-5 h-5 text-gray-400 mr-2" />}
              placeholder="Ví dụ: your.email@example.com"
              className="!rounded-full !py-3.5 !px-6 !text-[15px] focus:shadow-md transition-all duration-300 focus:border-black"
            />
          </Form.Item>

          {/* Nút Submit */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full !h-auto bg-black text-white font-bold py-3.5 rounded-full hover:bg-gray-800 transition-all duration-300 text-[16px] shadow-md hover:shadow-lg border-none"
            >
              {loading ? 'Đang gửi...' : 'Gửi yêu cầu đặt lại mật khẩu'}
            </Button>
          </Form.Item>
        </Form>

        {/* ── Hỗ trợ bổ sung ── */}
        <div className="text-center mt-10 text-gray-500 text-sm">
          Nếu bạn không nhận được email, hãy kiểm tra thư rác hoặc <Link to="/contact" className="text-gray-700 underline font-semibold hover:text-gray-900">liên hệ hỗ trợ</Link>.
        </div>

      </div>
    </div>
  );
};

export default ForgotPasswordPage;