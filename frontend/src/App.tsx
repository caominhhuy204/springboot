import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import LoginPage from './modules/auth/pages/LoginPage'
import RegisterPage from './modules/auth/pages/RegisterPage'
import ProtectedRoute from './components/ProtectedRoute'
import AppShell from './components/AppShell'
import ProfilePage from './modules/profile/pages/ProfilePage'
import AdminUsersPage from './modules/admin/pages/AdminUsersPage'
import AdminUserDetailPage from './modules/admin/pages/AdminUserDetailPage'
import DashboardPage from './modules/dashboard/pages/DashboardPage'
import ClassroomsPage from './modules/classroom/pages/ClassroomsPage'
import ClassroomDetailPage from './modules/classroom/pages/ClassroomDetailPage'
import ExamTakingPage from './modules/exam/pages/ExamTakingPage'
import ExamHistoryPage from './modules/exam/pages/ExamHistoryPage'

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path='/register' element={<RegisterPage/>}/>
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/classrooms" element={<ClassroomsPage />} />
            <Route path="/classrooms/:id" element={<ClassroomDetailPage />} />
            <Route path="/exams/:id/take" element={<ExamTakingPage />} />
            <Route path="/exams/history" element={<ExamHistoryPage />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
          <Route element={<AppShell />}>
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
          </Route>
        </Route>
      </Routes>
    </>
  )
}

export default App
