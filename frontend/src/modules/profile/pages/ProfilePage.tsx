import { useEffect } from "react";
import { Button, Card, Col, Descriptions, Form, Input, Row, Select, message } from "antd";
import { useUser } from "@/context/authContext";
import api from "@/utils/axiosClient";
import type { UpdateProfilePayload } from "@/types/user";

function ProfilePage() {
  const { user, refreshProfile } = useUser();
  const [form] = Form.useForm<UpdateProfilePayload>();

  useEffect(() => {
    if (!user) {
      return;
    }

    form.setFieldsValue({
      fullname: user.fullname,
      phone: user.phone ?? "",
      address: user.address ?? "",
      avatarUrl: user.avatarUrl ?? "",
      bio: user.bio ?? "",
      dateOfBirth: user.dateOfBirth ?? "",
      gender: user.gender ?? "",
      department: user.department ?? "",
      specialization: user.specialization ?? "",
    });
  }, [form, user]);

  const onFinish = async (values: UpdateProfilePayload) => {
    await api.put("/api/profile/me", values);
    await refreshProfile();
    message.success("Cap nhat ho so thanh cong");
  };

  return (
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={10}>
        <Card title="Thong tin hien tai" className="shadow-sm">
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Username">{user?.username}</Descriptions.Item>
            <Descriptions.Item label="Ho va ten">{user?.fullname}</Descriptions.Item>
            <Descriptions.Item label="Email">{user?.email}</Descriptions.Item>
            <Descriptions.Item label="Vai tro">{user?.role}</Descriptions.Item>
            <Descriptions.Item label="So dien thoai">{user?.phone || "-"}</Descriptions.Item>
            <Descriptions.Item label="Dia chi">{user?.address || "-"}</Descriptions.Item>
            <Descriptions.Item label="Phong ban">{user?.department || "-"}</Descriptions.Item>
            <Descriptions.Item label="Chuyen mon">{user?.specialization || "-"}</Descriptions.Item>
            <Descriptions.Item label="Ma sinh vien">{user?.studentCode || "-"}</Descriptions.Item>
            <Descriptions.Item label="Ma giao vien">{user?.teacherCode || "-"}</Descriptions.Item>
          </Descriptions>
        </Card>
      </Col>
      <Col xs={24} lg={14}>
        <Card title="Cap nhat ho so" className="shadow-sm">
          <Form layout="vertical" form={form} onFinish={onFinish}>
            <Form.Item name="fullname" label="Ho va ten" rules={[{ required: true, message: "Nhap ho va ten" }]}>
              <Input />
            </Form.Item>
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
            <Form.Item name="department" label="Phong ban / Khoa">
              <Input />
            </Form.Item>
            <Form.Item name="specialization" label="Chuyen mon">
              <Input />
            </Form.Item>
            <Form.Item name="bio" label="Mo ta">
              <Input.TextArea rows={4} />
            </Form.Item>
            <Button type="primary" htmlType="submit">
              Luu thay doi
            </Button>
          </Form>
        </Card>
      </Col>
    </Row>
  );
}

export default ProfilePage;
