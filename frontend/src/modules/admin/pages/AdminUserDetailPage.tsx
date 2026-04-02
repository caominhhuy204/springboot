import { useEffect, useState } from "react";
import { Button, Card, Col, Descriptions, Form, Input, Row, Select, Spin, message } from "antd";
import { Link, useParams } from "react-router-dom";
import api from "@/utils/axiosClient";
import type { AdminUpdateUserPayload, UserProfile, UserRole } from "@/types/user";

function AdminUserDetailPage() {
  const { id } = useParams();
  const [form] = Form.useForm<AdminUpdateUserPayload>();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const res = await api.get<UserProfile>(`/api/admin/users/${id}`);
      setUser(res.data);
      form.setFieldsValue({
        username: res.data.username,
        fullname: res.data.fullname,
        email: res.data.email,
        role: res.data.role,
        phone: res.data.phone ?? "",
        address: res.data.address ?? "",
        avatarUrl: res.data.avatarUrl ?? "",
        bio: res.data.bio ?? "",
        dateOfBirth: res.data.dateOfBirth ?? "",
        gender: res.data.gender ?? "",
        department: res.data.department ?? "",
        specialization: res.data.specialization ?? "",
        studentCode: res.data.studentCode ?? "",
        teacherCode: res.data.teacherCode ?? "",
      });
      setLoading(false);
    };

    void loadUser();
  }, [form, id]);

  const onFinish = async (values: AdminUpdateUserPayload) => {
    const payload = {
      ...values,
      studentCode: values.role === "STUDENT" ? values.studentCode : "",
      teacherCode: values.role === "TEACHER" ? values.teacherCode : "",
    };
    const res = await api.put<UserProfile>(`/api/admin/users/${id}`, payload);
    setUser(res.data);
    message.success("Cap nhat user thanh cong");
  };

  if (loading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Row gutter={[24, 24]}>
      <Col span={24}>
        <Link to="/admin/users">Quay lai danh sach</Link>
      </Col>
      <Col xs={24} lg={9}>
        <Card title="Thong tin tai khoan" className="shadow-sm">
          <Descriptions column={1} size="small">
            <Descriptions.Item label="ID">{user?.id}</Descriptions.Item>
            <Descriptions.Item label="Username">{user?.username}</Descriptions.Item>
            <Descriptions.Item label="Email">{user?.email}</Descriptions.Item>
            <Descriptions.Item label="Role">{user?.role}</Descriptions.Item>
            <Descriptions.Item label="Ma sinh vien">{user?.studentCode || "-"}</Descriptions.Item>
            <Descriptions.Item label="Ma giao vien">{user?.teacherCode || "-"}</Descriptions.Item>
          </Descriptions>
        </Card>
      </Col>
      <Col xs={24} lg={15}>
        <Card title="Chinh sua ho so user" className="shadow-sm">
          <Form layout="vertical" form={form} onFinish={onFinish}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="username" label="Username" rules={[{ required: true, message: "Nhap username" }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="fullname" label="Ho va ten" rules={[{ required: true, message: "Nhap ho va ten" }]}>
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="email" label="Email" rules={[{ required: true, message: "Nhap email" }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="role" label="Vai tro" rules={[{ required: true, message: "Chon vai tro" }]}>
                  <Select<UserRole>
                    options={[
                      { label: "ADMIN", value: "ADMIN" },
                      { label: "TEACHER", value: "TEACHER" },
                      { label: "STUDENT", value: "STUDENT" },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="studentCode" label="Ma sinh vien">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="teacherCode" label="Ma giao vien">
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="phone" label="So dien thoai">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="dateOfBirth" label="Ngay sinh">
                  <Input type="date" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="gender" label="Gioi tinh">
              <Select
                allowClear
                options={[
                  { label: "Nam", value: "Nam" },
                  { label: "Nu", value: "Nu" },
                  { label: "Khac", value: "Khac" },
                ]}
              />
            </Form.Item>
            <Form.Item name="address" label="Dia chi">
              <Input />
            </Form.Item>
            <Form.Item name="avatarUrl" label="Avatar URL">
              <Input />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="department" label="Phong ban / Khoa">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="specialization" label="Chuyen mon">
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="bio" label="Mo ta">
              <Input.TextArea rows={4} />
            </Form.Item>
            <Button type="primary" htmlType="submit">
              Luu thong tin
            </Button>
          </Form>
        </Card>
      </Col>
    </Row>
  );
}

export default AdminUserDetailPage;
