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
import type { Classroom, ClassroomStudent } from "@/types/classroom";

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
    return <Empty description="Khong tim thay lop hoc" />;
  }

  return (
    <Space direction="vertical" size={16} className="w-full">
      <Link to="/classrooms">Quay lai danh sach lop hoc</Link>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={9}>
          <Card title="Thong tin lop hoc" className="shadow-sm" loading={loading}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="ID">{classroom?.id}</Descriptions.Item>
              <Descriptions.Item label="Ma lop">{classroom?.code}</Descriptions.Item>
              <Descriptions.Item label="Ten lop">{classroom?.name}</Descriptions.Item>
              <Descriptions.Item label="Giao vien">
                {classroom?.teacherName || <Tag>Chua gan</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="Email giao vien">{classroom?.teacherEmail || "-"}</Descriptions.Item>
              <Descriptions.Item label="So sinh vien">{students.length}</Descriptions.Item>
              <Descriptions.Item label="Mo ta">{classroom?.description || "-"}</Descriptions.Item>
            </Descriptions>
            {(user?.role === "TEACHER" || user?.role === "ADMIN") && (
              <Link to={`/classrooms/${classroomId}/progress`}>
                <Button className="mt-4 ml-2">
                  Xem bao cao tien do
                </Button>
              </Link>
            )}
          </Card>
        </Col>

        <Col xs={24} xl={15}>
          <Card title="Sinh vien trong lop" className="shadow-sm" loading={loading}>
            <div className="mb-3">
              <Text type="secondary">
                Sinh vien tham gia lop bang ma lop <strong>{classroom?.code}</strong>
              </Text>
            </div>

            {students.length === 0 ? (
              <Empty description="Chua co sinh vien nao trong lop" />
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
