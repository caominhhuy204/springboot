import React, { useEffect, useState } from "react";
import { BarChartOutlined, ClockCircleOutlined, EyeOutlined, FileTextOutlined } from "@ant-design/icons";
import { Button, Card, Col, Row, Space, Spin, Statistic, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useNavigate } from "react-router-dom";
import { examApi, HistoryResponse } from "@/api/exam";

const { Text, Title } = Typography;

function getScoreColor(score: number) {
  if (score > 8) return "green";
  if (score >= 6) return "gold";
  return "red";
}

function getScoreLabel(score: number) {
  if (score > 8) return "Giỏi";
  if (score >= 6) return "Khá";
  return "Yếu";
}

function formatSubmitTime(time: string) {
  return new Date(time).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ExamHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<HistoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await examApi.getHistory();
        setHistory(data ?? []);
      } finally {
        setLoading(false);
      }
    };

    void fetchHistory();
  }, []);

  const totalExams = history.length;
  const avgScore =
    totalExams > 0
      ? (history.reduce((sum, item) => sum + (item.totalScore ?? 0), 0) / totalExams).toFixed(1)
      : "0";
  const passedCount = history.filter((item) => (item.totalScore ?? 0) >= 5).length;

  const columns: ColumnsType<HistoryResponse> = [
    {
      title: "Bài thi",
      dataIndex: "examTitle",
      key: "examTitle",
      render: (text) => (
        <Space size={8}>
          <FileTextOutlined className="text-sky-500" />
          <Text strong className="text-slate-700">
            {text || "Bài thi"}
          </Text>
        </Space>
      ),
    },
    {
      title: "Điểm số",
      dataIndex: "totalScore",
      key: "totalScore",
      width: 180,
      render: (score: number) => {
        const normalizedScore = score ?? 0;
        return (
          <Space size={8}>
            <Tag
              color={getScoreColor(normalizedScore)}
              className="!min-w-[70px] !rounded-lg !px-3 !py-1 !text-center !text-sm !font-bold"
            >
              {normalizedScore} điểm
            </Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {getScoreLabel(normalizedScore)}
            </Text>
          </Space>
        );
      },
    },
    {
      title: "Thời gian nộp",
      dataIndex: "submitTime",
      key: "submitTime",
      width: 190,
      render: (time: string) => (
        <Space size={4} className="text-slate-500">
          <ClockCircleOutlined />
          <Text type="secondary" style={{ fontSize: 13 }}>
            {formatSubmitTime(time)}
          </Text>
        </Space>
      ),
    },
    {
      title: "Xem chi tiết",
      key: "action",
      width: 120,
      align: "center",
      render: (_: unknown, record: HistoryResponse) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/exams/${record.examId}`)}
          className="!p-0"
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Space direction="vertical" size={16} className="w-full">
      <Card className="dashboard-surface">
        <Space direction="vertical" size={2}>
          <Title level={3} className="!mb-0 !text-slate-800">
            Lịch sử làm bài
          </Title>
          <Text type="secondary">Theo dõi toàn bộ bài thi đã nộp và kết quả của bạn</Text>
        </Space>
      </Card>

      {totalExams > 0 && (
        <Row gutter={[14, 14]}>
          <Col xs={24} sm={8}>
            <Card className="dashboard-stat-card">
              <div className="dashboard-stat-stripe blue" />
              <Statistic title="Tổng bài thi" value={totalExams} prefix={<FileTextOutlined className="text-blue-500" />} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="dashboard-stat-card">
              <div className="dashboard-stat-stripe score" />
              <Statistic title="Điểm trung bình" value={Number(avgScore)} precision={1} suffix="/ 10" />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="dashboard-stat-card">
              <div className="dashboard-stat-stripe done" />
              <Statistic title="Bài đạt (≥ 5 điểm)" value={passedCount} suffix={`/ ${totalExams}`} />
            </Card>
          </Col>
        </Row>
      )}

      <Card
        title={
          <Space size={8}>
            <BarChartOutlined className="text-sky-500" />
            <span>Danh sách bài đã nộp</span>
            <Tag color="blue">{totalExams}</Tag>
          </Space>
        }
        className="dashboard-surface"
      >
        <Table
          dataSource={history}
          columns={columns}
          rowKey="submissionId"
          pagination={{ pageSize: 8, showSizeChanger: false }}
          size="middle"
          locale={{
            emptyText: (
              <Space direction="vertical" className="py-8">
                <FileTextOutlined className="text-4xl text-slate-300" />
                <Text type="secondary">Bạn chưa làm bài thi nào</Text>
              </Space>
            ),
          }}
        />
      </Card>

      <style>{`
        .dashboard-stat-stripe.blue { background: linear-gradient(90deg, #3b82f6, #1d4ed8); }
        .dashboard-stat-stripe.score { background: linear-gradient(90deg, #0ea5e9, #0284c7); }
        .dashboard-stat-stripe.done { background: linear-gradient(90deg, #10b981, #059669); }
      `}</style>
    </Space>
  );
};

export default ExamHistoryPage;
