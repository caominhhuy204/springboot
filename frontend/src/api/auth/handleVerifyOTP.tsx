import api from "@/utils/axiosClient";

const handleVerifyOTP = async (otp: string, token:string) => {
  const res = await api.post("/api/auth/verify", { otp, token});
  return res.data;
};

export default handleVerifyOTP;
