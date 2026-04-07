import { useState } from "react";
import {
  Button,
  Form,
  Input,
  Select,
  Modal,
  message,
  Space,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import api from "@/utils/axiosClient";
import type { RegisterFormValues } from "@/utils/registerSchema";

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: RegisterFormValues & { role: string }) => {
    setLoading(true);
    try {
      await api.post("/api/auth/admin/create-user", {
        username: values.username,
        fullname: values.fullname,
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
        role: values.role,
      });

      message.success("Tạo tài khoản thành công!");
      form.resetFields();
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Tạo tài khoản thất bại!";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <TeamOutlined className="text-sky-500" />
          <span>Tạo tài khoản mới</span>
        </Space>
      }
      open={open}
      onCancel={handleClose}
      footer={null}
      width={480}
      destroyOnClose
      className="create-user-modal"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={false}
        initialValues={{ role: "STUDENT" }}
      >
        {/* Chọn vai trò */}
        <Form.Item
          name="role"
          label="Vai trò"
          rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}
        >
          <Select
            placeholder="Chọn vai trò"
            size="large"
            options={[
              {
                value: "STUDENT",
                label: (
                  <Space>
                    <span>🎓</span>
                    <span>Học sinh (Student)</span>
                  </Space>
                ),
              },
              {
                value: "TEACHER",
                label: (
                  <Space>
                    <span>👨‍🏫</span>
                    <span>Giáo viên (Teacher)</span>
                  </Space>
                ),
              },
            ]}
          />
        </Form.Item>

        {/* Username */}
        <Form.Item
          name="username"
          label="Username"
          rules={[
            { required: true, message: "Vui lòng nhập username" },
            { min: 3, message: "Username tối thiểu 3 ký tự" },
          ]}
        >
          <Input
            prefix={<UserOutlined className="text-gray-400" />}
            placeholder="VD: nguyen_a"
            size="large"
          />
        </Form.Item>

        {/* Họ và tên */}
        <Form.Item
          name="fullname"
          label="Họ và tên"
          rules={[
            { required: true, message: "Vui lòng nhập họ và tên" },
            { min: 2, message: "Họ tên tối thiểu 2 ký tự" },
          ]}
        >
          <Input
            prefix={<UserOutlined className="text-gray-400" />}
            placeholder="VD: Nguyễn Văn A"
            size="large"
          />
        </Form.Item>

        {/* Email */}
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: "Vui lòng nhập email" },
            { type: "email", message: "Email không hợp lệ" },
          ]}
        >
          <Input
            prefix={<MailOutlined className="text-gray-400" />}
            placeholder="VD: nguyenvana@gmail.com"
            size="large"
          />
        </Form.Item>

        {/* Mật khẩu */}
        <Form.Item
          name="password"
          label="Mật khẩu"
          rules={[
            { required: true, message: "Vui lòng nhập mật khẩu" },
            { min: 8, message: "Mật khẩu tối thiểu 8 ký tự" },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder="Tối thiểu 8 ký tự"
            size="large"
          />
        </Form.Item>

        {/* Xác nhận mật khẩu */}
        <Form.Item
          name="confirmPassword"
          label="Xác nhận mật khẩu"
          dependencies={["password"]}
          rules={[
            { required: true, message: "Vui lòng xác nhận mật khẩu" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("Mật khẩu xác nhận không khớp!"));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder="Nhập lại mật khẩu"
            size="large"
          />
        </Form.Item>

        {/* Actions */}
        <Form.Item className="!mb-0">
          <Space className="w-full justify-end">
            <Button onClick={handleClose}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Tạo tài khoản
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <style>{`
        .create-user-modal .ant-form-item-label > label {
          font-weight: 600;
          color: #374151;
        }
      `}</style>
    </Modal>
  );
};

export default CreateUserModal;
