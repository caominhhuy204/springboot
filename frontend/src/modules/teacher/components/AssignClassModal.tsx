import React, { useEffect, useState } from "react";
import { Form, Modal, Select } from "antd";
import toast from "react-hot-toast";
import { AssignmentDto, assignToClassrooms, ClassroomDto, getClassrooms } from "../../../api/assignmentApi";

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
    if (!visible) {
      return;
    }

    form.setFieldsValue({
      classroomIds: assignment?.classrooms?.map((classroom) => classroom.id) ?? [],
    });

    if (classrooms.length > 0) {
      return;
    }

    setFetching(true);
    getClassrooms()
      .then((data: ClassroomDto[]) => setClassrooms(data))
      .catch(() => toast.error("Không thể lấy danh sách lớp học"))
      .finally(() => setFetching(false));
  }, [visible, form, classrooms.length, assignment]);

  const handleOk = () => {
    form.validateFields().then((values) => {
      if (!assignment) {
        return;
      }

      setLoading(true);
      assignToClassrooms(assignment.id, values.classroomIds)
        .then(() => {
          toast.success("Giao bài tập thành công!");
          onSuccess();
        })
        .catch((error: any) => {
          const errorMessage = error?.response?.data?.message ?? "Giao bài tập thất bại.";
          toast.error(errorMessage);
        })
        .finally(() => setLoading(false));
    });
  };

  return (
    <Modal
      title={`Giao bài tập: ${assignment?.title || ""}`}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading || fetching}
      okText="Lưu danh sách lớp"
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="classroomIds"
          label="Chọn các lớp học"
          rules={[{ required: true, message: "Vui lòng chọn ít nhất một lớp học!" }]}
          extra="Danh sách này sẽ là toàn bộ các lớp được giao cho bài tập."
        >
          <Select
            mode="multiple"
            placeholder="Chọn một hoặc nhiều lớp..."
            loading={fetching}
            optionFilterProp="label"
            options={classrooms.map((classroom) => ({
              value: classroom.id,
              label: classroom.name,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AssignClassModal;
