import { useEffect, useMemo, useState } from "react";
import {
  BookOutlined,
  TeamOutlined,
  SearchOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Modal,
  Row,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import { Link } from "react-router-dom";
import api from "@/utils/axiosClient";
import { useUser } from "@/context/authContext";
import type {Classroom, ClassroomPayload, JoinClassroomPayload } from "@/types/classroom";

const { Title, Text } = Typography;

const CARD_TONES = [
  "classroom-tone-1",
  "classroom-tone-2",
  "classroom-tone-3",
  "classroom-tone-4",
  "classroom-tone-5",
  "classroom-tone-6",
];

function ClassroomsPage() {
  const { user } = useUser();
  const canManage = user?.role === "ADMIN" || user?.role === "TEACHER";
  const canJoin = user?.role === "STUDENT";

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [keyword, setKeyword] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<ClassroomPayload>();
  const [joinForm] = Form.useForm<JoinClassroomPayload>();

  const loadClassrooms = async () => {
    const res = await api.get<Classroom[]>("/api/classrooms");
    setClassrooms(res.data);
  };

  useEffect(() => {
    void loadClassrooms();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreateModal = () => {
    setEditingClassroom(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (classroom: Classroom) => {
    setEditingClassroom(classroom);
    form.setFieldsValue({
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
        message.success("Cập nhật lớp học thành công");
      } else {
        await api.post("/api/classrooms", values);
        message.success("Tạo lớp học thành công! Mã lớp đã được tạo tự động");
      }

      setModalOpen(false);
      form.resetFields();
      await loadClassrooms();
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinByCode = async () => {
    const values = await joinForm.validateFields();
    setSubmitting(true);

    try {
      await api.post("/api/classrooms/join", {
        code: values.code.trim().toUpperCase(),
      });
      message.success("Tham gia lớp học thành công");
      setJoinModalOpen(false);
      joinForm.resetFields();
      await loadClassrooms();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ?? "Không thể tham gia lớp học";
      message.error(errorMessage);
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
      [
        classroom.code,
        classroom.name,
        classroom.teacherName ?? "",
        classroom.teacherEmail ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [classrooms, keyword]);

  return (
    <Space direction="vertical" size={16} className="w-full">
      {/* ── Header card ── */}
      <Card className="dashboard-surface">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Title level={3} className="!mb-1 !text-slate-800">
              Lớp học của bạn
            </Title>
            <Text type="secondary">
              {canJoin
                ? "Bạn chỉ thấy các lớp đã tham gia. Dùng mã lớp để vào lớp mới."
                : "Tạo và quản lý lớp học dễ dàng."}
            </Text>
          </div>
          <Space wrap>
            <Input
              prefix={<SearchOutlined className="text-gray-400" />}
              placeholder="Tìm theo tên lớp, mã lớp, giáo viên"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              allowClear
              className="!min-w-[240px]"
            />
            {canJoin && (
              <Button icon={<PlusOutlined />} onClick={() => setJoinModalOpen(true)}>
                Tham gia bằng mã lớp
              </Button>
            )}
            {canManage && (
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                Tạo lớp học
              </Button>
            )}
          </Space>
        </div>
      </Card>

      {/* ── Empty state ── */}
      {filteredClassrooms.length === 0 ? (
        <Card className="dashboard-surface">
          <Empty
            description={
              canJoin
                ? "Bạn chưa tham gia lớp học nào. Hãy nhập mã lớp để bắt đầu."
                : "Chưa có lớp học nào. Hãy tạo lớp học đầu tiên."}
          />
        </Card>
      ) : (
        /* ── Classroom cards grid ── */
        <Row gutter={[14, 14]}>
          {filteredClassrooms.map((classroom) => {
            const toneClass = CARD_TONES[classroom.id % CARD_TONES.length];

            return (
              <Col key={classroom.id} xs={24} md={12} xl={8}>
                <Card
                  className={`classroom-card ${toneClass}`}
                  bodyStyle={{ padding: 0 }}
                >
                  <div className="classroom-card__head">
                    <div>
                      <Text className="classroom-card__code">{classroom.code}</Text>
                      <Title level={4} className="!mb-0 !text-white">
                        {classroom.name}
                      </Title>
                    </div>
                    <BookOutlined className="classroom-card__icon" />
                  </div>

                  <div className="classroom-card__body">
                    <Space direction="vertical" size={8} className="w-full">
                      <Text>
                        Giáo viên: <strong>{classroom.teacherName ?? "Chưa gắn"}</strong>
                      </Text>
                      <Text type="secondary">
                        {classroom.teacherEmail ?? "Không có email giáo viên"}
                      </Text>
                      <div className="flex items-center gap-2">
                        <TeamOutlined className="text-slate-400" />
                        <Text>{classroom.studentCount} sinh viên</Text>
                      </div>
                      {classroom.description && (
                        <Text type="secondary" ellipsis={{ tooltip: true }}>
                          {classroom.description}
                        </Text>
                      )}
                    </Space>

                    <div className="classroom-card__actions">
                      <Link to={`/classrooms/${classroom.id}`}>
                        <Button type="default" size="small">
                          Xem chi tiết
                        </Button>
                      </Link>
                      {canManage && (
                        <Button size="small" onClick={() => openEditModal(classroom)}>
                          Sửa
                        </Button>
                      )}
                      <Tag color="blue" className="font-mono">
                        Mã lớp: {classroom.code}
                      </Tag>
                    </div>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* ── Create / Edit modal ── */}
      <Modal
        open={modalOpen}
        title={
          <Space>
            <BookOutlined className="text-sky-500" />
            <span>{editingClassroom ? "Sửa lớp học" : "Tạo lớp học"}</span>
          </Space>
        }
        onCancel={() => setModalOpen(false)}
        onOk={() => void handleSubmit()}
        confirmLoading={submitting}
        okText={editingClassroom ? "Lưu" : "Tạo"}
        destroyOnClose
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            name="name"
            label="Tên lớp"
            rules={[{ required: true, message: "Vui lòng nhập tên lớp" }]}
          >
            <Input placeholder="VD: Tiếng Anh giao tiếp" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={4} placeholder="Mô tả ngắn cho lớp học" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Join by code modal ── */}
      <Modal
        open={joinModalOpen}
        title={
          <Space>
            <span>Tham gia lớp học</span>
          </Space>
        }
        onCancel={() => setJoinModalOpen(false)}
        onOk={() => void handleJoinByCode()}
        confirmLoading={submitting}
        okText="Tham gia"
        destroyOnClose
      >
        <Form layout="vertical" form={joinForm}>
          <Form.Item
            name="code"
            label="Mã lớp"
            rules={[{ required: true, message: "Vui lòng nhập mã lớp" }]}
            extra="Nhập mã lớp do giáo viên cung cấp"
          >
            <Input placeholder="VD: A7K9P2QX" autoComplete="off" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

export default ClassroomsPage;
