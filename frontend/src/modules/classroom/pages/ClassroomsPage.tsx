import { useEffect, useMemo, useState } from "react";
import { Button, Card, Form, Input, Modal, Space, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Link } from "react-router-dom";
import api from "@/utils/axiosClient";
import { useUser } from "@/context/authContext";
import type { Classroom, ClassroomPayload } from "@/types/classroom";

function ClassroomsPage() {
  const { user } = useUser();
  const canManage = user?.role === "ADMIN" || user?.role === "TEACHER";

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [keyword, setKeyword] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<ClassroomPayload>();

  const loadClassrooms = async () => {
    const res = await api.get<Classroom[]>("/api/classrooms");
    setClassrooms(res.data);
  };

  useEffect(() => {
    void loadClassrooms();
  }, []);

  const openCreateModal = () => {
    setEditingClassroom(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (classroom: Classroom) => {
    setEditingClassroom(classroom);
    form.setFieldsValue({
      code: classroom.code,
      name: classroom.name,
      description: classroom.description ?? "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);

    try {
      if (editingClassroom) {
        await api.put(`/api/classrooms/${editingClassroom.id}`, values);
        message.success("Cap nhat lop hoc thanh cong");
      } else {
        await api.post("/api/classrooms", values);
        message.success("Tao lop hoc thanh cong");
      }

      setModalOpen(false);
      form.resetFields();
      await loadClassrooms();
    } finally {
      setSubmitting(false);
    }
  };

  const filteredClassrooms = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) {
      return classrooms;
    }

    return classrooms.filter((classroom) =>
      [classroom.code, classroom.name, classroom.teacherName ?? "", classroom.teacherEmail ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [classrooms, keyword]);

  const columns: ColumnsType<Classroom> = [
    { title: "ID", dataIndex: "id", key: "id", width: 90 },
    { title: "Ma lop", dataIndex: "code", key: "code", width: 140 },
    { title: "Ten lop", dataIndex: "name", key: "name" },
    {
      title: "Giao vien",
      key: "teacher",
      render: (_, record) =>
        record.teacherName ? (
          <Space direction="vertical" size={0}>
            <span>{record.teacherName}</span>
            <span className="text-slate-500 text-xs">{record.teacherEmail}</span>
          </Space>
        ) : (
          <Tag>Chua gan</Tag>
        ),
    },
    { title: "So SV", dataIndex: "studentCount", key: "studentCount", width: 100 },
    {
      title: "Tac vu",
      key: "action",
      width: 250,
      render: (_, record) => (
        <Space>
          <Link to={`/classrooms/${record.id}`}>
            <Button>Xem chi tiet</Button>
          </Link>
          {canManage && <Button onClick={() => openEditModal(record)}>Sua</Button>}
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Danh sach lop hoc"
      className="shadow-sm"
      extra={
        <Space>
          <Input
            placeholder="Tim ma lop, ten lop, giao vien"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          {canManage && (
            <Button type="primary" onClick={openCreateModal}>
              Tao lop hoc
            </Button>
          )}
        </Space>
      }
    >
      <Table rowKey="id" dataSource={filteredClassrooms} columns={columns} pagination={{ pageSize: 8 }} />

      <Modal
        open={modalOpen}
        title={editingClassroom ? "Sua lop hoc" : "Tao lop hoc"}
        onCancel={() => setModalOpen(false)}
        onOk={() => void handleSubmit()}
        confirmLoading={submitting}
        okText={editingClassroom ? "Luu" : "Tao"}
      >
        <Form layout="vertical" form={form}>
          <Form.Item name="code" label="Ma lop" rules={[{ required: true, message: "Nhap ma lop" }]}>
            <Input placeholder="VD: ENG-101" />
          </Form.Item>
          <Form.Item name="name" label="Ten lop" rules={[{ required: true, message: "Nhap ten lop" }]}>
            <Input placeholder="VD: Tieng Anh giao tiep" />
          </Form.Item>
          <Form.Item name="description" label="Mo ta">
            <Input.TextArea rows={4} placeholder="Mo ta ngan cho lop hoc" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

export default ClassroomsPage;
