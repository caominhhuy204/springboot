import React, { useState, useRef, useEffect } from 'react';
import { Button, message } from 'antd';
import { ShieldCheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useNavigate, useSearchParams } from 'react-router-dom'; // Thêm useSearchParams
import handleVerifyOTP from '@/api/auth/handleVerifyOTP';

const title = "LearnEng";

const VerifyOTPPage = () => {
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60 * 5); 
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  
  // Lấy token từ URL: ?token=abc-123
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    // Nếu không có token trên URL, có thể điều hướng về trang quên mật khẩu
    if (!token) {
      message.error("Liên kết xác thực không hợp lệ hoặc đã hết hạn!");
      // navigate("/forgot-password");
    }

    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [token]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;

    const newOtp = [...otp];
    newOtp[index] = element.value.substring(element.value.length - 1);
    setOtp(newOtp);

    if (element.value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join("");
    
    if (!token) {
      message.error("Thiếu token xác thực!");
      return;
    }

    if (otpString.length < 6) {
      message.warning("Vui lòng nhập đầy đủ 6 chữ số!");
      return;
    }

    setLoading(true);
    try {
      const result = await handleVerifyOTP(otpString, token);
      if (result && result.valid) {
        message.success("Xác thực OTP thành công!");
        navigate(`/reset-password?token=${token}&otp=${otpString}`);
      } else {
        message.error("Mã OTP không chính xác hoặc đã hết hạn!");
      }
    } catch (error) {
      console.error(error);
      message.error("Đã xảy ra lỗi trong quá trình xác thực!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen animated-gradient flex items-center justify-center p-6">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg p-10 md:p-16 text-center">
        
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-gray-50 rounded-full ring-8 ring-gray-50/50">
            <ShieldCheckIcon className="w-12 h-12 text-black" />
          </div>
        </div>

        <h2 className="text-3xl font-extrabold text-gray-800 mb-2">Xác thực OTP</h2>
        <p className="text-gray-500 mb-10 text-[15px]">
          Mã xác thực đã được gửi đến email của bạn. <br/>
          <span className="text-xs text-gray-400 font-mono">Token: {token?.substring(0,8)}...</span>
        </p>

        <div className="flex justify-between gap-2 mb-10">
          {otp.map((data, index) => (
            <input
              key={index}
              type="text"
              maxLength={1}
              ref={(el) => (inputRefs.current[index] = el)}
              value={data}
              onChange={(e) => handleChange(e.target, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="w-12 h-14 md:w-14 md:h-16 text-2xl font-bold text-center border-2 border-gray-200 rounded-2xl focus:border-black focus:ring-0 transition-all outline-none"
            />
          ))}
        </div>

        <Button
          onClick={handleVerify}
          loading={loading}
          className="w-full !h-[55px] bg-black text-white font-bold rounded-full hover:!bg-gray-800 border-none text-base mb-6"
        >
          {loading ? 'Đang kiểm tra...' : 'Xác nhận mã OTP'}
        </Button>

        <div className="flex flex-col items-center gap-2">
          <p className="text-gray-500 text-sm">Bạn không nhận được mã?</p>
          <button
            disabled={timer > 0}
            onClick={() => setTimer(60)}
            className={`flex items-center gap-2 font-semibold text-sm transition-colors ${
              timer > 0 ? "text-gray-300 cursor-not-allowed" : "text-black hover:underline"
            }`}
          >
            <ArrowPathIcon className={`w-4 h-4 ${timer > 0 ? "" : "animate-spin-slow"}`} />
            {timer > 0 ? `Gửi lại sau ${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')}` : "Gửi lại mã ngay"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTPPage;