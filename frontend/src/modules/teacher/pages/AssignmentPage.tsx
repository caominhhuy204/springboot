import React, { useEffect, useState } from "react";
import { Button, Popconfirm, Space, Table, Tag, Typography } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined, TeamOutlined } from "@ant-design/icons";
import toast from "react-hot-toast";

import {
  addQuestionToAssignment,
  AssignmentDto,
  createAssignment,
  deleteAssignment,
  deleteQuestion,
  getAssignments,
  QuestionDto,
  updateAssignment,
  updateQuestion,
} from "../../../api/assignmentApi";

import AssignmentModal from "../components/AssignmentModal";
import AssignClassModal from "../components/AssignClassModal";
import QuestionModal from "../components/QuestionModal";

const { Title } = Typography;

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "Không đặt hạn";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const AssignmentPage: React.FC = () => {
  const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<AssignmentDto | null>(null);
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionDto | null>(null);
  const [activeAssignmentId, setActiveAssignmentId] = useState<number | null>(null);
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningAssignment, setAssigningAssignment] = useState<AssignmentDto | null>(null);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const data = await getAssignments();
      setAssignments(data);
    } catch {
      toast.error("Lỗi khi tải danh sách bài tập");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAssignments();
  }, []);

  const handleOpenAssignmentModal = (assignment?: AssignmentDto) => {
    setEditingAssignment(assignment || null);
    setIsAssignmentModalOpen(true);
  };

  const handleSaveAssignment = async (values: {
    title: string;
    description: string;
    maxAttempts?: number;
    timeLimitMinutes?: number | null;
    dueAt?: string | null;
  }) => {
    setSavingAssignment(true);
    try {
      if (editingAssignment) {
        await updateAssignment(editingAssignment.id, values);
        toast.success("Cập nhật bài tập thành công");
      } else {
        await createAssignment(values);
        toast.success("Tạo bài tập mới thành công");
      }
      setIsAssignmentModalOpen(false);
      await fetchAssignments();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message ?? "Đã xảy ra lỗi khi lưu bài tập";
      toast.error(errorMessage);
    } finally {
      setSavingAssignment(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: number) => {
    try {
      await deleteAssignment(assignmentId);
      toast.success("Đã ẩn bài tập và giữ nguyên lịch sử làm bài");
      await fetchAssignments();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message ?? "Không thể xóa bài tập này";
      toast.error(errorMessage);
    }
  };

  const handleOpenQuestionModal = (assignmentId: number, question?: QuestionDto) => {
    setActiveAssignmentId(assignmentId);
    setEditingQuestion(question || null);
    setIsQuestionModalOpen(true);
  };

  const handleSaveQuestion = async (values: QuestionDto) => {
    if (!activeAssignmentId) {
      toast.error("Không xác định được bài tập");
      return;
    }

    setSavingQuestion(true);
    try {
      if (editingQuestion?.id) {
        await updateQuestion(activeAssignmentId, editingQuestion.id, values);
        toast.success("Cập nhật câu hỏi thành công");
      } else {
        await addQuestionToAssignment(activeAssignmentId, values);
        toast.success("Thêm câu hỏi mới thành công");
      }
      setIsQuestionModalOpen(false);
      await fetchAssignments();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message ?? "Đã xảy ra lỗi khi lưu câu hỏi";
      toast.error(errorMessage);
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (assignmentId: number, questionId: number) => {
    try {
      await deleteQuestion(assignmentId, questionId);
      toast.success("Xóa câu hỏi thành công");
      await fetchAssignments();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message ?? "Không thể xóa câu hỏi này";
      toast.error(errorMessage);
    }
  };

  const expandedRowRender = (record: AssignmentDto) => {
    const canManage = !!record.canManage;
    const innerColumns = [
      { title: "ID", dataIndex: "id", key: "id", width: 60 },
      { title: "Nội dung câu hỏi", dataIndex: "content", key: "content" },
      {
        title: "Loại",
        dataIndex: "type",
        key: "type",
        render: (type: string) => (
          <Tag color={type === "MULTIPLE_CHOICE" ? "blue" : "green"}>
            {type === "MULTIPLE_CHOICE" ? "Trắc nghiệm" : "Điền từ"}
          </Tag>
        ),
      },
      {
        title: "Điểm câu",
        dataIndex: "points",
        key: "points",
        width: 100,
      },
      {
        title: "Đáp án đúng",
        dataIndex: "correctAnswer",
        key: "correctAnswer",
        render: (answer: string) => <strong>{answer}</strong>,
      },
      {
        title: "Hành động",
        key: "action",
        render: (_: unknown, question: QuestionDto) => (
          <Space size="small">
            <Button
              size="small"
              icon={<EditOutlined />}
              disabled={!canManage}
              onClick={() => handleOpenQuestionModal(record.id, question)}
            >
              Sửa
            </Button>
            <Popconfirm
              title="Bạn có chắc muốn xóa câu hỏi này?"
              onConfirm={() => handleDeleteQuestion(record.id, question.id!)}
              disabled={!canManage}
            >
              <Button size="small" danger icon={<DeleteOutlined />} disabled={!canManage}>
                Xóa
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ];

    return (
      <div className="rounded border border-slate-100 bg-slate-50 p-4">
        <Space className="mb-3">
          <strong>Danh sách câu hỏi:</strong>
          <Button
            size="small"
            type="dashed"
            icon={<PlusOutlined />}
            disabled={!canManage}
            onClick={() => handleOpenQuestionModal(record.id)}
          >
            Thêm câu hỏi
          </Button>
        </Space>
        <Table columns={innerColumns} dataSource={record.questions} pagination={false} rowKey="id" size="small" />
      </div>
    );
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 80 },
    { title: "Tiêu đề", dataIndex: "title", key: "title" },
    {
      title: "Thiết lập",
      key: "settings",
      render: (_: unknown, record: AssignmentDto) => (
        <Space wrap>
          <Tag color="blue">Làm {record.maxAttempts ?? 1} lần</Tag>
          <Tag color="gold">
            {record.timeLimitMinutes ? `${record.timeLimitMinutes} phút` : "Không giới hạn giờ"}
          </Tag>
          <Tag color={record.dueAt ? "magenta" : "default"}>{formatDateTime(record.dueAt)}</Tag>
        </Space>
      ),
    },
    {
      title: "Các lớp đã giao",
      key: "classrooms",
      render: (_: unknown, record: AssignmentDto) =>
        record.classrooms?.length ? (
          <Space wrap>
            {record.classrooms.map((classroom) => (
              <Tag key={classroom.id} color="cyan">
                {classroom.name}
              </Tag>
            ))}
          </Space>
        ) : (
          <span className="text-sm text-gray-400">Chưa giao lớp nào</span>
        ),
    },
    {
      title: "Số câu hỏi",
      key: "questionCount",
      render: (_: unknown, record: AssignmentDto) => <span>{record.questions?.length ?? 0} câu</span>,
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: unknown, record: AssignmentDto) => (
        <Space size="small">
          <Button
            icon={<TeamOutlined />}
            disabled={!record.canManage}
            onClick={() => {
              setAssigningAssignment(record);
              setIsAssignModalOpen(true);
            }}
          >
            Giao bài
          </Button>
          <Button icon={<EditOutlined />} disabled={!record.canManage} onClick={() => handleOpenAssignmentModal(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Ẩn bài tập này? Lịch sử làm bài của sinh viên sẽ vẫn được giữ lại."
            onConfirm={() => handleDeleteAssignment(record.id)}
            disabled={!record.canManage}
          >
            <Button danger icon={<DeleteOutlined />} disabled={!record.canManage}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <Title level={2}>Quản lý bài tập</Title>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => handleOpenAssignmentModal()}>
          Tạo bài tập
        </Button>
      </div>

      <Table
        className="assignment-table overflow-hidden rounded-xl shadow-sm"
        columns={columns}
        rowKey="id"
        dataSource={assignments}
        loading={loading}
        expandable={{ expandedRowRender, expandRowByClick: true }}
      />

      <AssignmentModal
        visible={isAssignmentModalOpen}
        onCancel={() => setIsAssignmentModalOpen(false)}
        onSuccess={handleSaveAssignment}
        initialValues={editingAssignment}
        loading={savingAssignment}
      />

      <QuestionModal
        visible={isQuestionModalOpen}
        onCancel={() => setIsQuestionModalOpen(false)}
        onSuccess={handleSaveQuestion}
        initialValues={editingQuestion}
        loading={savingQuestion}
      />

      <AssignClassModal
        visible={isAssignModalOpen}
        onCancel={() => setIsAssignModalOpen(false)}
        onSuccess={() => {
          setIsAssignModalOpen(false);
          void fetchAssignments();
        }}
        assignment={assigningAssignment}
      />
    </div>
  );
};

export default AssignmentPage;
