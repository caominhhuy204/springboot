import { useEffect, useState } from "react";
import { Button, Card, Input, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Link } from "react-router-dom";
import api from "@/utils/axiosClient";
import type { UserProfile } from "@/types/user";

function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    const loadUsers = async () => {
      const res = await api.get<UserProfile[]>("/api/admin/users");
      setUsers(res.data);
    };

    void loadUsers();
  }, []);

  const columns: ColumnsType<UserProfile> = [
    { title: "ID", dataIndex: "id", key: "id", width: 80 },
    { title: "Username", dataIndex: "username", key: "username" },
    { title: "Ho va ten", dataIndex: "fullname", key: "fullname" },
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Vai tro",
      dataIndex: "role",
      key: "role",
      render: (role: string) => <Tag color={role === "ADMIN" ? "red" : role === "TEACHER" ? "blue" : "green"}>{role}</Tag>,
    },
    {
      title: "Tac vu",
      key: "action",
      render: (_, record) => (
        <Link to={`/admin/users/${record.id}`}>
          <Button>Xem chi tiet</Button>
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
    <Card
      title="Danh sach tai khoan"
      extra={
        <Space>
          <Input
            placeholder="Tim theo username, email, vai tro"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </Space>
      }
      className="shadow-sm"
    >
      <Table rowKey="id" columns={columns} dataSource={filteredUsers} pagination={{ pageSize: 6 }} />
    </Card>
  );
}

export default AdminUsersPage;
