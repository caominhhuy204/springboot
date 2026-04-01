import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Table, Typography, Button, Modal, Input, message, Space, Tag, Card, Avatar } from "antd";
import { UserOutlined, EditOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import axios from "@/utils/axiosClient";

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
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/exams/classrooms/${id}/progress`);
      setData(res.data);
    } catch (error) {
      console.error("Error fetching classroom progress:", error);
      message.error("Khong the tai du lieu tien do");
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
      // For now, we apply feedback to the most recent submission if exists, 
      // or we could have a more complex feedback system.
      // In ExamController, we have /api/exams/submissions/{id}/feedback.
      // But here we might want to send it to the student generally.
      // Let's assume we have a "General Feedback" or we find the last submission.
      
      // Let's call the history to find the latest submission ID for this student
      const historyRes = await axios.get(`/api/exams/history?email=${selectedStudent.studentEmail}`);
      const latestSubmission = historyRes.data[0];

      if (latestSubmission) {
        await axios.post(`/api/exams/submissions/${latestSubmission.submissionId}/feedback`, {
          feedback: feedbackText
        });
        message.success("Da gui nhan xet cho sinh vien");
        setFeedbackModalVisible(false);
        fetchData();
      } else {
        message.warning("Sinh vien nay chua nop bai nao de nhan xet");
      }
    } catch (error) {
      console.error("Error sending feedback:", error);
      message.error("Loy khi gui nhan xet");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const columns = [
    {
      title: "Sinh vien",
      key: "student",
      render: (_: any, record: StudentProgress) => (
        <Space>
          <Avatar icon={<UserOutlined />} className="bg-blue-500" />
          <div>
            <Text strong className="block">{record.studentName}</Text>
            <Text type="secondary">{record.studentEmail}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Bai tap",
      dataIndex: "totalRegularSubmissions",
      key: "regular",
      sorter: (a: any, b: any) => a.totalRegularSubmissions - b.totalRegularSubmissions,
    },
    {
      title: "Phat am",
      dataIndex: "totalPronunciationSubmissions",
      key: "pronunciation",
      sorter: (a: any, b: any) => a.totalPronunciationSubmissions - b.totalPronunciationSubmissions,
    },
    {
      title: "Diem trung binh",
      dataIndex: "averageScore",
      key: "score",
      render: (score: number) => (
        <Tag color={score >= 8 ? "green" : score >= 5 ? "orange" : "red"} className="font-semibold px-3 py-1">
          {score.toFixed(2)}
        </Tag>
      ),
      sorter: (a: any, b: any) => a.averageScore - b.averageScore,
    },
    {
      title: "Hanh dong",
      key: "action",
      render: (_: any, record: StudentProgress) => (
        <Button 
          type="primary" 
          ghost 
          icon={<EditOutlined />} 
          onClick={() => handleOpenFeedback(record)}
        >
          Viet nhan xet
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <Space direction="vertical" size={0}>
          <Link to={`/classrooms/${id}`} className="flex items-center text-slate-500 hover:text-blue-600 mb-2">
            <ArrowLeftOutlined className="mr-1" /> Quay lai lop hoc
          </Link>
          <Title level={2} className="!m-0">Bao cao tien do lop hoc</Title>
        </Space>
        <Button onClick={fetchData} loading={loading}>Cap nhat du lieu</Button>
      </div>

      <Card className="shadow-sm">
        <Table 
          columns={columns} 
          dataSource={data} 
          rowKey="studentId" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={`Gui nhan xet cho ${selectedStudent?.studentName}`}
        open={feedbackModalVisible}
        onOk={handleSendFeedback}
        onCancel={() => setFeedbackModalVisible(false)}
        confirmLoading={submittingFeedback}
        okText="Gui nhan xet"
        cancelText="Huy"
      >
        <div className="py-4">
          <Text className="block mb-2">Viet loi khuyen hoac nhan xet ve qua trinh hoc cua sinh vien:</Text>
          <TextArea 
            rows={4} 
            value={feedbackText} 
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Vi du: Em can chu y hon vao phan phat am duoi..."
          />
        </div>
      </Modal>
    </div>
  );
};

export default ClassroomProgressPage;
