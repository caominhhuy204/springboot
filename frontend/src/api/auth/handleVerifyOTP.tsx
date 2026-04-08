import api from "@/utils/axiosClient";

const handleVerifyOTP = async (otp: string, token:string) => {
  try {
    const res = await api.post("/api/auth/verify", { otp, token});
    return res.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

export default handleVerifyOTP;
