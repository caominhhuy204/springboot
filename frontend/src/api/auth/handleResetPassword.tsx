import api from "@/utils/axiosClient";

const handleResetPassword = async(token:string, newPassword:string, confirmNewPassword:string) => {
  const res = await api.post("/api/auth/reset-password", {
      token, 
      newPassword, 
      confirmNewPassword
  })
  return res.data
}

export default handleResetPassword
