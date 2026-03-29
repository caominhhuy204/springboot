import { Navigate, Outlet } from "react-router-dom";
import { Spin } from "antd";
import { useUser } from "@/context/authContext";
import type { UserRole } from "@/types/user";

interface ProtectedRouteProps {
  roles?: UserRole[];
}

function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <Spin size="large" />
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
