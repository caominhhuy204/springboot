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
      toast.error("Loi khi tai danh sach bai tap");
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
        toast.success("Cap nhat bai tap thanh cong");
      } else {
        await createAssignment(values);
        toast.success("Tao bai tap moi thanh cong");
      }

      setIsAssignmentModalOpen(false);
      await fetchAssignments();
    } catch {
      toast.error("Da xay ra loi");
    } finally {
      setSavingAssignment(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: number) => {
    try {
      await deleteAssignment(assignmentId);
      toast.success("Xoa bai tap thanh cong");
      await fetchAssignments();
    } catch {
      toast.error("Khong the xoa bai tap");
    }
  };

  const handleOpenQuestionModal = (assignmentId: number, question?: QuestionDto) => {
    setActiveAssignmentId(assignmentId);
    setEditingQuestion(question || null);
    setIsQuestionModalOpen(true);
  };

  const handleSaveQuestion = async (values: QuestionDto) => {
    if (!activeAssignmentId) {
      toast.error("Khong xac dinh duoc bai tap");
      return;
    }

    setSavingQuestion(true);
    try {
      if (editingQuestion?.id) {
        await updateQuestion(activeAssignmentId, editingQuestion.id, values);
        toast.success("Cap nhat cau hoi thanh cong");
      } else {
        await addQuestionToAssignment(activeAssignmentId, values);
        toast.success("Them cau hoi moi thanh cong");
      }

      setIsQuestionModalOpen(false);
      await fetchAssignments();
    } catch {
      toast.error("Da xay ra loi");
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (assignmentId: number, questionId: number) => {
    try {
      await deleteQuestion(assignmentId, questionId);
      toast.success("Xoa cau hoi thanh cong");
      await fetchAssignments();
    } catch {
      toast.error("Khong the xoa cau hoi");
    }
  };

  const expandedRowRender = (record: AssignmentDto) => {
    const columns = [
      {
        title: "ID",
        dataIndex: "id",
        key: "id",
        width: 60,
      },
      {
        title: "Noi dung cau hoi",
        dataIndex: "content",
        key: "content",
      },
      {
        title: "Loai",
        dataIndex: "type",
        key: "type",
        render: (type: string) => (
          <Tag color={type === "MULTIPLE_CHOICE" ? "blue" : "green"}>
            {type === "MULTIPLE_CHOICE" ? "Trac nghiem" : "Dien tu"}
          </Tag>
        ),
      },
      {
        title: "Dap an dung",
        dataIndex: "correctAnswer",
        key: "correctAnswer",
        render: (answer: string) => <strong>{answer}</strong>,
      },
      {
        title: "Hanh dong",
        key: "action",
        render: (_: unknown, question: QuestionDto) => (
          <Space size="middle">
            <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenQuestionModal(record.id, question)}>
              Sua
            </Button>
            <Popconfirm title="Ban co chac chan?" onConfirm={() => handleDeleteQuestion(record.id, question.id!)}>
              <Button size="small" danger icon={<DeleteOutlined />}>
                Xoa
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ];

    return (
      <div className="p-4 bg-gray-50 rounded shadow-inner">
        <Space className="mb-3">
          <strong>Danh sach cau hoi:</strong>
          <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={() => handleOpenQuestionModal(record.id)}>
            Them cau hoi
          </Button>
        </Space>
        <Table columns={columns} dataSource={record.questions} pagination={false} rowKey="id" size="small" bordered />
      </div>
    );
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "Tieu de",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Cac lop da giao",
      key: "classrooms",
      render: (_: unknown, record: AssignmentDto) => (
        <>
          {record.classrooms?.length ? (
            record.classrooms.map((classroom) => (
              <Tag key={classroom.id} color="cyan">
                {classroom.name}
              </Tag>
            ))
          ) : (
            <span className="text-gray-400 text-sm">Chua giao lop nao</span>
          )}
        </>
      ),
    },
    {
      title: "So cau hoi",
      key: "questionCount",
      render: (_: unknown, record: AssignmentDto) => <span>{record.questions?.length || 0} cau</span>,
    },
    {
      title: "Hanh dong",
      key: "action",
      render: (_: unknown, record: AssignmentDto) => (
        <Space size="middle">
          <Button
            icon={<TeamOutlined />}
            onClick={() => {
              setAssigningAssignment(record);
              setIsAssignModalOpen(true);
            }}
          >
            Giao bai
          </Button>
          <Button icon={<EditOutlined />} onClick={() => handleOpenAssignmentModal(record)}>
            Sua
          </Button>
          <Popconfirm title="Xoa bai tap nay?" onConfirm={() => handleDeleteAssignment(record.id)}>
            <Button danger icon={<DeleteOutlined />}>
              Xoa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Quan ly Bai tap (TV4)</Title>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => handleOpenAssignmentModal()}>
          Tao Bai tap
        </Button>
      </div>

      <Table
        className="shadow-sm border rounded"
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
