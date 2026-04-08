import {
  BookOutlined,
  CalendarOutlined,
  DashboardOutlined,
  FileTextOutlined,
  HistoryOutlined,
  LineChartOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  SoundOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Drawer, Grid, Layout, Menu, Space, Typography } from "antd";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import { useUser } from "@/context/authContext";

const { Header, Content, Sider } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

function AppShell() {
  const { user, logout } = useUser();
  const location = useLocation();
  const screens = useBreakpoint();
  const isMobile = !screens.lg;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const items = [
    { key: "/", icon: <DashboardOutlined />, label: <Link to="/">Trang chu</Link> },
    { key: "/classrooms", icon: <BookOutlined />, label: <Link to="/classrooms">Lop hoc</Link> },
    { key: "/exams/history", icon: <HistoryOutlined />, label: <Link to="/exams/history">Lich su bai lam</Link> },
    { key: "/progress", icon: <LineChartOutlined />, label: <Link to="/progress">Tien do hoc tap</Link> },
    { key: "/pronunciation", icon: <SoundOutlined />, label: <Link to="/pronunciation">Phat am</Link> },
    { key: "/profile", icon: <UserOutlined />, label: <Link to="/profile">Ho so ca nhan</Link> },
    ...(user?.role === "STUDENT"
      ? [{ key: "/assignments", icon: <FileTextOutlined />, label: <Link to="/assignments">Bai tap cua toi</Link> }]
      : []),
    ...(user?.role === "ADMIN" || user?.role === "TEACHER"
      ? [{ key: "/teacher/assignments", icon: <FileTextOutlined />, label: <Link to="/teacher/assignments">Quan ly bai tap</Link> }]
      : []),
    ...(user?.role === "ADMIN"
      ? [{ key: "/admin/users", icon: <TeamOutlined />, label: <Link to="/admin/users">Quan ly tai khoan</Link> }]
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

  const mobileItems = items.map((item) => ({
    ...item,
    label: <span onClick={() => setMobileMenuOpen(false)}>{item.label}</span>,
  }));

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {isMobile ? (
        <Drawer
          placement="left"
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          closable={false}
          width={280}
          styles={{ body: { padding: 0 } }}
          className="portal-mobile-drawer"
        >
          <div className="portal-sider__header">
            <Link
              to="/"
              className="portal-logo text-slate-900 font-semibold tracking-wide"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="portal-logo__text">LearnEng</span>
            </Link>
            <Button
              type="text"
              icon={<MenuFoldOutlined />}
              onClick={() => setMobileMenuOpen(false)}
              className="portal-sider__toggle"
            />
          </div>

          <Menu
            theme="light"
            mode="inline"
            selectedKeys={[selectedKey]}
            items={mobileItems}
            className="portal-menu border-r-0"
          />
        </Drawer>
      ) : (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
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
              onClick={() => setCollapsed((current) => !current)}
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
      )}

      <Layout className={`app-shell-main ${!isMobile && collapsed ? "sidebar-collapsed" : ""}`}>
        <Header className="portal-header !bg-white border-b border-slate-200 flex items-center justify-between gap-3">
          <Space size={12} align="center">
            {isMobile ? (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setMobileMenuOpen(true)}
                className="portal-mobile-menu-btn"
              />
            ) : (
              <div />
            )}
          </Space>

          <Space size={12} align="center" wrap>
            <Space size={6} align="center" className="hidden md:flex">
              <CalendarOutlined className="text-slate-500" />
              <Text type="secondary">{today}</Text>
            </Space>

            <Space size={10} align="center" className="min-w-0">
              <Avatar className="portal-avatar">{initials}</Avatar>
              <div className="hidden min-w-0 leading-tight sm:block">
                <Text strong ellipsis className="max-w-[140px] block">
                  {user?.fullname}
                </Text>
                <Text type="secondary" className="block">
                  {user?.role}
                </Text>
              </div>
            </Space>

            <Button icon={<LogoutOutlined />} onClick={logout} className="portal-logout-btn">
              <span className="hidden sm:inline">Dang xuat</span>
            </Button>
          </Space>
        </Header>

        <Content className="portal-content p-3 sm:p-4 lg:p-6">
          <div className="portal-content-wrap">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default AppShell;
