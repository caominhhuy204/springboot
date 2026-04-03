import { useEffect, useState } from "react";
import { Alert, Button, Card, Col, Empty, Form, Input, InputNumber, Modal, Popconfirm, Row, Select, Skeleton, Space, Statistic, Tag, Typography, message } from "antd";
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
  const [availableClassrooms, setAvailableClassrooms] = useState<Classroom[]>([]);
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
      const [classroomRes, exercisesRes, allClassroomsRes] = await Promise.all([
        api.get<Classroom>(`/api/classrooms/${numericClassroomId}`),
        api.get<PronunciationExercise[]>(`/api/pronunciation/classrooms/${numericClassroomId}/exercises`),
        api.get<Classroom[]>("/api/classrooms"),
      ]);

      setClassroom(classroomRes.data);
      setExercises(exercisesRes.data);
      setAvailableClassrooms(allClassroomsRes.data);
    } catch {
      setError("Không thể tải dữ liệu bài phát âm của lớp học này.");
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
        message.success("Đã cập nhật bài luyện phát âm");
      } else {
        await api.post(`/api/pronunciation/classrooms/${numericClassroomId}/exercises`, values);
        message.success("Đã tạo bài luyện phát âm");
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
      classroomIds: [numericClassroomId],
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
      classroomIds: exercise.classroomIds,
    });
    setModalOpen(true);
  };

  const handleDeleteExercise = async (exerciseId: number) => {
    await api.delete(`/api/pronunciation/exercises/${exerciseId}`);
    message.success("Đã xóa bài phát âm");
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
                Quay lại lớp học
              </Link>
              <span className="pronunciation-hero__eyebrow">
                <SoundOutlined />
                Pronunciation workspace
              </span>
              <Title level={2} className="!mb-0 !text-cyan-50">
                {classroom?.name ?? "Đang tải lớp học"}
              </Title>
              <Paragraph className="!mb-0 !text-cyan-100">
                Tạo bài theo câu mẫu, định hướng kỹ năng cần luyện và để sinh viên ghi âm hoặc upload file để nộp bài.
              </Paragraph>
              <div className="flex flex-wrap gap-2">
                <span className="pronunciation-pill">
                  <TeamOutlined />
                  {classroom?.studentCount ?? 0} sinh viên
                </span>
                <span className="pronunciation-pill">
                  <RiseOutlined />
                  {exercises.length} bài luyện
                </span>
              </div>
            </Space>
          </Col>
          <Col xs={24} xl={9}>
            <Row gutter={[12, 12]}>
              <Col span={12}>
                <Card bordered={false} className="pronunciation-metric">
                  <Statistic title="Bài luyện" value={exercises.length} prefix={<AudioOutlined />} />
                </Card>
              </Col>
              <Col span={12}>
                <Card bordered={false} className="pronunciation-metric">
                  <Statistic title="Bài nộp" value={totalSubmissions} prefix={<TeamOutlined />} />
                </Card>
              </Col>
              <Col span={24}>
                <Card bordered={false} className="pronunciation-metric">
                  <Statistic title="Tổng lượt nộp tối đa" value={totalAttempts} prefix={<RiseOutlined />} />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Text type="secondary">
          {canManage
            ? "Bạn có thể tạo mới, sửa, xóa và giao bài phát âm này cho một hoặc nhiều lớp."
            : "Chọn bài luyện bên dưới để mở khu vực nộp audio và xem lịch sử chấm bài."}
        </Text>
        {canManage && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal} size="large">
            Tạo bài phát âm
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
          <Empty description="Chưa có bài phát âm nào trong lớp này" />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {exercises.map((exercise) => (
            <Col xs={24} lg={12} key={exercise.id}>
              <Card className="pronunciation-exercise-card h-full !rounded-3xl">
                <div className="pronunciation-exercise-card__banner">
                  <Space direction="vertical" size={10} className="w-full">
                    <Space wrap>
                      <Tag color="blue">Độ khó {exercise.difficultyLevel}/5</Tag>
                      <Tag color="gold">Tối đa {exercise.maxAttempts} lần nộp</Tag>
                      <Tag color="green">{exercise.submissionCount} bài nộp</Tag>
                      <Tag color="purple">{exercise.classroomNames.length} lớp được giao</Tag>
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
                        Kỹ năng trọng tâm: {exercise.focusSkill}
                      </span>
                    )}
                    {exercise.classroomNames.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {exercise.classroomNames.map((name) => (
                          <Tag key={`${exercise.id}-${name}`} color={name === classroom?.name ? "cyan" : "default"}>
                            {name}
                          </Tag>
                        ))}
                      </div>
                    )}
                    {exercise.description && <Paragraph className="!mb-0 !text-slate-600">{exercise.description}</Paragraph>}
                    <Space wrap>
                      <Link to={`/classrooms/${numericClassroomId}/pronunciation/${exercise.id}`}>
                        <Button icon={<AudioOutlined />} type="primary">
                          Mở bài luyện
                        </Button>
                      </Link>
                      {canManage && (
                        <Button icon={<EditOutlined />} onClick={() => openEditModal(exercise)}>
                          Sua
                        </Button>
                      )}
                      {canManage && (
                        <Popconfirm
                          title="Xóa bài phát âm"
                          description="Bạn chắc chắn muốn xóa bài này?"
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
        title={editingExercise ? "Sửa bài phát âm" : "Tạo bài phát âm"}
        onCancel={() => {
          setModalOpen(false);
          setEditingExercise(null);
        }}
        onOk={() => void handleCreateExercise()}
        confirmLoading={submitting}
        okText={editingExercise ? "Lưu thay đổi" : "Tạo bài"}
      >
        <Form layout="vertical" form={form} initialValues={{ difficultyLevel: 1, maxAttempts: 3 }}>
          <Form.Item
            name="classroomIds"
            label="Giao cho lớp"
            rules={[{ required: true, message: "Chọn ít nhất một lớp học" }]}
          >
            <Select
              mode="multiple"
              options={availableClassrooms.map((item) => ({ label: item.name, value: item.id }))}
              placeholder="Chọn một hoặc nhiều lớp"
            />
          </Form.Item>
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: "Nhập tiêu đề" }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="referenceText"
            label="Câu mẫu"
            rules={[{ required: true, message: "Nhập câu mẫu cho bài phát âm" }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="focusSkill" label="Kỹ năng trọng tâm">
            <Input placeholder="VD: ending sounds, stress, /s/ va /sh/" />
          </Form.Item>
          <Form.Item name="description" label="Hướng dẫn">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="difficultyLevel" label="Độ khó">
                <InputNumber min={1} max={5} className="w-full" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="maxAttempts" label="Số lần nộp tối đa">
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
