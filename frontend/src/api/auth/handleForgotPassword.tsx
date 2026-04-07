import api from "@/utils/axiosClient";
const handleForgotPassword = async (email: string) => {
  const res = await api.post("/api/auth/forgot-password", { email });
  return res.data;
};

export default handleForgotPassword;
