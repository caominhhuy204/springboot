import { Navigate, Outlet } from "react-router-dom";
import { Spin } from "antd";
import { useUser } from "@/context/authContext";
import type { UserRole } from "@/types/user";

interface ProtectedRouteProps {
  roles?: UserRole[];
}

function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { user, isLoading, loadingMessage } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 px-6">
        <div className="flex max-w-md flex-col items-center gap-4 rounded-3xl bg-white p-8 text-center shadow-sm">
          <Spin size="large" />
          <div className="space-y-2">
            <p className="text-base font-semibold text-slate-800">{loadingMessage}</p>
            <p className="text-sm text-slate-500">
              Render free plan co the mat mot luc de khoi dong lai backend sau thoi gian khong su
              dung.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
