import React, { useEffect, useState } from "react";
import { examApi, HistoryResponse } from "@/api/exam";
import { Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";

const { Title } = Typography;

const ExamHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<HistoryResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const data = await examApi.getHistory();
      if (data) {
        setHistory(data);
      }
      setLoading(false);
    };
    fetchHistory();
  }, []);

  const columns: ColumnsType<HistoryResponse> = [
    {
      title: "Mã Lần Nộp",
      dataIndex: "submissionId",
      key: "submissionId",
    },
    {
      title: "Tên Đề Thi",
      dataIndex: "examTitle",
      key: "examTitle",
      render: (text) => <strong className="text-blue-600">{text || 'Bài thi mẫu'}</strong>,
    },
    {
      title: "Điểm Số Đạt Được",
      dataIndex: "totalScore",
      key: "totalScore",
      render: (score) => (
        <Tag color={score >= 5 ? "green" : "red"} className="text-base px-3 py-1">
          {score} Điểm
        </Tag>
      ),
    },
    {
      title: "Thời Gian Nộp Bài",
      dataIndex: "submitTime",
      key: "submitTime",
      render: (text) => new Date(text).toLocaleString("vi-VN"),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 bg-white shadow rounded-lg mt-6">
      <Title level={2} className="mb-6">Lịch Sử Làm Bài Của Tôi</Title>
      <Table
        dataSource={history}
        columns={columns}
        rowKey="submissionId"
        loading={loading}
        pagination={{ pageSize: 10 }}
        bordered
      />
    </div>
  );
};

export default ExamHistoryPage;
