import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { Link, useParams } from "react-router-dom";
import api from "@/utils/axiosClient";
import { useUser } from "@/context/authContext";
import type { Classroom, ClassroomStudent, ClassroomTeacher } from "@/types/classroom";

function ClassroomDetailPage() {
  const { id } = useParams();
  const { user } = useUser();
  const canManage = user?.role === "ADMIN" || user?.role === "TEACHER";

  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [teachers, setTeachers] = useState<ClassroomTeacher[]>([]);
  const [students, setStudents] = useState<ClassroomStudent[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | undefined>(undefined);
  const [selectedStudentId, setSelectedStudentId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const classroomId = Number(id);

  const loadDetail = async () => {
    const [classroomRes, studentsRes] = await Promise.all([
      api.get<Classroom>(`/api/classrooms/${classroomId}`),
      api.get<ClassroomStudent[]>(`/api/classrooms/${classroomId}/students`),
    ]);

    setClassroom({ ...classroomRes.data, students: studentsRes.data });
  };

  const loadCandidates = async () => {
    if (!canManage) {
      return;
    }

    const [teacherRes, studentRes] = await Promise.all([
      api.get<ClassroomTeacher[]>("/api/classrooms/teachers"),
      api.get<ClassroomStudent[]>("/api/classrooms/students"),
    ]);

    setTeachers(teacherRes.data);
    setStudents(studentRes.data);
  };

  useEffect(() => {
    if (!Number.isFinite(classroomId)) {
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        await Promise.all([loadDetail(), loadCandidates()]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [classroomId]);

  const classroomStudents = classroom?.students ?? [];

  const availableStudents = useMemo(() => {
    const joinedIds = new Set(classroomStudents.map((student) => student.id));
    return students.filter((student) => !joinedIds.has(student.id));
  }, [classroomStudents, students]);

  const onAssignTeacher = async () => {
    if (!selectedTeacherId) {
      message.warning("Chon giao vien truoc khi gan");
      return;
    }

    await api.put(`/api/classrooms/${classroomId}/teacher/${selectedTeacherId}`);
    message.success("Gan giao vien thanh cong");
    await loadDetail();
  };

  const onAddStudent = async () => {
    if (!selectedStudentId) {
      message.warning("Chon sinh vien truoc khi them");
      return;
    }

    await api.post(`/api/classrooms/${classroomId}/students/${selectedStudentId}`);
    message.success("Them sinh vien vao lop thanh cong");
    setSelectedStudentId(undefined);
    await loadDetail();
  };

  const onRemoveStudent = async (studentId: number) => {
    await api.delete(`/api/classrooms/${classroomId}/students/${studentId}`);
    message.success("Da xoa sinh vien khoi lop");
    await loadDetail();
  };

  const columns: ColumnsType<ClassroomStudent> = [
    { title: "ID", dataIndex: "id", key: "id", width: 90 },
    { title: "Username", dataIndex: "username", key: "username", width: 180 },
    { title: "Ho va ten", dataIndex: "fullname", key: "fullname" },
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Ma sinh vien",
      dataIndex: "studentCode",
      key: "studentCode",
      render: (value: string | null | undefined) => value || <Tag>Chua cap</Tag>,
    },
    {
      title: "Tac vu",
      key: "action",
      width: 130,
      render: (_, record) =>
        canManage ? (
          <Popconfirm
            title="Xoa sinh vien khoi lop"
            description="Ban co chac muon xoa sinh vien nay khong?"
            onConfirm={() => void onRemoveStudent(record.id)}
            okText="Xoa"
            cancelText="Huy"
          >
            <Button danger>Xoa</Button>
          </Popconfirm>
        ) : null,
    },
  ];

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
              <Descriptions.Item label="So sinh vien">{classroomStudents.length}</Descriptions.Item>
              <Descriptions.Item label="Mo ta">{classroom?.description || "-"}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} xl={15}>
          {canManage && (
            <Card title="Thao tac quan ly lop" className="shadow-sm mb-4" loading={loading}>
              <Space direction="vertical" className="w-full" size={14}>
                <Space.Compact className="w-full">
                  <Select<number>
                    className="w-full"
                    placeholder="Chon giao vien de gan"
                    value={selectedTeacherId}
                    onChange={setSelectedTeacherId}
                    options={teachers.map((teacher) => ({
                      value: teacher.id,
                      label: `${teacher.fullname} (${teacher.email})`,
                    }))}
                    showSearch
                    optionFilterProp="label"
                  />
                  <Button type="primary" onClick={() => void onAssignTeacher()}>
                    Gan giao vien
                  </Button>
                </Space.Compact>

                <Space.Compact className="w-full">
                  <Select<number>
                    className="w-full"
                    placeholder="Chon sinh vien de them vao lop"
                    value={selectedStudentId}
                    onChange={setSelectedStudentId}
                    options={availableStudents.map((student) => ({
                      value: student.id,
                      label: `${student.fullname} (${student.email})`,
                    }))}
                    showSearch
                    optionFilterProp="label"
                  />
                  <Button onClick={() => void onAddStudent()}>Them sinh vien</Button>
                </Space.Compact>
              </Space>
            </Card>
          )}

          <Card title="Sinh vien trong lop" className="shadow-sm" loading={loading}>
            <Table
              rowKey="id"
              columns={columns}
              dataSource={classroomStudents}
              pagination={{ pageSize: 7 }}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

export default ClassroomDetailPage;
