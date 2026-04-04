import React, { useEffect, useState } from "react";
import { Card, Col, Row, Statistic, Progress, List, Typography, Spin, Empty, Avatar, Space } from "antd";
import { CheckCircleOutlined, AudioOutlined, StarOutlined, MessageOutlined, UserOutlined } from "@ant-design/icons";
import api from "@/utils/axiosClient";

const { Title, Text } = Typography;

interface ProgressData {
  totalRegularSubmissions: number;
  totalPronunciationSubmissions: number;
  averageScore: number;
  recentFeedback: string[];
}

const ProgressPage: React.FC = () => {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await api.get("/api/exams/progress");
        setData(res.data);
      } catch (error) {
        console.error("Error fetching progress:", error);
      } finally {
        setLoading(false);
      }
    };
    void fetchProgress();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Spin size="large" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center">
        <Empty description="Không có dữ liệu tiến độ" />
      </div>
    );
  }

  const overallProgress = Math.min(100, (data.totalRegularSubmissions + data.totalPronunciationSubmissions) * 10);

  return (
    <Space direction="vertical" size={16} className="w-full">
      {/* ── Header ── */}
      <Card className="dashboard-surface">
        <Title level={3} className="!mb-0 !text-slate-800">Tiến độ học tập của tôi</Title>
        <Text type="secondary">Theo dõi kết quả học tập và phản hồi từ giáo viên</Text>
      </Card>

      {/* ── Stats row ── */}
      <Row gutter={[14, 14]}>
        <Col xs={24} md={8}>
          <Card className="dashboard-stat-card">
            <div className="dashboard-stat-stripe score" />
            <Space align="start" className="w-full justify-between">
              <Statistic
                title="Điểm trung bình"
                value={data.averageScore}
                suffix="/ 10"
                precision={1}
                prefix={<StarOutlined className="text-yellow-500" />}
              />
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="dashboard-stat-card">
            <div className="dashboard-stat-stripe done" />
            <Space align="start" className="w-full justify-between">
              <Statistic
                title="Bài tập đã làm"
                value={data.totalRegularSubmissions}
                prefix={<CheckCircleOutlined className="text-emerald-500" />}
              />
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="dashboard-stat-card">
            <div className="dashboard-stat-stripe ontime" />
            <Space align="start" className="w-full justify-between">
              <Statistic
                title="Luyện phát âm"
                value={data.totalPronunciationSubmissions}
                prefix={<AudioOutlined className="text-purple-500" />}
              />
            </Space>
          </Card>
        </Col>
      </Row>

      {/* ── Bottom row: feedback + progress ── */}
      <Row gutter={[14, 14]}>
        <Col xs={24} md={16}>
          <Card
            title={
              <Space size={8}>
                <MessageOutlined className="text-sky-500" />
                Nhận xét mới nhất từ giáo viên
              </Space>
            }
            className="dashboard-surface"
          >
            {data.recentFeedback.length > 0 ? (
              <List
                dataSource={data.recentFeedback}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar className="portal-avatar">
                          <UserOutlined />
                        </Avatar>
                      }
                      description={
                        <Text className="text-slate-700 italic" style={{ fontSize: 13 }}>
                          "{item}"
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có phản hồi nào" />
            )}
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card
            title={
              <Space size={8}>
                <CheckCircleOutlined className="text-emerald-500" />
                Mức độ hoàn thành
              </Space>
            }
            className="dashboard-surface"
          >
            <div className="flex flex-col items-center py-4">
              <Progress
                type="dashboard"
                percent={overallProgress}
                strokeColor={{ "0%": "#f59e0b", "100%": "#10b981" }}
                strokeWidth={12}
                width={160}
              />
              <Text type="secondary" className="mt-4 text-center" style={{ fontSize: 13 }}>
                Tổng luyện tập: {data.totalRegularSubmissions + data.totalPronunciationSubmissions} bài
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Hãy tiếp tục phát huy nhé!
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </Space>
  );
};

export default ProgressPage;
