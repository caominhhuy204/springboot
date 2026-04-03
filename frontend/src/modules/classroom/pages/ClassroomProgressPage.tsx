import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Table, Typography, Button, Modal, Input, message, Space, Tag, Card, Avatar } from "antd";
import { UserOutlined, EditOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import api from "@/utils/axiosClient";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface StudentProgress {
  studentId: number;
  studentName: string;
  studentEmail: string;
  totalRegularSubmissions: number;
  totalPronunciationSubmissions: number;
  averageScore: number;
  recentFeedback: string[];
}

const ClassroomProgressPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentProgress | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    void fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/exams/classrooms/${id}/progress`);
      setData(res.data);
    } catch (error) {
      console.error("Error fetching classroom progress:", error);
      message.error("Không thể tải dữ liệu tiến độ");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFeedback = (student: StudentProgress) => {
    setSelectedStudent(student);
    setFeedbackText("");
    setFeedbackModalVisible(true);
  };

  const handleSendFeedback = async () => {
    if (!selectedStudent || !feedbackText.trim()) return;

    setSubmittingFeedback(true);
    try {
      const historyRes = await api.get(`/api/exams/history?email=${selectedStudent.studentEmail}`);
      const latestSubmission = historyRes.data[0];

      if (latestSubmission) {
        await api.post(`/api/exams/submissions/${latestSubmission.submissionId}/feedback`, {
          feedback: feedbackText,
        });
        message.success("Đã gửi nhận xét cho sinh viên");
        setFeedbackModalVisible(false);
        void fetchData();
      } else {
        message.warning("Sinh viên này chưa nộp bài nào để nhận xét");
      }
    } catch (error) {
      console.error("Error sending feedback:", error);
      message.error("Lỗi khi gửi nhận xét");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const columns = [
    {
      title: "Sinh viên",
      key: "student",
      render: (_: any, record: StudentProgress) => (
        <Space>
          <Avatar icon={<UserOutlined />} className="portal-avatar" />
          <div>
            <Text strong className="block">{record.studentName}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.studentEmail}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Bài tập",
      dataIndex: "totalRegularSubmissions",
      key: "regular",
      width: 110,
      render: (val: number) => <Tag color="blue">{val} bài</Tag>,
    },
    {
      title: "Phát âm",
      dataIndex: "totalPronunciationSubmissions",
      key: "pronunciation",
      width: 110,
      render: (val: number) => <Tag color="purple">{val} bài</Tag>,
    },
    {
      title: "Điểm TB",
      dataIndex: "averageScore",
      key: "score",
      width: 110,
      render: (score: number) => {
        const color = score >= 8 ? "green" : score >= 5 ? "orange" : "red";
        return (
          <Tag color={color} className="!font-bold !px-3 !py-1 !rounded-lg !min-w-[60px] !text-center">
            {score.toFixed(1)}
          </Tag>
        );
      },
    },
    {
      title: "Hành động",
      key: "action",
      width: 140,
      render: (_: any, record: StudentProgress) => (
        <Button
          type="primary"
          ghost
          icon={<EditOutlined />}
          onClick={() => handleOpenFeedback(record)}
          size="small"
        >
          Viết nhận xét
        </Button>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} className="w-full">
      {/* ── Header ── */}
      <Card className="dashboard-surface">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <Space direction="vertical" size={0}>
            <Link
              to={`/classrooms/${id}`}
              className="flex items-center text-sky-600 hover:text-sky-700 font-medium"
            >
              <ArrowLeftOutlined className="mr-1" /> Quay lại lớp học
            </Link>
            <Title level={3} className="!mb-0 !mt-1 !text-slate-800">
              Báo cáo tiến độ lớp học
            </Title>
          </Space>
          <Button onClick={() => void fetchData()} loading={loading}>
            Cập nhật dữ liệu
          </Button>
        </div>
      </Card>

      {/* ── Table ── */}
      <Card title="Danh sách sinh viên" className="dashboard-surface">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="studentId"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          size="middle"
        />
      </Card>

      {/* ── Feedback modal ── */}
      <Modal
        title={`Gửi nhận xét cho ${selectedStudent?.studentName}`}
        open={feedbackModalVisible}
        onOk={handleSendFeedback}
        onCancel={() => setFeedbackModalVisible(false)}
        confirmLoading={submittingFeedback}
        okText="Gửi nhận xét"
        cancelText="Hủy"
        destroyOnClose
      >
        <div className="py-4">
          <Text className="block mb-2">
            Viết lời khuyên hoặc nhận xét về quá trình học của sinh viên:
          </Text>
          <TextArea
            rows={4}
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Ví d: Em cần chú ý hơn vào phần phát âm..."
          />
        </div>
      </Modal>
    </Space>
  );
};

export default ClassroomProgressPage;
