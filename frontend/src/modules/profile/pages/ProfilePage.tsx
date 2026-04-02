import { useEffect, useState } from "react";
import { Button, Card, Col, Descriptions, Form, Input, Modal, Row, Select, message } from "antd";
import { useUser } from "@/context/authContext";
import api from "@/utils/axiosClient";
import type { UpdateProfilePayload } from "@/types/user";

type ChangePasswordFormValues = {
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

function ProfilePage() {
  const { user } = useUser();
  const [form] = Form.useForm<UpdateProfilePayload>();
  const [passwordForm] = Form.useForm<ChangePasswordFormValues>();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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
    message.success("Cap nhat ho so thanh cong");
  };

  const openPasswordModal = () => {
    passwordForm.resetFields();
    setIsPasswordModalOpen(true);
  };

  const closePasswordModal = () => {
    setIsPasswordModalOpen(false);
  };

  const onPasswordFinish = async (values: ChangePasswordFormValues) => {
    setIsChangingPassword(true);
    try {
      const response = await api.post("/api/auth/change-password", values);
      message.success(response.data?.message || "Doi mat khau thanh cong");
      closePasswordModal();
      passwordForm.resetFields();
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Khong the doi mat khau");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={10}>
          <Card
            title="Thong tin hien tai"
            className="shadow-sm"
            extra={
              <Button onClick={openPasswordModal} type="default">
                Doi mat khau
              </Button>
            }
          >
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

      <Modal
        title="Doi mat khau"
        open={isPasswordModalOpen}
        onCancel={closePasswordModal}
        onOk={() => passwordForm.submit()}
        confirmLoading={isChangingPassword}
        okText="Xac nhan"
        cancelText="Huy"
        destroyOnHidden
      >
        <Form layout="vertical" form={passwordForm} onFinish={onPasswordFinish}>
          <Form.Item
            name="oldPassword"
            label="Mat khau cu"
            rules={[{ required: true, message: "Nhap mat khau cu" }]}
          >
            <Input.Password placeholder="Nhap mat khau cu" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="Mat khau moi"
            rules={[{ required: true, message: "Nhap mat khau moi" }]}
          >
            <Input.Password placeholder="Nhap mat khau moi" />
          </Form.Item>
          <Form.Item
            name="confirmNewPassword"
            label="Xac nhan mat khau"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Nhap lai mat khau moi" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }

                  return Promise.reject(new Error("Mat khau xac nhan khong khop"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Nhap lai mat khau moi" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default ProfilePage;
