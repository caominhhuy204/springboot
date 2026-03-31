import { useEffect, useState } from "react";
import { AudioOutlined, RiseOutlined, SoundOutlined, TeamOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Col, Empty, Row, Skeleton, Space, Statistic, Tag, Typography } from "antd";
import { Link } from "react-router-dom";
import api from "@/utils/axiosClient";
import type { Classroom } from "@/types/classroom";

const { Paragraph, Text, Title } = Typography;

function PronunciationHubPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadClassrooms = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get<Classroom[]>("/api/classrooms");
        setClassrooms(res.data);
      } catch {
        setError("Khong the tai danh sach lop hoc cho module phat am.");
      } finally {
        setLoading(false);
      }
    };

    void loadClassrooms();
  }, []);

  const totalStudents = classrooms.reduce((sum, classroom) => sum + classroom.studentCount, 0);
  const classroomsWithTeacher = classrooms.filter((classroom) => classroom.teacherName).length;

  return (
    <Space direction="vertical" size={16} className="w-full">
      <Card className="pronunciation-hero !rounded-3xl !border-0">
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} xl={15}>
            <Space direction="vertical" size={12}>
              <span className="pronunciation-hero__eyebrow">
                <SoundOutlined />
                TV6 Pronunciation
              </span>
              <Title level={2} className="!mb-0 !text-cyan-50">
                Trung tam luyen phat am cho tung lop hoc
              </Title>
              <Paragraph className="!mb-0 !text-cyan-100">
                Chon lop de mo danh sach bai luyen, ghi am nhanh, upload audio va theo doi lich su nop bai trong cung mot khu vuc.
              </Paragraph>
            </Space>
          </Col>
          <Col xs={24} xl={9}>
            <Row gutter={[12, 12]}>
              <Col span={12}>
                <Card bordered={false} className="pronunciation-metric">
                  <Statistic title="Lop co phat am" value={classrooms.length} prefix={<AudioOutlined />} />
                </Card>
              </Col>
              <Col span={12}>
                <Card bordered={false} className="pronunciation-metric">
                  <Statistic title="Tong hoc vien" value={totalStudents} prefix={<TeamOutlined />} />
                </Card>
              </Col>
              <Col span={24}>
                <Card bordered={false} className="pronunciation-metric">
                  <Statistic
                    title="Lop da co giao vien phu trach"
                    value={classroomsWithTeacher}
                    suffix={`/ ${classrooms.length || 0}`}
                    prefix={<RiseOutlined />}
                  />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {error && <Alert type="error" showIcon message={error} />}

      {loading ? (
        <Card className="shadow-sm">
          <Skeleton active paragraph={{ rows: 4 }} />
        </Card>
      ) : classrooms.length === 0 ? (
        <Card className="pronunciation-panel !rounded-2xl">
          <Empty description="Ban chua co lop hoc nao de su dung module phat am" />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {classrooms.map((classroom) => (
            <Col xs={24} lg={12} xl={8} key={classroom.id}>
              <Card className="pronunciation-exercise-card h-full !rounded-3xl">
                <div className="pronunciation-exercise-card__banner">
                  <Space direction="vertical" size={10} className="w-full">
                    <Tag color="cyan" className="!m-0 !w-fit">
                      {classroom.code}
                    </Tag>
                    <Title level={4} className="!mb-0 !text-slate-50">
                      {classroom.name}
                    </Title>
                    <Text className="!text-cyan-50">
                      Giao vien: {classroom.teacherName ?? "Chua gan"}
                    </Text>
                  </Space>
                </div>
                <div className="pronunciation-exercise-card__body">
                  <Space direction="vertical" size={14} className="w-full">
                    <div className="flex flex-wrap gap-2">
                      <span className="pronunciation-pill">
                        <TeamOutlined />
                        {classroom.studentCount} sinh vien
                      </span>
                      <span className="pronunciation-pill">
                        <SoundOutlined />
                        Khu vuc nop audio
                      </span>
                    </div>
                    <Paragraph className="!mb-0 !text-slate-600">
                      {classroom.description || "Mo module nay de tao bai phat am, nop audio va xem tien do cua tung hoc vien."}
                    </Paragraph>
                    <Link to={`/classrooms/${classroom.id}/pronunciation`}>
                      <Button type="primary" icon={<AudioOutlined />} size="large">
                        Mo module phat am
                      </Button>
                    </Link>
                  </Space>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Space>
  );
}

export default PronunciationHubPage;
