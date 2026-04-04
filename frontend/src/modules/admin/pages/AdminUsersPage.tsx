import { useEffect, useState } from "react";
import { Button, Card, Input, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Link } from "react-router-dom";
import { PlusOutlined, UserOutlined } from "@ant-design/icons";
import api from "@/utils/axiosClient";
import type { UserProfile } from "@/types/user";
import CreateUserModal from "../components/CreateUserModal";

function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [keyword, setKeyword] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    void loadUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUsers = async () => {
    const res = await api.get<UserProfile[]>("/api/admin/users");
    setUsers(res.data);
  };

  const columns: ColumnsType<UserProfile> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 70,
      render: (id) => <span className="font-mono text-slate-500">#{id}</span>,
    },
    { title: "Username", dataIndex: "username", key: "username" },
    { title: "Họ và tên", dataIndex: "fullname", key: "fullname" },
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      width: 120,
      render: (role: string) => {
        const colorMap: Record<string, string> = {
          ADMIN: "red",
          TEACHER: "blue",
          STUDENT: "green",
        };
        const labelMap: Record<string, string> = {
          ADMIN: "Quản trị",
          TEACHER: "Giáo viên",
          STUDENT: "Học sinh",
        };
        return (
          <Tag color={colorMap[role] || "default"} className="font-semibold">
            {labelMap[role] || role}
          </Tag>
        );
      },
    },
    {
      title: "Thao tác",
      key: "action",
      width: 130,
      render: (_, record) => (
        <Link to={`/admin/users/${record.id}`}>
          <Button size="small" icon={<UserOutlined />}>
            Chi tiết
          </Button>
        </Link>
      ),
    },
  ];

  const filteredUsers = users.filter((user) => {
    const normalized = keyword.toLowerCase();
    return (
      user.username.toLowerCase().includes(normalized) ||
      user.fullname.toLowerCase().includes(normalized) ||
      user.email.toLowerCase().includes(normalized) ||
      user.role.toLowerCase().includes(normalized)
    );
  });

  return (
    <>
      <Card
        title={
          <Space size={8}>
            <span className="text-lg font-bold text-slate-800">Danh sách tài khoản</span>
            <Tag color="blue" className="ml-1">{filteredUsers.length} người dùng</Tag>
          </Space>
        }
        extra={
          <Space>
            <Input
              placeholder="Tìm theo username, email, vai trò..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              allowClear
              className="!w-64"
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalOpen(true)}
            >
              Tạo tài khoản
            </Button>
          </Space>
        }
        className="!rounded-xl shadow-sm"
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredUsers}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          size="middle"
        />
      </Card>

      <CreateUserModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={loadUsers}
      />
    </>
  );
}

export default AdminUsersPage;
