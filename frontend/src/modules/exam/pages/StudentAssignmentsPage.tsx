import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Empty, Input, Space, Table, Tag, Typography, message } from "antd";
import { FileTextOutlined, PlayCircleOutlined, SearchOutlined } from "@ant-design/icons";
import { getAssignments, type AssignmentDto } from "@/api/assignmentApi";

const { Title, Text } = Typography;

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

const StudentAssignmentsPage: React.FC = () => {
  const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const assignmentData = await getAssignments();
        setAssignments(assignmentData);
      } catch (error) {
        console.error(error);
        message.error("Không thể tải danh sách bài tập");
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const availableAssignments = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    const searchedAssignments = !normalizedKeyword
      ? assignments
      : assignments.filter((assignment) =>
          [
            assignment.title,
            assignment.description,
            ...(assignment.classrooms ?? []).map((classroom) => classroom.name),
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedKeyword),
        );

    return [...searchedAssignments].sort((left, right) => {
      if (!left.dueAt && !right.dueAt) {
        return 0;
      }
      if (!left.dueAt) {
        return 1;
      }
      if (!right.dueAt) {
        return -1;
      }
      return new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime();
    });
  }, [assignments, keyword]);

  const columns = [
    {
      title: "Bài tập",
      key: "title",
      render: (_: unknown, record: AssignmentDto) => (
        <Space direction="vertical" size={2}>
          <Text strong>{record.title}</Text>
          <Text type="secondary">{record.description || "Không có mô tả"}</Text>
        </Space>
      ),
    },
    {
      title: "Lớp được giao",
      key: "classrooms",
      render: (_: unknown, record: AssignmentDto) => (
        <Space wrap>
          {(record.classrooms ?? []).map((classroom) => (
            <Tag key={classroom.id} color="cyan">
              {classroom.name}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "Số câu hỏi",
      key: "questionCount",
      width: 120,
      render: (_: unknown, record: AssignmentDto) => record.questions?.length ?? 0,
    },
    {
      title: "Lượt còn lại",
      key: "remainingAttempts",
      width: 140,
      render: (_: unknown, record: AssignmentDto) => (
        <Tag color={(record.remainingAttempts ?? 0) > 0 ? "blue" : "red"}>
          {record.remainingAttempts ?? 0}
        </Tag>
      ),
    },
    {
      title: "Hạn làm bài",
      key: "dueAt",
      width: 220,
      render: (_: unknown, record: AssignmentDto) => {
        const isExpired = !!record.dueAt && new Date(record.dueAt).getTime() < Date.now();
        return <Tag color={isExpired ? "red" : "magenta"}>{formatDateTime(record.dueAt)}</Tag>;
      },
    },
    {
      title: "Hành động",
      key: "action",
      width: 160,
      render: (_: unknown, record: AssignmentDto) => {
        const isExpired = !!record.dueAt && new Date(record.dueAt).getTime() < Date.now();
        const noAttemptsLeft = (record.remainingAttempts ?? 0) <= 0;
        return (
          <Link to={`/exams/${record.id}/take`}>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              disabled={!record.questions || record.questions.length === 0 || isExpired || noAttemptsLeft}
            >
              Làm bài
            </Button>
          </Link>
        );
      },
    },
  ];

  return (
    <Space direction="vertical" size={16} className="w-full">
      <Card className="dashboard-surface">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Title level={3} className="!mb-1 !text-slate-800">
              Bài tập của tôi
            </Title>
            <Text type="secondary">
              Danh sách bài tập đang còn hiệu lực cho các lớp bạn tham gia.
            </Text>
          </div>
          <Input
            prefix={<SearchOutlined className="text-gray-400" />}
            placeholder="Tìm theo tên bài tập hoặc lớp"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            allowClear
            className="!min-w-[260px]"
          />
        </div>
      </Card>

      <Card
        title={
          <Space size={8}>
            <FileTextOutlined className="text-sky-500" />
            <span>Danh sách bài tập</span>
          </Space>
        }
        className="dashboard-surface"
      >
        {availableAssignments.length === 0 && !loading ? (
          <Empty description="Chưa có bài tập nào được giao cho bạn" />
        ) : (
          <Table
            columns={columns}
            dataSource={availableAssignments}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 8, showSizeChanger: false }}
          />
        )}
      </Card>
    </Space>
  );
};

export default StudentAssignmentsPage;
