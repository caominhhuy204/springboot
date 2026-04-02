import { useEffect, useMemo, useState } from "react";
import { Button, Card, Col, Empty, Form, Input, Modal, Row, Space, Tag, Typography, message } from "antd";
import { BookOutlined, TeamOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import api from "@/utils/axiosClient";
import { useUser } from "@/context/authContext";
import type { Classroom, ClassroomPayload, JoinClassroomPayload } from "@/types/classroom";

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

  const openJoinModal = () => {
    joinForm.resetFields();
    setJoinModalOpen(true);
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
        message.success("Tao lop hoc thanh cong. Ma lop da duoc tao tu dong");
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
      message.success("Tham gia lop hoc thanh cong");
      setJoinModalOpen(false);
      joinForm.resetFields();
      await loadClassrooms();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message ?? "Khong the tham gia lop hoc";
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
      [classroom.code, classroom.name, classroom.teacherName ?? "", classroom.teacherEmail ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [classrooms, keyword]);

  return (
    <Space direction="vertical" size={16} className="w-full">
      <Card className="shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Title level={3} className="!mb-1">
              Lop hoc cua ban
            </Title>
            <Text type="secondary">
              {canJoin
                ? "Ban chi thay cac lop da tham gia. Dung ma lop de vao lop moi."
                : "Tao va quan ly lop hoc theo kieu Google Classroom."}
            </Text>
          </div>
          <Space wrap>
            <Input
              placeholder="Tim theo ten lop, ma lop, giao vien"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              allowClear
              className="min-w-[240px]"
            />
            {canJoin && (
              <Button type="default" onClick={openJoinModal}>
                Tham gia bang ma lop
              </Button>
            )}
            {canManage && (
              <Button type="primary" onClick={openCreateModal}>
                Tao lop hoc
              </Button>
            )}
          </Space>
        </div>
      </Card>

      {filteredClassrooms.length === 0 ? (
        <Card className="shadow-sm">
          <Empty
            description={
              canJoin
                ? "Ban chua tham gia lop hoc nao. Hay nhap ma lop de bat dau."
                : "Chua co lop hoc nao. Hay tao lop hoc dau tien."
            }
          />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {filteredClassrooms.map((classroom) => {
            const toneClass = CARD_TONES[classroom.id % CARD_TONES.length];

            return (
              <Col key={classroom.id} xs={24} md={12} xl={8}>
                <Card className={`classroom-card ${toneClass}`} bodyStyle={{ padding: 0 }}>
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
                        Giao vien: <strong>{classroom.teacherName ?? "Chua gan"}</strong>
                      </Text>
                      <Text type="secondary">{classroom.teacherEmail ?? "Khong co email giao vien"}</Text>
                      <div className="flex items-center gap-2">
                        <TeamOutlined />
                        <Text>{classroom.studentCount} sinh vien</Text>
                      </div>
                      {classroom.description && <Text type="secondary">{classroom.description}</Text>}
                    </Space>

                    <div className="classroom-card__actions">
                      <Link to={`/classrooms/${classroom.id}`}>
                        <Button type="default">Xem chi tiet</Button>
                      </Link>
                      {canManage && <Button onClick={() => openEditModal(classroom)}>Sua</Button>}
                      <Tag color="blue">Ma lop: {classroom.code}</Tag>
                    </div>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      <Modal
        open={modalOpen}
        title={editingClassroom ? "Sua lop hoc" : "Tao lop hoc"}
        onCancel={() => setModalOpen(false)}
        onOk={() => void handleSubmit()}
        confirmLoading={submitting}
        okText={editingClassroom ? "Luu" : "Tao"}
      >
        <Form layout="vertical" form={form}>
          <Form.Item name="name" label="Ten lop" rules={[{ required: true, message: "Nhap ten lop" }]}>
            <Input placeholder="VD: Tieng Anh giao tiep" />
          </Form.Item>
          <Form.Item name="description" label="Mo ta">
            <Input.TextArea rows={4} placeholder="Mo ta ngan cho lop hoc" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={joinModalOpen}
        title="Tham gia lop hoc"
        onCancel={() => setJoinModalOpen(false)}
        onOk={() => void handleJoinByCode()}
        confirmLoading={submitting}
        okText="Tham gia"
      >
        <Form layout="vertical" form={joinForm}>
          <Form.Item
            name="code"
            label="Ma lop"
            rules={[{ required: true, message: "Nhap ma lop" }]}
            extra="Nhap ma lop do giao vien cung cap"
          >
            <Input placeholder="VD: A7K9P2QX" autoComplete="off" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

export default ClassroomsPage;
