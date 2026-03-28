import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import LoginPage from './modules/auth/pages/LoginPage'
import RegisterPage from './modules/auth/pages/RegisterPage'
import ForgotPasswordPage from './modules/auth/pages/ForgotPasswordPage'
import ResetPasswordPage from './modules/auth/pages/ResetPasswordPage'
import VerifyOTPPage from './modules/auth/pages/VerifyOTPPage'
function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path='/register' element={<RegisterPage/>}/>
        <Route path='/forgot-password' element={<ForgotPasswordPage/>}/>
        <Route path='/reset-password' element={<ResetPasswordPage/>}/>
        <Route path='/verify-otp' element={<VerifyOTPPage/>}/>
      </Routes>
    </>
  )
}

export default App
