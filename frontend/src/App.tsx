import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import LoginPage from './modules/auth/pages/LoginPage'

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<LoginPage />} />
      </Routes>
    </>
  )
}

export default App
