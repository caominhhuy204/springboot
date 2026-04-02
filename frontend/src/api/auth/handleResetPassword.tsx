import api from "@/utils/axiosClient";

const handleResetPassword = async(token:string, newPassword:string, confirmNewPassword:string) => {
  try {
    const res = await api.post("/api/auth/reset-password", {
        token, 
        newPassword, 
        confirmNewPassword
    })
    return res.data
  } catch (error) {
    console.error(error);
    return null;
  }
}

export default handleResetPassword