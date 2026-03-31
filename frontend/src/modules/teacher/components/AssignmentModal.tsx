import React, { useEffect } from 'react';
import { Modal, Form, Input } from 'antd';
import { AssignmentRequestDto, AssignmentDto } from '../../../api/assignmentApi';

interface Props {
  visible: boolean;
  onCancel: () => void;
  onSuccess: (values: AssignmentRequestDto) => void;
  initialValues?: AssignmentDto | null;
  loading: boolean;
}

const AssignmentModal: React.FC<Props> = ({ visible, onCancel, onSuccess, initialValues, loading }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && initialValues) {
      form.setFieldsValue(initialValues);
    } else if (visible && !initialValues) {
      form.resetFields();
    }
  }, [visible, initialValues, form]);

  const handleOk = () => {
    form.validateFields().then((values) => {
      onSuccess(values as AssignmentRequestDto);
    });
  };

  return (
    <Modal
      title={initialValues ? "Cập nhật Bài tập" : "Tạo Mới Bài tập"}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      okText="Lưu"
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical">
        <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Vui lòng nhập tiêu đề bài tập' }]}>
          <Input placeholder="Nhập tiêu đề..." />
        </Form.Item>
        <Form.Item name="description" label="Mô tả">
          <Input.TextArea placeholder="Nhập mô tả (tùy chọn)..." rows={4} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AssignmentModal;
