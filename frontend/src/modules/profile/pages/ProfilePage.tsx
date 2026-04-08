import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  message,
} from "antd";
import { EditOutlined, LockOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useUser } from "@/context/authContext";
import api from "@/utils/axiosClient";

type ChangePasswordFormValues = {
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

function ProfilePage() {
  const { user } = useUser();
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm<ChangePasswordFormValues>();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      dateOfBirth: user.dateOfBirth ? dayjs(user.dateOfBirth) : null,
      gender: user.gender ?? "",
      department: user.department ?? "",
      specialization: user.specialization ?? "",
    });
  }, [form, user]);

  const openUpdateModal = () => {
    if (!user) {
      return;
    }

    form.setFieldsValue({
      fullname: user.fullname,
      phone: user.phone ?? "",
      address: user.address ?? "",
      avatarUrl: user.avatarUrl ?? "",
      bio: user.bio ?? "",
      dateOfBirth: user.dateOfBirth ? dayjs(user.dateOfBirth) : null,
      gender: user.gender ?? "",
      department: user.department ?? "",
      specialization: user.specialization ?? "",
    });
    setIsUpdateModalOpen(true);
  };

  const onFinish = async (values: Record<string, unknown>) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        dateOfBirth: values.dateOfBirth
          ? dayjs(values.dateOfBirth as string | Date).format("YYYY-MM-DD")
          : undefined,
      };

      await api.put("/api/profile/me", payload);
      message.success("Cap nhat ho so thanh cong");
      setIsUpdateModalOpen(false);
      window.location.reload();
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Khong the cap nhat ho so");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onPasswordFinish = async (values: ChangePasswordFormValues) => {
    setIsChangingPassword(true);
    try {
      const response = await api.post("/api/auth/change-password", values);
      message.success(response.data?.message || "Doi mat khau thanh cong");
      setIsPasswordModalOpen(false);
      passwordForm.resetFields();
      window.location.href = "/login";
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Khong the doi mat khau");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const roleConfig: Record<string, { colorClass: string; label: string }> = {
    ADMIN: { colorClass: "text-red-600 bg-red-50", label: "Quan tri" },
    TEACHER: { colorClass: "text-blue-600 bg-blue-50", label: "Giao vien" },
    STUDENT: { colorClass: "text-green-600 bg-green-50", label: "Hoc sinh" },
  };

  const role = roleConfig[user?.role ?? "STUDENT"] ?? {
    colorClass: "text-slate-600 bg-slate-50",
    label: user?.role ?? "",
  };

  const getUpdateModalTitle = () => {
    switch (user?.role) {
      case "ADMIN":
        return "Cap nhat thong tin quan tri";
      case "TEACHER":
        return "Cap nhat thong tin giao vien";
      case "STUDENT":
        return "Cap nhat thong tin hoc sinh";
      default:
        return "Cap nhat thong tin";
    }
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) {
      return "-";
    }

    const parsed = dayjs(date);
    return parsed.isValid() ? parsed.format("DD/MM/YYYY") : "-";
  };

  return (
    <>
      <div className="w-full max-w-3xl mx-auto">
        <Card className="dashboard-surface">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="!mb-0 !text-base !font-bold !text-slate-800">Thong tin ca nhan</h3>
            <Space>
              <Button icon={<EditOutlined />} onClick={openUpdateModal}>
                Cap nhat
              </Button>
              <Button
                icon={<LockOutlined />}
                onClick={() => {
                  passwordForm.resetFields();
                  setIsPasswordModalOpen(true);
                }}
              >
                Doi mat khau
              </Button>
            </Space>
          </div>

          <Descriptions column={{ xs: 1, sm: 2 }} size="small">
            <Descriptions.Item label="Ho va ten">{user?.fullname}</Descriptions.Item>
            <Descriptions.Item label="Email">{user?.email}</Descriptions.Item>
            <Descriptions.Item label="Vai tro">
              <span className={`inline-block rounded px-2.5 py-0.5 text-xs font-bold ${role.colorClass}`}>
                {role.label}
              </span>
            </Descriptions.Item>
            {user?.role === "STUDENT" && (
              <Descriptions.Item label="Ma sinh vien">{user?.studentCode || "-"}</Descriptions.Item>
            )}
            {user?.role === "TEACHER" && (
              <Descriptions.Item label="Ma giao vien">{user?.teacherCode || "-"}</Descriptions.Item>
            )}
            <Descriptions.Item label="So dien thoai">{user?.phone || "-"}</Descriptions.Item>
            <Descriptions.Item label="Ngay sinh">{formatDate(user?.dateOfBirth)}</Descriptions.Item>
            <Descriptions.Item label="Gioi tinh">{user?.gender || "-"}</Descriptions.Item>
            <Descriptions.Item label="Dia chi">{user?.address || "-"}</Descriptions.Item>

            {user?.role === "ADMIN" && (
              <Descriptions.Item label="Phong ban">{user?.department || "-"}</Descriptions.Item>
            )}
            {user?.role === "ADMIN" && (
              <Descriptions.Item label="Mo ta" span={2}>
                {user?.bio || "-"}
              </Descriptions.Item>
            )}

            {user?.role === "TEACHER" && (
              <Descriptions.Item label="Phong ban / Khoa">{user?.department || "-"}</Descriptions.Item>
            )}
            {user?.role === "TEACHER" && (
              <Descriptions.Item label="Chuyen mon">{user?.specialization || "-"}</Descriptions.Item>
            )}
            {user?.role === "TEACHER" && (
              <Descriptions.Item label="Mo ta" span={2}>
                {user?.bio || "-"}
              </Descriptions.Item>
            )}

            {user?.role === "STUDENT" && (
              <Descriptions.Item label="Mo ta" span={2}>
                {user?.bio || "-"}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      </div>

      <Modal
        title={getUpdateModalTitle()}
        open={isUpdateModalOpen}
        onCancel={() => setIsUpdateModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={isSubmitting}
        okText="Luu thay doi"
        cancelText="Huy"
        destroyOnClose
        width={560}
      >
        <Form layout="vertical" form={form} onFinish={onFinish} requiredMark={false}>
          <Form.Item
            name="fullname"
            label="Ho va ten"
            rules={[{ required: true, message: "Vui long nhap ho va ten" }]}
          >
            <Input placeholder="Nhap ho va ten day du" size="large" />
          </Form.Item>

          {(user?.role === "STUDENT" || user?.role === "TEACHER") && (
            <Form.Item name="phone" label="So dien thoai">
              <Input placeholder="VD: 0912 345 678" size="large" />
            </Form.Item>
          )}

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="dateOfBirth" label="Ngay sinh">
                <DatePicker className="w-full" size="large" format="DD/MM/YYYY" placeholder="Chon ngay sinh" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="gender" label="Gioi tinh">
                <Select
                  allowClear
                  placeholder="Chon gioi tinh"
                  size="large"
                  options={[
                    { label: "Nam", value: "Nam" },
                    { label: "Nu", value: "Nu" },
                    { label: "Khac", value: "Khac" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="address" label="Dia chi">
            <Input placeholder="VD: 123 Nguyen Trai, Quan 1, TP.HCM" size="large" />
          </Form.Item>

          <Form.Item name="avatarUrl" label="Avatar URL">
            <Input placeholder="https://example.com/avatar.jpg" size="large" />
          </Form.Item>

          {user?.role === "ADMIN" && (
            <>
              <Form.Item name="department" label="Phong ban">
                <Input placeholder="VD: Phong Cong nghe thong tin" size="large" />
              </Form.Item>
              <Form.Item name="bio" label="Mo ta">
                <Input.TextArea rows={3} placeholder="Gioi thieu ngan ve ban than..." />
              </Form.Item>
            </>
          )}

          {user?.role === "TEACHER" && (
            <>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="department" label="Phong ban / Khoa">
                    <Input placeholder="VD: Khoa Ngoai ngu" size="large" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="specialization" label="Chuyen mon">
                    <Input placeholder="VD: Tieng Anh" size="large" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="bio" label="Mo ta / Tieu su">
                <Input.TextArea rows={3} placeholder="Gioi thieu ngan ve ban than..." />
              </Form.Item>
            </>
          )}

          {user?.role === "STUDENT" && (
            <Form.Item name="bio" label="Mo ta / Gioi thieu">
              <Input.TextArea rows={3} placeholder="Gioi thieu ngan ve ban than..." />
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Modal
        title="Doi mat khau"
        open={isPasswordModalOpen}
        onCancel={() => setIsPasswordModalOpen(false)}
        onOk={() => passwordForm.submit()}
        confirmLoading={isChangingPassword}
        okText="Xac nhan"
        cancelText="Huy"
        destroyOnClose
      >
        <Form layout="vertical" form={passwordForm} onFinish={onPasswordFinish}>
          <Form.Item
            name="oldPassword"
            label="Mat khau cu"
            rules={[{ required: true, message: "Vui long nhap mat khau cu" }]}
          >
            <Input.Password placeholder="Nhap mat khau cu" size="large" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="Mat khau moi"
            rules={[{ required: true, message: "Vui long nhap mat khau moi" }]}
          >
            <Input.Password placeholder="Nhap mat khau moi" size="large" />
          </Form.Item>
          <Form.Item
            name="confirmNewPassword"
            label="Xac nhan mat khau"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Vui long nhap lai mat khau moi" },
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
            <Input.Password placeholder="Nhap lai mat khau moi" size="large" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default ProfilePage;
