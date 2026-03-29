import { Button, Layout, Menu, Typography } from "antd";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useUser } from "@/context/authContext";

const { Header, Content } = Layout;
const { Text } = Typography;

function AppShell() {
  const { user, logout } = useUser();
  const location = useLocation();

  const items = [
    { key: "/", label: <Link to="/">Ho so ca nhan</Link> },
    ...(user?.role === "ADMIN"
      ? [{ key: "/admin/users", label: <Link to="/admin/users">Quan ly tai khoan</Link> }]
      : []),
  ];

  return (
    <Layout className="min-h-screen bg-slate-100">
      <Header className="flex items-center justify-between bg-slate-950 px-6">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-white text-lg font-semibold tracking-wide">
            LearnEng Portal
          </Link>
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={[location.pathname.startsWith("/admin/users") ? "/admin/users" : "/"]}
            items={items}
            className="min-w-[220px] bg-transparent"
          />
        </div>
        <div className="flex items-center gap-4">
          <Text className="!text-slate-200">
            {user?.fullname} ({user?.role})
          </Text>
          <Button onClick={logout}>Dang xuat</Button>
        </div>
      </Header>
      <Content className="p-6">
        <Outlet />
      </Content>
    </Layout>
  );
}

export default AppShell;
