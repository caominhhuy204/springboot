import { useEffect, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  List,
  Row,
  Space,
  Tag,
  Typography,
} from "antd";
import { Link, useParams } from "react-router-dom";
import api from "@/utils/axiosClient";
import { useUser } from "@/context/authContext";
import type {  Classroom, ClassroomStudent } from "@/types/classroom";

const { Text } = Typography;

function ClassroomDetailPage() {
  const { id } = useParams();

  const { user } = useUser();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [students, setStudents] = useState<ClassroomStudent[]>([]);
  const [loading, setLoading] = useState(false);

  const classroomId = Number(id);

  const loadDetail = async () => {
    const [classroomRes, studentsRes] = await Promise.all([
      api.get<Classroom>(`/api/classrooms/${classroomId}`),
      api.get<ClassroomStudent[]>(`/api/classrooms/${classroomId}/students`),
    ]);

    setClassroom(classroomRes.data);
    setStudents(studentsRes.data);
  };

  useEffect(() => {
    if (!Number.isFinite(classroomId)) {
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        await loadDetail();
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [classroomId]);

  const getInitials = (fullname: string) => {
    return fullname
      .trim()
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  };

  if (!classroom && !loading) {
    return <Empty description="Không tìm thấy lớp học" />;
  }

  return (
    <Space direction="vertical" size={16} className="w-full">
      <Link to="/classrooms" className="text-sky-600 hover:text-sky-700 font-medium">
        ← Quay lại danh sách lớp học
      </Link>

      <Row gutter={[14, 14]}>
        <Col xs={24} xl={9}>
          <Card title="Thông tin lớp học" className="dashboard-surface" loading={loading}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="ID">
                <span className="font-mono text-slate-500">#{classroom?.id}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Mã lớp">
                <Tag color="blue" className="font-mono">{classroom?.code}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tên lớp">{classroom?.name}</Descriptions.Item>
              <Descriptions.Item label="Giáo viên">
                {classroom?.teacherName || <Tag color="default">Chưa gắn</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="Email giáo viên">{classroom?.teacherEmail || "—"}</Descriptions.Item>
              <Descriptions.Item label="Số sinh viên">{students.length}</Descriptions.Item>
              <Descriptions.Item label="Mô tả">{classroom?.description || "—"}</Descriptions.Item>
            </Descriptions>
            {(user?.role === "TEACHER" || user?.role === "ADMIN") && (
              <Link to={`/classrooms/${classroomId}/progress`}>
                <Button type="primary" className="mt-4">
                  Xem báo cáo tiến độ
                </Button>
              </Link>
            )}
          </Card>
        </Col>

        <Col xs={24} xl={15}>
          <Card title="Sinh viên trong lớp" className="dashboard-surface" loading={loading}>
            <div className="mb-3">
              <Text type="secondary">
                Sinh viên tham gia lớp bằng mã lớp <strong className="text-sky-600">{classroom?.code}</strong>
              </Text>
            </div>

            {students.length === 0 ? (
              <Empty description="Chưa có sinh viên nào trong lớp" />
            ) : (
              <List
                dataSource={students}
                pagination={{ pageSize: 10 }}
                renderItem={(student: ClassroomStudent) => (
                  <List.Item>
                    <Space size={12} align="center">
                      <Avatar className="portal-avatar">{getInitials(student.fullname || student.username)}</Avatar>
                      <Text strong>{student.fullname || student.username}</Text>
                    </Space>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

export default ClassroomDetailPage;
