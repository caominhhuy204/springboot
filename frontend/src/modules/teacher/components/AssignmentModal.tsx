import React, { useEffect } from "react";
import { Form, Input, InputNumber, Modal } from "antd";
import { AssignmentDto, AssignmentRequestDto } from "../../../api/assignmentApi";

interface Props {
  visible: boolean;
  onCancel: () => void;
  onSuccess: (values: AssignmentRequestDto) => void;
  initialValues?: AssignmentDto | null;
  loading: boolean;
}

const AssignmentModal: React.FC<Props> = ({
  visible,
  onCancel,
  onSuccess,
  initialValues,
  loading,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        maxAttempts: initialValues.maxAttempts ?? 1,
        timeLimitMinutes: initialValues.timeLimitMinutes ?? undefined,
        dueAt: initialValues.dueAt ? initialValues.dueAt.slice(0, 16) : undefined,
      });
      return;
    }

    form.resetFields();
    form.setFieldsValue({
      maxAttempts: 1,
    });
  }, [visible, initialValues, form]);

  const handleOk = () => {
    form.validateFields().then((values) => {
      onSuccess({
        ...(values as AssignmentRequestDto),
        dueAt: values.dueAt || null,
      });
    });
  };

  return (
    <Modal
      title={initialValues ? "Cập nhật bài tập" : "Tạo mới bài tập"}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      okText="Lưu"
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="title"
          label="Tiêu đề"
          rules={[{ required: true, message: "Vui lòng nhập tiêu đề bài tập" }]}
        >
          <Input placeholder="Nhập tiêu đề..." />
        </Form.Item>

        <Form.Item name="description" label="Mô tả">
          <Input.TextArea placeholder="Nhập mô tả..." rows={4} />
        </Form.Item>

        <Form.Item
          name="maxAttempts"
          label="Số lần được làm"
          rules={[{ required: true, message: "Vui lòng nhập số lần được làm" }]}
        >
          <InputNumber min={1} max={20} className="!w-full" />
        </Form.Item>

        <Form.Item
          name="timeLimitMinutes"
          label="Thời gian làm bài (phút)"
          extra="Để trống nếu không giới hạn thời gian"
        >
          <InputNumber min={1} max={300} className="!w-full" />
        </Form.Item>

        <Form.Item
          name="dueAt"
          label="Hạn làm bài"
          extra="Để trống nếu không đặt hạn"
        >
          <Input type="datetime-local" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AssignmentModal;
