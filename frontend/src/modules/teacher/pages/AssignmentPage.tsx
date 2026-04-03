import React, { useEffect, useState } from "react";
import { Table, Button, Space, Popconfirm, Tag, Typography } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined } from "@ant-design/icons";
import toast from "react-hot-toast";

import {
  AssignmentDto,
  QuestionDto,
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  deleteQuestion,
  addQuestionToAssignment,
  updateQuestion,
} from "../../../api/assignmentApi";

import AssignmentModal from "../components/AssignmentModal";
import QuestionModal from "../components/QuestionModal";
import AssignClassModal from "../components/AssignClassModal";

const { Title } = Typography;

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

  const handleSaveAssignment = async (values: { title: string; description: string }) => {
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
    } catch {
      toast.error("Đã xảy ra lỗi khi lưu bài tập");
    } finally {
      setSavingAssignment(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: number) => {
    try {
      await deleteAssignment(assignmentId);
      toast.success("Xóa bài tập thành công");
      await fetchAssignments();
    } catch {
      toast.error("Không thể xóa bài tập này");
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
    } catch {
      toast.error("Đã xảy ra lỗi khi lưu câu hỏi");
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (assignmentId: number, questionId: number) => {
    try {
      await deleteQuestion(assignmentId, questionId);
      toast.success("Xóa câu hỏi thành công");
      await fetchAssignments();
    } catch {
      toast.error("Không thể xóa câu hỏi này");
    }
  };

  const expandedRowRender = (record: AssignmentDto) => {
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
      { title: "Đáp án đúng", dataIndex: "correctAnswer", key: "correctAnswer", render: (answer: string) => <strong>{answer}</strong> },
      {
        title: "Hành động",
        key: "action",
        render: (_: unknown, question: QuestionDto) => (
          <Space size="small">
            <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenQuestionModal(record.id, question)}>
              Sửa
            </Button>
            <Popconfirm title="Bạn có chắc muốn xóa câu hỏi này?" onConfirm={() => handleDeleteQuestion(record.id, question.id!)}>
              <Button size="small" danger icon={<DeleteOutlined />}>
                Xóa
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ];

    return (
      <div className="p-4 bg-slate-50 rounded border border-slate-100">
        <Space className="mb-3">
          <strong>Danh sách câu hỏi:</strong>
          <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={() => handleOpenQuestionModal(record.id)}>
            Thêm câu hỏi
          </Button>
        </Space>
        <Table
          columns={innerColumns}
          dataSource={record.questions}
          pagination={false}
          rowKey="id"
          size="small"
          className="question-table"
        />
      </div>
    );
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 80 },
    { title: "Tiêu đề", dataIndex: "title", key: "title" },
    {
      title: "Các lớp đã giao",
      key: "classrooms",
      render: (_: unknown, record: AssignmentDto) =>
        record.classrooms?.length ? (
          <Space wrap>
            {record.classrooms.map((c) => (
              <Tag key={c.id} color="cyan">{c.name}</Tag>
            ))}
          </Space>
        ) : (
          <span className="text-gray-400 text-sm">Chưa giao lớp nào</span>
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
          <Button icon={<TeamOutlined />} onClick={() => { setAssigningAssignment(record); setIsAssignModalOpen(true); }}>
            Giao bài
          </Button>
          <Button icon={<EditOutlined />} onClick={() => handleOpenAssignmentModal(record)}>
            Sửa
          </Button>
          <Popconfirm title="Xóa bài tập này?" onConfirm={() => handleDeleteAssignment(record.id)}>
            <Button danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Quản lý Bài tập (TV4)</Title>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => handleOpenAssignmentModal()}>
          Tạo bài tập
        </Button>
      </div>

      <Table
        className="assignment-table shadow-sm rounded-xl overflow-hidden"
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
        onSuccess={() => { setIsAssignModalOpen(false); void fetchAssignments(); }}
        assignment={assigningAssignment}
      />
    </div>
  );
};

export default AssignmentPage;
