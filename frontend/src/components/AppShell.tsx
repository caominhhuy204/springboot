import {
  BellOutlined,
  BookOutlined,
  CalendarOutlined,
  DashboardOutlined,
  LogoutOutlined,
  SearchOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Badge, Button, Input, Layout, Menu, Space, Typography } from "antd";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useUser } from "@/context/authContext";

const { Header, Content, Sider } = Layout;
const { Text } = Typography;

function AppShell() {
  const { user, logout } = useUser();
  const location = useLocation();

  const items = [
    { key: "/", icon: <DashboardOutlined />, label: <Link to="/">Trang chu</Link> },
    { key: "/classrooms", icon: <BookOutlined />, label: <Link to="/classrooms">Lop hoc</Link> },
    { key: "/profile", icon: <UserOutlined />, label: <Link to="/profile">Ho so ca nhan</Link> },
    ...(user?.role === "ADMIN"
      ? [{ key: "/admin/users", icon: <TeamOutlined />, label: <Link to="/admin/users">Quan ly tai khoan</Link> }]
      : []),
  ];

  const selectedKey = location.pathname.startsWith("/admin/users")
    ? "/admin/users"
    : location.pathname.startsWith("/classrooms")
      ? "/classrooms"
    : location.pathname.startsWith("/profile")
      ? "/profile"
      : "/";

  const initials = user?.fullname
    ? user.fullname
        .split(" ")
        .filter(Boolean)
        .slice(-2)
        .map((part) => part[0]?.toUpperCase())
        .join("")
    : "U";

  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <Layout className="app-shell-bg min-h-screen">
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        width={248}
        className="portal-sider !bg-white"
      >
        <div className="px-5 pt-6 pb-4">
          <Link to="/" className="portal-logo text-slate-900 text-lg font-semibold tracking-wide">
            LearnEng Portal
          </Link>
          <Text className="block !text-slate-500 mt-1">Learning management workspace</Text>
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={items}
          className="portal-menu border-r-0 px-2"
        />
      </Sider>

      <Layout>
        <Header className="portal-header !bg-white px-4 lg:px-6 border-b border-slate-200 flex items-center justify-between">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Tim nguoi dung, lop hoc, bai tap..."
            className="max-w-[420px] hidden md:flex"
          />
          <Space size={16} align="center" wrap>
            <Space size={6} align="center" className="hidden md:flex">
              <CalendarOutlined className="text-slate-500" />
              <Text type="secondary">{today}</Text>
            </Space>
            <Badge count={3}>
              <Button shape="circle" icon={<BellOutlined />} className="portal-icon-btn" />
            </Badge>
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
              Dang xuat
            </Button>
          </Space>
        </Header>
        <Content className="p-4 lg:p-6">
          <div className="portal-content-wrap">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default AppShell;
