import api from "@/utils/axiosClient";

const handleRegister = async (
  username: string,
  fullname:string,
  email: string,
  password: string,
  confirmPassword: string,
) => {
  try {
    const res = await api.post("/api/auth/register", {
      username,
      fullname,
      email,
      password,
      confirmPassword,
    });

    return res.data;
  } catch (error: any) {
    if (error.response) {
      console.error("Server error:", error.response.data);
      return error.response.data;
    } else {
      console.error("Network or other error:", error.message);
      return null;
    }
  }
};

export default handleRegister;