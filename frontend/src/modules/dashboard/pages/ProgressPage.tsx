import React, { useEffect, useState } from "react";
import { Card, Col, Row, Statistic, Progress, List, Typography, Spin, Empty, Avatar } from "antd";
import { CheckCircleOutlined, AudioOutlined, StarOutlined, MessageOutlined, UserOutlined } from "@ant-design/icons";
import axios from "@/utils/axiosClient";

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
        const res = await axios.get("/api/exams/progress");
        setData(res.data);
      } catch (error) {
        console.error("Error fetching progress:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  if (loading) {
    return <div className="flex justify-center mt-20"><Spin size="large" /></div>;
  }

  if (!data) {
    return <div className="p-8 text-center"><Empty description="Khong co du lieu tien do" /></div>;
  }

  const overallProgress = Math.min(100, (data.totalRegularSubmissions + data.totalPronunciationSubmissions) * 10); // Dummy logic for demo

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Title level={2} className="mb-8">Tien do hoc tap cua toi</Title>
      
      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <Card className="shadow-sm hover:shadow-md transition-shadow h-full bg-blue-50">
            <Statistic
              title="Diem trung binh"
              value={data.averageScore}
              suffix="/ 10"
              prefix={<StarOutlined className="text-yellow-500" />}
              precision={2}
            />
            <div className="mt-4">
              <Progress 
                percent={data.averageScore * 10} 
                status={data.averageScore >= 8 ? "success" : "normal"}
                strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
              />
            </div>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card className="shadow-sm hover:shadow-md transition-shadow h-full bg-green-50">
            <Statistic
              title="Bai tap da lam"
              value={data.totalRegularSubmissions}
              prefix={<CheckCircleOutlined className="text-green-500" />}
            />
            <Text type="secondary" className="mt-2 block">Tong so bai tap ly thuyet</Text>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card className="shadow-sm hover:shadow-md transition-shadow h-full bg-purple-50">
            <Statistic
              title="Luyen phat am"
              value={data.totalPronunciationSubmissions}
              prefix={<AudioOutlined className="text-purple-500" />}
            />
            <Text type="secondary" className="mt-2 block">Bai luyen phat am hoan thanh</Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} className="mt-8">
        <Col xs={24} md={16}>
          <Card 
            title={<span><MessageOutlined className="mr-2" />Nhan xet moi nhat tu giao vien</span>} 
            className="shadow-sm h-full"
          >
            {data.recentFeedback.length > 0 ? (
              <List
                dataSource={data.recentFeedback}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} className="bg-blue-100 text-blue-600" />}
                      description={<Text className="text-slate-700 italic">"{item}"</Text>}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chua co phan hoi nao" />
            )}
          </Card>
        </Col>
        
        <Col xs={24} md={8}>
          <Card title="Muc do hoan thanh" className="shadow-sm h-full flex flex-col items-center justify-center py-8">
            <Progress
              type="dashboard"
              percent={overallProgress}
              strokeColor={{ '0%': '#ff4d4f', '50%': '#ffa940', '100%': '#52c41a' }}
              strokeWidth={10}
              width={160}
            />
            <div className="mt-4 text-center">
              <Text strong className="text-lg block">Tong luyento</Text>
              <Text type="secondary">Hay tiep tuc phat huy nhe!</Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProgressPage;
