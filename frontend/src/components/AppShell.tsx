import {
  BookOutlined,
  CalendarOutlined,
  DashboardOutlined,
  LogoutOutlined,
  SoundOutlined,
  TeamOutlined,
  UserOutlined,
  HistoryOutlined,
  FileTextOutlined,
  LineChartOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Layout, Menu, Space, Typography } from "antd";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import { useUser } from "@/context/authContext";

const { Header, Content, Sider } = Layout;
const { Text } = Typography;

function AppShell() {
  const { user, logout } = useUser();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const items = [
    { key: "/", icon: <DashboardOutlined />, label: <Link to="/">Trang chủ</Link> },
    { key: "/classrooms", icon: <BookOutlined />, label: <Link to="/classrooms">Lớp học</Link> },
    { key: "/exams/history", icon: <HistoryOutlined />, label: <Link to="/exams/history">Lịch sử bài làm</Link> },
    { key: "/progress", icon: <LineChartOutlined />, label: <Link to="/progress">Tiến độ học tập</Link> },
    { key: "/pronunciation", icon: <SoundOutlined />, label: <Link to="/pronunciation">Phát âm</Link> },
    { key: "/profile", icon: <UserOutlined />, label: <Link to="/profile">Hồ sơ cá nhân</Link> },
    ...(user?.role === "STUDENT"
      ? [{ key: "/assignments", icon: <FileTextOutlined />, label: <Link to="/assignments">Bài tập của tôi</Link> }]
      : []),
    ...(user?.role === "ADMIN" || user?.role === "TEACHER"
      ? [{ key: "/teacher/assignments", icon: <FileTextOutlined />, label: <Link to="/teacher/assignments">Quản lý bài tập</Link> }]
      : []),
    ...(user?.role === "ADMIN"
      ? [{ key: "/admin/users", icon: <TeamOutlined />, label: <Link to="/admin/users">Quản lý tài khoản</Link> }]
      : []),
  ];

  const selectedKey = location.pathname.startsWith("/admin")
    ? "/admin/users"
    : location.pathname.startsWith("/pronunciation")
      ? "/pronunciation"
    : location.pathname.startsWith("/classrooms")
      ? "/classrooms"
    : location.pathname.startsWith("/exams/history")
      ? "/exams/history"
    : location.pathname.startsWith("/teacher/assignments")
      ? "/teacher/assignments"
    : location.pathname.startsWith("/assignments")
      ? "/assignments"
    : location.pathname.startsWith("/profile")
      ? "/profile"
      : "/";

  const initials = user?.fullname
    ? user.fullname
        .split(" ")
        .filter(Boolean)
        .slice(-2)
        .map((part: string) => part[0]?.toUpperCase())
        .join("")
    : "U";

  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        breakpoint="lg"
        collapsedWidth={72}
        width={240}
        className="portal-sider !bg-white !fixed !h-screen !top-0 !left-0 !z-50"
      >
        <div className="portal-sider__header">
          <Link to="/" className="portal-logo text-slate-900 font-semibold tracking-wide">
            {!collapsed && <span className="portal-logo__text">LearnEng</span>}
          </Link>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="portal-sider__toggle"
          />
        </div>

        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={items}
          className="portal-menu border-r-0"
          inlineCollapsed={collapsed}
        />
      </Sider>

      <Layout className={`app-shell-main ${collapsed ? "sidebar-collapsed" : ""}`}>
        <Header className="portal-header !bg-white border-b border-slate-200 flex items-center justify-between">
          <Space size={16} align="center">
            <div></div>
          </Space>
          <Space size={16} align="center" wrap>
            <Space size={6} align="center" className="hidden md:flex">
              <CalendarOutlined className="text-slate-500" />
              <Text type="secondary">{today}</Text>
            </Space>
            
            <Space size={10} align="center">
              <Avatar className="portal-avatar">{initials}</Avatar>
              <div className="leading-tight hidden sm:block">
                <Text strong>{user?.fullname}</Text>
                <Text type="secondary" className="block">
                  {user?.role}
                </Text>
              </div>
            </Space>
            <Button icon={<LogoutOutlined />} onClick={logout} className="portal-logout-btn">
              Đăng xuất
            </Button>
          </Space>
        </Header>

        <Content className="portal-content p-4 lg:p-6">
          <div className="portal-content-wrap">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default AppShell;
