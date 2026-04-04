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
import { useUser } from "@/context/authContext";
import api from "@/utils/axiosClient";
import { EditOutlined, LockOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

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
    if (!user) return;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const openUpdateModal = () => {
    form.setFieldsValue({
      fullname: user?.fullname,
      phone: user?.phone ?? "",
      address: user?.address ?? "",
      avatarUrl: user?.avatarUrl ?? "",
      bio: user?.bio ?? "",
      dateOfBirth: user?.dateOfBirth ? dayjs(user.dateOfBirth) : null,
      gender: user?.gender ?? "",
      department: user?.department ?? "",
      specialization: user?.specialization ?? "",
    });
    setIsUpdateModalOpen(true);
  };

  const closeUpdateModal = () => {
    setIsUpdateModalOpen(false);
  };

  const onFinish = async (values: any) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        dateOfBirth: values.dateOfBirth
          ? dayjs(values.dateOfBirth).format("YYYY-MM-DD")
          : undefined,
      };
      await api.put("/api/profile/me", payload);
      message.success("Cập nhật hồ sơ thành công");
      closeUpdateModal();
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Không thể cập nhật hồ sơ");
    } finally {
      setIsSubmitting(false);
    }
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
      message.success(response.data?.message || "Đổi mật khẩu thành công");
      closePasswordModal();
      passwordForm.resetFields();
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Không thể đổi mật khẩu");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const roleConfig: Record<string, { color: string; label: string }> = {
    ADMIN: { color: "red", label: "Quản trị" },
    TEACHER: { color: "blue", label: "Giáo viên" },
    STUDENT: { color: "green", label: "Học sinh" },
  };

  const role = roleConfig[user?.role ?? "STUDENT"] ?? { color: "default", label: user?.role ?? "" };

  const getUpdateModalTitle = () => {
    switch (user?.role) {
      case "ADMIN":
        return "Cập nhật thông tin quản trị";
      case "TEACHER":
        return "Cập nhật thông tin giáo viên";
      case "STUDENT":
        return "Cập nhật thông tin học sinh";
      default:
        return "Cập nhật thông tin";
    }
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "—";
    const d = dayjs(date);
    return d.isValid() ? d.format("DD/MM/YYYY") : "—";
  };

  return (
    <>
      <div className="w-full max-w-3xl mx-auto">
        <Card className="dashboard-surface">
          <div className="flex items-center justify-between mb-4">
            <h3 className="!mb-0 !text-slate-800 !font-bold !text-base">Thông tin cá nhân</h3>
            <Space>
              <Button icon={<EditOutlined />} onClick={openUpdateModal}>
                Cập nhật
              </Button>
              <Button icon={<LockOutlined />} onClick={openPasswordModal}>
                Đổi mật khẩu
              </Button>
            </Space>
          </div>
          <Descriptions column={{ xs: 1, sm: 2 }} size="small">
            <Descriptions.Item label="Họ và tên">{user?.fullname}</Descriptions.Item>
            <Descriptions.Item label="Email">{user?.email}</Descriptions.Item>
            <Descriptions.Item label="Vai trò">
              <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold text-${role.color}-600 bg-${role.color}-50`}>
                {role.label}
              </span>
            </Descriptions.Item>
            {user?.role === "STUDENT" && (
              <Descriptions.Item label="Mã sinh viên">
                <span className="font-mono">{user?.studentCode || "—"}</span>
              </Descriptions.Item>
            )}
            {user?.role === "TEACHER" && (
              <Descriptions.Item label="Mã giáo viên">
                <span className="font-mono">{user?.teacherCode || "—"}</span>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Số điện thoại">{user?.phone || "—"}</Descriptions.Item>
            <Descriptions.Item label="Ngày sinh">{formatDate(user?.dateOfBirth)}</Descriptions.Item>
            <Descriptions.Item label="Giới tính">{user?.gender || "—"}</Descriptions.Item>
            <Descriptions.Item label="Địa chỉ">{user?.address || "—"}</Descriptions.Item>

            {user?.role === "ADMIN" && (
              <Descriptions.Item label="Phòng ban">{user?.department || "—"}</Descriptions.Item>
            )}
            {user?.role === "ADMIN" && (
              <Descriptions.Item label="Mô tả" span={2}>{user?.bio || "—"}</Descriptions.Item>
            )}

            {user?.role === "TEACHER" && (
              <Descriptions.Item label="Phòng ban / Khoa">{user?.department || "—"}</Descriptions.Item>
            )}
            {user?.role === "TEACHER" && (
              <Descriptions.Item label="Chuyên môn">{user?.specialization || "—"}</Descriptions.Item>
            )}
            {user?.role === "TEACHER" && (
              <Descriptions.Item label="Mô tả" span={2}>{user?.bio || "—"}</Descriptions.Item>
            )}

            {user?.role === "STUDENT" && (
              <Descriptions.Item label="Mô tả" span={2}>{user?.bio || "—"}</Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      </div>

      <Modal
        title={getUpdateModalTitle()}
        open={isUpdateModalOpen}
        onCancel={closeUpdateModal}
        onOk={() => form.submit()}
        confirmLoading={isSubmitting}
        okText="Lưu thay đổi"
        cancelText="Hủy"
        destroyOnClose
        width={560}
      >
        <Form layout="vertical" form={form} onFinish={onFinish} requiredMark={false}>
          <Form.Item
            name="fullname"
            label="Họ và tên"
            rules={[{ required: true, message: "Vui lòng nhập họ và tên" }]}
          >
            <Input placeholder="Nhập họ và tên đầy đủ" size="large" />
          </Form.Item>

          {(user?.role === "STUDENT" || user?.role === "TEACHER") && (
            <Form.Item name="phone" label="Số điện thoại">
              <Input placeholder="VD: 0912 345 678" size="large" />
            </Form.Item>
          )}

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="dateOfBirth" label="Ngày sinh">
                <DatePicker className="w-full" size="large" format="DD/MM/YYYY" placeholder="Chọn ngày sinh" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="gender" label="Giới tính">
                <Select allowClear placeholder="Chọn giới tính" size="large" options={[
                  { label: "Nam", value: "Nam" },
                  { label: "Nữ", value: "Nữ" },
                  { label: "Khác", value: "Khác" },
                ]} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="address" label="Địa chỉ">
            <Input placeholder="VD: 123 Nguyễn Trãi, Q1, TP.HCM" size="large" />
          </Form.Item>

          {user?.role === "ADMIN" && (
            <>
              <Form.Item name="avatarUrl" label="Avatar URL">
                <Input placeholder="https://example.com/avatar.jpg" size="large" />
              </Form.Item>
              <Form.Item name="department" label="Phòng ban">
                <Input placeholder="VD: Phòng Công nghệ thông tin" size="large" />
              </Form.Item>
              <Form.Item name="bio" label="Mô tả">
                <Input.TextArea rows={3} placeholder="Giới thiệu ngắn về bản thân..." />
              </Form.Item>
            </>
          )}

          {user?.role === "TEACHER" && (
            <>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="department" label="Phòng ban / Khoa">
                    <Input placeholder="VD: Khoa Ngoại ngữ" size="large" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="specialization" label="Chuyên môn">
                    <Input placeholder="VD: Tiếng Anh" size="large" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="avatarUrl" label="Avatar URL">
                <Input placeholder="https://example.com/avatar.jpg" size="large" />
              </Form.Item>
              <Form.Item name="bio" label="Mô tả / Tiểu sử">
                <Input.TextArea rows={3} placeholder="Giới thiệu ngắn về bản thân..." />
              </Form.Item>
            </>
          )}

          {user?.role === "STUDENT" && (
            <>
              <Form.Item name="avatarUrl" label="Avatar URL">
                <Input placeholder="https://example.com/avatar.jpg" size="large" />
              </Form.Item>
              <Form.Item name="bio" label="Mô tả / Giới thiệu">
                <Input.TextArea rows={3} placeholder="Giới thiệu ngắn về bản thân..." />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>

      <Modal
        title="Đổi mật khẩu"
        open={isPasswordModalOpen}
        onCancel={closePasswordModal}
        onOk={() => passwordForm.submit()}
        confirmLoading={isChangingPassword}
        okText="Xác nhận"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form layout="vertical" form={passwordForm} onFinish={onPasswordFinish}>
          <Form.Item name="oldPassword" label="Mật khẩu cũ" rules={[{ required: true, message: "Vui lòng nhập mật khẩu cũ" }]}>
            <Input.Password placeholder="Nhập mật khẩu cũ" size="large" />
          </Form.Item>
          <Form.Item name="newPassword" label="Mật khẩu mới" rules={[{ required: true, message: "Vui lòng nhập mật khẩu mới" }]}>
            <Input.Password placeholder="Nhập mật khẩu mới" size="large" />
          </Form.Item>
          <Form.Item
            name="confirmNewPassword"
            label="Xác nhận mật khẩu"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Vui lòng nhập lại mật khẩu mới" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Mật khẩu xác nhận không khớp"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Nhập lại mật khẩu mới" size="large" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default ProfilePage;
