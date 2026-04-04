import { useEffect, useState } from "react";
import { AudioOutlined, RiseOutlined, SoundOutlined, TeamOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Col, Empty, Row, Skeleton, Space, Statistic, Tag, Typography } from "antd";
import { Link } from "react-router-dom";
import api from "@/utils/axiosClient";
import type { classroom as Classroom } from "@/types/classroom";

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
        setError("Không thể tải danh sách lớp học cho module phát âm.");
      } finally {
        setLoading(false);
      }
    };

    void loadClassrooms();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalStudents = classrooms.reduce((sum, classroom) => sum + classroom.studentCount, 0);
  const classroomsWithTeacher = classrooms.filter((classroom) => classroom.teacherName).length;

  return (
    <Space direction="vertical" size={16} className="w-full">
      {/* ── Hero banner ── */}
      <Card className="pronunciation-hero !rounded-3xl !border-0">
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} xl={15}>
            <Space direction="vertical" size={12}>
              <span className="pronunciation-hero__eyebrow">
                <SoundOutlined />
                TV6 Pronunciation
              </span>
              <Title level={2} className="!mb-0 !text-cyan-50">
                Trung tâm luyện phát âm cho từng lớp học
              </Title>
              <Paragraph className="!mb-0 !text-cyan-100">
                Chọn lớp để mở danh sách bài luyện, ghi âm nhanh, upload audio và theo dõi lịch sử nộp bài trong cùng một khu vực.
              </Paragraph>
            </Space>
          </Col>
          <Col xs={24} xl={9}>
            <Row gutter={[12, 12]}>
              <Col span={12}>
                <Card bordered={false} className="pronunciation-metric">
                  <Statistic title="Lớp có phát âm" value={classrooms.length} prefix={<AudioOutlined />} />
                </Card>
              </Col>
              <Col span={12}>
                <Card bordered={false} className="pronunciation-metric">
                  <Statistic title="Tổng học viên" value={totalStudents} prefix={<TeamOutlined />} />
                </Card>
              </Col>
              <Col span={24}>
                <Card bordered={false} className="pronunciation-metric">
                  <Statistic
                    title="Lớp đã có giáo viên phụ trách"
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
        <Card className="dashboard-surface">
          <Skeleton active paragraph={{ rows: 4 }} />
        </Card>
      ) : classrooms.length === 0 ? (
        <Card className="pronunciation-panel !rounded-2xl">
          <Empty description="Bạn chưa có lớp học nào để sử dụng module phát âm" />
        </Card>
      ) : (
        <Row gutter={[14, 14]}>
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
                      Giáo viên: {classroom.teacherName ?? "Chưa gắn"}
                    </Text>
                  </Space>
                </div>
                <div className="pronunciation-exercise-card__body">
                  <Space direction="vertical" size={14} className="w-full">
                    <div className="flex flex-wrap gap-2">
                      <span className="pronunciation-pill">
                        <TeamOutlined />
                        {classroom.studentCount} sinh viên
                      </span>
                      <span className="pronunciation-pill">
                        <SoundOutlined />
                        Khu vực nộp audio
                      </span>
                    </div>
                    <Paragraph className="!mb-0 !text-slate-600">
                      {classroom.description || "Mở module này để tạo bài phát âm, nộp audio và xem tiến độ của từng học viên."}
                    </Paragraph>
                    <Link to={`/classrooms/${classroom.id}/pronunciation`}>
                      <Button type="primary" icon={<AudioOutlined />} size="large">
                        Mở module phát âm
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
