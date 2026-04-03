import React, { useEffect, useState, useMemo } from "react";
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  FileTextOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import {
  Card,
  Space,
  Table,
  Tag,
  Typography,
  Statistic,
  Row,
  Col,
  Spin,
  Segmented,
  Button,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { examApi, HistoryResponse } from "@/api/exam";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

type FilterStatus = "ALL" | "PENDING" | "REVIEWED";

function getScoreColor(score: number) {
  if (score >= 8) return "emerald";
  if (score >= 5) return "blue";
  return "red";
}

function getScoreLabel(score: number) {
  if (score >= 8) return "Xuất sắc";
  if (score >= 7) return "Tốt";
  if (score >= 5) return "Đạt";
  return "Chưa đạt";
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
  const [filter, setFilter] = useState<FilterStatus>("ALL");
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

  // Stats summary
  const totalExams = history.length;
  const avgScore =
    totalExams > 0
      ? (history.reduce((sum, h) => sum + h.totalScore, 0) / totalExams).toFixed(1)
      : "0";
  const passedCount = history.filter((h) => h.totalScore >= 5).length;

  // Filtered data
  const pendingCount = history.filter((h) => !h.teacherFeedback).length;
  const reviewedCount = history.filter((h) => !!h.teacherFeedback).length;

  const filteredHistory = useMemo(() => {
    if (filter === "PENDING") return history.filter((h) => !h.teacherFeedback);
    if (filter === "REVIEWED") return history.filter((h) => !!h.teacherFeedback);
    return history;
  }, [history, filter]);

  const columns: ColumnsType<HistoryResponse> = [
    {
      title: "Bài thi",
      dataIndex: "examTitle",
      key: "examTitle",
      render: (text) => (
        <Space size={8}>
          <FileTextOutlined className="text-sky-500" />
          <Text strong className="text-slate-700">{text || "Bài thi mẫu"}</Text>
        </Space>
      ),
    },
    {
      title: "Điểm số",
      dataIndex: "totalScore",
      key: "totalScore",
      width: 160,
      render: (score: number) => {
        const color = getScoreColor(score);
        const label = getScoreLabel(score);
        return (
          <Space size={8}>
            <Tag
              color={color}
              className="!font-bold !text-sm !px-3 !py-1 !rounded-lg !min-w-[60px] !text-center"
            >
              {score} điểm
            </Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {label}
            </Text>
          </Space>
        );
      },
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 140,
      align: "center" as const,
      render: (_: unknown, record: HistoryResponse) => {
        const isReviewed = !!record.teacherFeedback;
        return (
          <Tag
            color={isReviewed ? "green" : "orange"}
            className="!text-sm !px-3 !py-1 !rounded-lg"
          >
            {isReviewed ? (
              <Space size={4}>
                <CheckCircleOutlined />
                Đã chấm
              </Space>
            ) : (
              <Space size={4}>
                <ClockCircleOutlined />
                Chờ chấm
              </Space>
            )}
          </Tag>
        );
      },
    },
    {
      title: "Phản hồi",
      dataIndex: "teacherFeedback",
      key: "teacherFeedback",
      render: (feedback: string | null) =>
        feedback ? (
          <Text type="secondary" className="italic text-sm">
            {feedback}
          </Text>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: "Thời gian nộp",
      dataIndex: "submitTime",
      key: "submitTime",
      width: 180,
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
      align: "center" as const,
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

  // Row color based on status
  const getRowClassName = (record: HistoryResponse, _index: number): string => {
    const isReviewed = !!record.teacherFeedback;
    return isReviewed ? "exam-history-row-reviewed" : "exam-history-row-pending";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Space direction="vertical" size={16} className="w-full">
      {/* ── Header card ── */}
      <Card className="dashboard-surface">
        <Space direction="vertical" size={2}>
          <Title level={3} className="!mb-0 !text-slate-800">
            Lịch sử làm bài
          </Title>
          <Text type="secondary">
            Theo dõi toàn bộ bài thi đã nộp và kết quả của bạn
          </Text>
        </Space>
      </Card>

      {/* ── Stats summary ── */}
      {totalExams > 0 && (
        <Row gutter={[14, 14]}>
          <Col xs={24} sm={8}>
            <Card className="dashboard-stat-card">
              <div className="dashboard-stat-stripe blue" />
              <Space align="start" className="w-full justify-between">
                <Statistic
                  title="Tổng bài thi"
                  value={totalExams}
                  prefix={<FileTextOutlined className="text-blue-500" />}
                />
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="dashboard-stat-card">
              <div className="dashboard-stat-stripe score" />
              <Space align="start" className="w-full justify-between">
                <Statistic
                  title="Điểm trung bình"
                  value={Number(avgScore)}
                  precision={1}
                  suffix="/ 10"
                />
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="dashboard-stat-card">
              <div className="dashboard-stat-stripe done" />
              <Space align="start" className="w-full justify-between">
                <Statistic
                  title="Bài đạt (≥ 5 điểm)"
                  value={passedCount}
                  suffix={`/ ${totalExams}`}
                />
              </Space>
            </Card>
          </Col>
        </Row>
      )}

      {/* ── Filter + Table ── */}
      <Card
        title={
          <Space size={8}>
            <BarChartOutlined className="text-sky-500" />
            <span>Danh sách bài đã nộp</span>
            <Tag color="blue">{totalExams}</Tag>
          </Space>
        }
        extra={
          <Segmented
            value={filter}
            onChange={(val) => setFilter(val as FilterStatus)}
            options={[
              { label: `Tất cả (${totalExams})`, value: "ALL" },
              { label: `Chờ chấm (${pendingCount})`, value: "PENDING" },
              { label: `Đã chấm (${reviewedCount})`, value: "REVIEWED" },
            ]}
          />
        }
        className="dashboard-surface"
      >
        <Table
          dataSource={filteredHistory}
          columns={columns}
          rowKey="submissionId"
          pagination={{ pageSize: 8, showSizeChanger: false }}
          size="middle"
          rowClassName={getRowClassName}
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

        .exam-history-row-reviewed > td {
          background: #f0fdf4 !important;
        }
        .exam-history-row-pending > td {
          background: #fffbeb !important;
        }
        .exam-history-row-reviewed:hover > td,
        .exam-history-row-pending:hover > td {
          background: #f8fafc !important;
        }
      `}</style>
    </Space>
  );
};

export default ExamHistoryPage;
