import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUser } from "@/context/authContext";
import { message } from "antd";

function OAuth2SuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleOAuth2Login } = useUser();
  const isCalled = useRef(false);

  useEffect(() => {
    if (isCalled.current) return;
    isCalled.current = true;

    const token = searchParams.get("token");
    if (token) {
      handleOAuth2Login(token)
        .then(() => {
          message.success("Đăng nhập thành công!");
          navigate("/");
        })
        .catch(() => {
          message.error("Đăng nhập bằng Google thất bại!");
          navigate("/login");
        });
    } else {
      navigate("/login");
    }
  }, [searchParams, navigate, handleOAuth2Login]);

  return (
    <div className="h-screen flex justify-center items-center bg-gray-100">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Đang xử lý đăng nhập...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      </div>
    </div>
  );
}

export default OAuth2SuccessPage;
