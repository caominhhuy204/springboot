import { useEffect, useState } from "react";
import { Alert, Button, Card, Col, Empty, Form, Input, InputNumber, Modal, Popconfirm, Row, Skeleton, Space, Statistic, Tag, Typography, message } from "antd";
import { AudioOutlined, DeleteOutlined, EditOutlined, PlusOutlined, RiseOutlined, SoundOutlined, TeamOutlined } from "@ant-design/icons";
import { Link, useParams } from "react-router-dom";
import api from "@/utils/axiosClient";
import { useUser } from "@/context/authContext";
import type { Classroom } from "@/types/classroom";
import type { PronunciationExercise, PronunciationExercisePayload } from "@/types/pronunciation";

const { Title, Paragraph, Text } = Typography;

function PronunciationExercisesPage() {
  const { classroomId } = useParams();
  const { user } = useUser();
  const canManage = user?.role === "ADMIN" || user?.role === "TEACHER";
  const numericClassroomId = Number(classroomId);

  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [exercises, setExercises] = useState<PronunciationExercise[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingExercise, setEditingExercise] = useState<PronunciationExercise | null>(null);
  const [form] = Form.useForm<PronunciationExercisePayload>();

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [classroomRes, exercisesRes] = await Promise.all([
        api.get<Classroom>(`/api/classrooms/${numericClassroomId}`),
        api.get<PronunciationExercise[]>(`/api/pronunciation/classrooms/${numericClassroomId}/exercises`),
      ]);

      setClassroom(classroomRes.data);
      setExercises(exercisesRes.data);
    } catch {
      setError("Khong the tai du lieu bai phat am cua lop hoc nay.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!Number.isFinite(numericClassroomId)) {
      return;
    }

    void loadData();
  }, [numericClassroomId]);

  const handleCreateExercise = async () => {
    const values = await form.validateFields();
    setSubmitting(true);

    try {
      if (editingExercise) {
        await api.put(`/api/pronunciation/exercises/${editingExercise.id}`, values);
        message.success("Da cap nhat bai luyen phat am");
      } else {
        await api.post(`/api/pronunciation/classrooms/${numericClassroomId}/exercises`, values);
        message.success("Da tao bai luyen phat am");
      }
      setModalOpen(false);
      setEditingExercise(null);
      form.resetFields();
      await loadData();
    } finally {
      setSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setEditingExercise(null);
    form.setFieldsValue({
      title: "",
      referenceText: "",
      description: "",
      focusSkill: "",
      difficultyLevel: 1,
      maxAttempts: 3,
    });
    setModalOpen(true);
  };

  const openEditModal = (exercise: PronunciationExercise) => {
    setEditingExercise(exercise);
    form.setFieldsValue({
      title: exercise.title,
      referenceText: exercise.referenceText,
      description: exercise.description ?? "",
      focusSkill: exercise.focusSkill ?? "",
      difficultyLevel: exercise.difficultyLevel,
      maxAttempts: exercise.maxAttempts,
    });
    setModalOpen(true);
  };

  const handleDeleteExercise = async (exerciseId: number) => {
    await api.delete(`/api/pronunciation/exercises/${exerciseId}`);
    message.success("Da xoa bai phat am");
    await loadData();
  };

  const totalAttempts = exercises.reduce((sum, exercise) => sum + exercise.maxAttempts, 0);
  const totalSubmissions = exercises.reduce((sum, exercise) => sum + exercise.submissionCount, 0);

  return (
    <Space direction="vertical" size={16} className="w-full">
      <Card className="pronunciation-hero !rounded-3xl !border-0">
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} xl={15}>
            <Space direction="vertical" size={12} className="w-full">
              <Link to={`/classrooms/${numericClassroomId}`} className="!text-cyan-100">
                Quay lai lop hoc
              </Link>
              <span className="pronunciation-hero__eyebrow">
                <SoundOutlined />
                Pronunciation workspace
              </span>
              <Title level={2} className="!mb-0 !text-cyan-50">
                {classroom?.name ?? "Dang tai lop hoc"}
              </Title>
              <Paragraph className="!mb-0 !text-cyan-100">
                Tao bai theo cau mau, dinh huong ky nang can luyen va de sinh vien ghi am hoac upload file de nop bai.
              </Paragraph>
              <div className="flex flex-wrap gap-2">
                <span className="pronunciation-pill">
                  <TeamOutlined />
                  {classroom?.studentCount ?? 0} sinh vien
                </span>
                <span className="pronunciation-pill">
                  <RiseOutlined />
                  {exercises.length} bai luyen
                </span>
              </div>
            </Space>
          </Col>
          <Col xs={24} xl={9}>
            <Row gutter={[12, 12]}>
              <Col span={12}>
                <Card bordered={false} className="pronunciation-metric">
                  <Statistic title="Bai luyen" value={exercises.length} prefix={<AudioOutlined />} />
                </Card>
              </Col>
              <Col span={12}>
                <Card bordered={false} className="pronunciation-metric">
                  <Statistic title="Bai nop" value={totalSubmissions} prefix={<TeamOutlined />} />
                </Card>
              </Col>
              <Col span={24}>
                <Card bordered={false} className="pronunciation-metric">
                  <Statistic title="Tong luot nop toi da" value={totalAttempts} prefix={<RiseOutlined />} />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Text type="secondary">
          {canManage
            ? "Ban co the tao moi, sua va xoa bai luyen phat am trong lop nay."
            : "Chon bai luyen ben duoi de mo khu vuc nop audio va xem lich su cham bai."}
        </Text>
        {canManage && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal} size="large">
            Tao bai phat am
          </Button>
        )}
      </div>

      {error && <Alert type="error" showIcon message={error} />}

      {loading ? (
        <Card className="pronunciation-panel !rounded-2xl">
          <Skeleton active paragraph={{ rows: 5 }} />
        </Card>
      ) : exercises.length === 0 ? (
        <Card className="pronunciation-panel !rounded-2xl">
          <Empty description="Chua co bai phat am nao trong lop nay" />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {exercises.map((exercise) => (
            <Col xs={24} lg={12} key={exercise.id}>
              <Card className="pronunciation-exercise-card h-full !rounded-3xl">
                <div className="pronunciation-exercise-card__banner">
                  <Space direction="vertical" size={10} className="w-full">
                    <Space wrap>
                      <Tag color="blue">Do kho {exercise.difficultyLevel}/5</Tag>
                      <Tag color="gold">Toi da {exercise.maxAttempts} lan nop</Tag>
                      <Tag color="green">{exercise.submissionCount} bai nop</Tag>
                    </Space>
                    <Title level={4} className="!mb-0 !text-slate-50">
                      {exercise.title}
                    </Title>
                    <Text className="!text-cyan-50">{exercise.referenceText}</Text>
                  </Space>
                </div>
                <div className="pronunciation-exercise-card__body">
                  <Space direction="vertical" size={12} className="w-full">
                    {exercise.focusSkill && (
                      <span className="pronunciation-pill">
                        <SoundOutlined />
                        Ky nang trong tam: {exercise.focusSkill}
                      </span>
                    )}
                    {exercise.description && <Paragraph className="!mb-0 !text-slate-600">{exercise.description}</Paragraph>}
                    <Space wrap>
                      <Link to={`/classrooms/${numericClassroomId}/pronunciation/${exercise.id}`}>
                        <Button icon={<AudioOutlined />} type="primary">
                          Mo bai luyen
                        </Button>
                      </Link>
                      {canManage && (
                        <Button icon={<EditOutlined />} onClick={() => openEditModal(exercise)}>
                          Sua
                        </Button>
                      )}
                      {canManage && (
                        <Popconfirm
                          title="Xoa bai phat am"
                          description="Ban chac chan muon xoa bai nay?"
                          okText="Xoa"
                          cancelText="Huy"
                          onConfirm={() => void handleDeleteExercise(exercise.id)}
                        >
                          <Button danger icon={<DeleteOutlined />}>
                            Xoa
                          </Button>
                        </Popconfirm>
                      )}
                    </Space>
                  </Space>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        open={modalOpen}
        title={editingExercise ? "Sua bai phat am" : "Tao bai phat am"}
        onCancel={() => {
          setModalOpen(false);
          setEditingExercise(null);
        }}
        onOk={() => void handleCreateExercise()}
        confirmLoading={submitting}
        okText={editingExercise ? "Luu thay doi" : "Tao bai"}
      >
        <Form layout="vertical" form={form} initialValues={{ difficultyLevel: 1, maxAttempts: 3 }}>
          <Form.Item name="title" label="Tieu de" rules={[{ required: true, message: "Nhap tieu de" }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="referenceText"
            label="Cau mau"
            rules={[{ required: true, message: "Nhap cau mau cho bai phat am" }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="focusSkill" label="Ky nang trong tam">
            <Input placeholder="VD: ending sounds, stress, /s/ va /sh/" />
          </Form.Item>
          <Form.Item name="description" label="Huong dan">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="difficultyLevel" label="Do kho">
                <InputNumber min={1} max={5} className="w-full" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="maxAttempts" label="So lan nop toi da">
                <InputNumber min={1} max={10} className="w-full" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Space>
  );
}

export default PronunciationExercisesPage;
