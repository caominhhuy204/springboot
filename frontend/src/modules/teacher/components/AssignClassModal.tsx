import React, { useEffect, useState } from 'react';
import { Modal, Form, Select } from 'antd';
import toast from 'react-hot-toast';
import { ClassroomDto, getClassrooms, assignToClassroom, AssignmentDto } from '../../../api/assignmentApi';

const { Option } = Select;

interface Props {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  assignment: AssignmentDto | null;
}

const AssignClassModal: React.FC<Props> = ({ visible, onCancel, onSuccess, assignment }) => {
  const [form] = Form.useForm();
  const [classrooms, setClassrooms] = useState<ClassroomDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (visible) {
      form.resetFields();
      if (classrooms.length === 0) {
        setFetching(true);
        getClassrooms()
          .then((data: ClassroomDto[]) => setClassrooms(data))
          .catch(() => toast.error('Không thể lấy danh sách lớp học'))
          .finally(() => setFetching(false));
      }
    }
  }, [visible, form, classrooms.length]);

  const handleOk = () => {
    form.validateFields().then((values) => {
      if (!assignment) return;
      setLoading(true);
      assignToClassroom(assignment.id, values.classroomId)
        .then(() => {
          toast.success("Giao bài tập thành công!");
          onSuccess();
        })
        .catch(() => {
          toast.error("Giao bài tập thất bại.");
        })
        .finally(() => setLoading(false));
    });
  };

  return (
    <Modal
      title={`Giao bài tập: ${assignment?.title || ''}`}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading || fetching}
      okText="Giao bài"
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical">
        <Form.Item 
          name="classroomId" 
          label="Chọn lớp học" 
          rules={[{ required: true, message: 'Vui lòng chọn một lớp học!' }]}
        >
          <Select placeholder="Chọn Lớp..." loading={fetching}>
            {classrooms.map(c => (
              <Option key={c.id} value={c.id}>
                {c.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AssignClassModal;
