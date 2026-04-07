import { useEffect, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  List,
  Modal,
  Row,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { Link, useParams } from "react-router-dom";
import api from "@/utils/axiosClient";
import { useUser } from "@/context/authContext";

import type { Classroom, ClassroomStudent, ClassroomTeacher } from "@/types/classroom";


const { Text } = Typography;
type InviteType = "student" | "teacher";

function ClassroomDetailPage() {
  const { id } = useParams();

  const { user } = useUser();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [teachers, setTeachers] = useState<ClassroomTeacher[]>([]);
  const [students, setStudents] = useState<ClassroomStudent[]>([]);
  const [teacherCandidates, setTeacherCandidates] = useState<ClassroomTeacher[]>([]);
  const [studentCandidates, setStudentCandidates] = useState<ClassroomStudent[]>([]);
  const [inviteModalType, setInviteModalType] = useState<InviteType | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);
  const [submittingInvite, setSubmittingInvite] = useState(false);
  const [loading, setLoading] = useState(false);

  const classroomId = Number(id);

  const loadDetail = async () => {
    const [classroomRes, teachersRes, studentsRes] = await Promise.all([
      api.get<Classroom>(`/api/classrooms/${classroomId}`),
      api.get<ClassroomTeacher[]>(`/api/classrooms/${classroomId}/teachers`),
      api.get<ClassroomStudent[]>(`/api/classrooms/${classroomId}/students`),
    ]);

    setClassroom(classroomRes.data);
    setTeachers(teachersRes.data);
    setStudents(studentsRes.data);
  };

  const loadCandidates = async () => {
    const [teachersRes, studentsRes] = await Promise.all([
      api.get<ClassroomTeacher[]>("/api/classrooms/teachers"),
      api.get<ClassroomStudent[]>("/api/classrooms/students"),
    ]);

    setTeacherCandidates(teachersRes.data);
    setStudentCandidates(studentsRes.data);
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

  const canManageMembers = user?.role === "ADMIN" || user?.role === "TEACHER";

  const openInviteModal = async (type: InviteType) => {
    setInviteModalType(type);
    setSelectedCandidateId(null);

    if (teacherCandidates.length === 0 && studentCandidates.length === 0) {
      try {
        await loadCandidates();
      } catch {
        message.error("Khong the tai danh sach ung vien");
      }
    }
  };

  const closeInviteModal = () => {
    setInviteModalType(null);
    setSelectedCandidateId(null);
  };

  const handleInvite = async () => {
    if (!inviteModalType || !selectedCandidateId) {
      message.warning("Vui long chon nguoi can moi");
      return;
    }

    setSubmittingInvite(true);
    try {
      const endpoint =
        inviteModalType === "teacher"
          ? `/api/classrooms/${classroomId}/invite/teachers/${selectedCandidateId}`
          : `/api/classrooms/${classroomId}/invite/students/${selectedCandidateId}`;

      await api.post(endpoint);
      message.success("Da gui loi moi thanh cong");
      closeInviteModal();
      await loadDetail();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message ?? "Khong the gui loi moi";
      message.error(errorMessage);
    } finally {
      setSubmittingInvite(false);
    }
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

          <Space direction="vertical" size={16} className="w-full">
            <Card
              title="Giao vien"
              className="shadow-sm"
              loading={loading}
              extra={
                canManageMembers ? (
                  <Button type="text" icon={<PlusOutlined />} onClick={() => void openInviteModal("teacher")} />
                ) : null
              }
            >
              {teachers.length === 0 ? (
                <Empty description="Chua co giao vien nao trong lop" />
              ) : (
                <List
                  dataSource={teachers}
                  renderItem={(teacher: ClassroomTeacher) => (
                    <List.Item>
                      <Space size={12} align="center">
                        <Avatar className="portal-avatar">{getInitials(teacher.fullname || teacher.username)}</Avatar>
                        <Text strong={!teacher.invited} type={teacher.invited ? "secondary" : undefined}>
                          {teacher.fullname || teacher.username}
                          {teacher.invited ? " (da duoc moi)" : ""}
                        </Text>
                      </Space>
                    </List.Item>
                  )}
                />
              )}
            </Card>

            <Card
              title="Sinh vien trong lop"
              className="shadow-sm"
              loading={loading}
              extra={
                canManageMembers ? (
                  <Button type="text" icon={<PlusOutlined />} onClick={() => void openInviteModal("student")} />
                ) : null
              }
            >
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
                        <Text strong={!student.invited} type={student.invited ? "secondary" : undefined}>
                          {student.fullname || student.username}
                          {student.invited ? " (da duoc moi)" : ""}
                        </Text>
                      </Space>
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Space>

        </Col>
      </Row>

      <Modal
        open={inviteModalType !== null}
        title={inviteModalType === "teacher" ? "Moi giao vien" : "Moi sinh vien"}
        onCancel={closeInviteModal}
        onOk={() => void handleInvite()}
        okText="Gui loi moi"
        confirmLoading={submittingInvite}
      >
        <Select
          showSearch
          className="w-full"
          placeholder={inviteModalType === "teacher" ? "Chon giao vien" : "Chon sinh vien"}
          value={selectedCandidateId ?? undefined}
          onChange={(value) => setSelectedCandidateId(value)}
          options={
            inviteModalType === "teacher"
              ? teacherCandidates.map((teacher) => ({
                  label: `${teacher.fullname || teacher.username} - ${teacher.email}`,
                  value: teacher.id,
                }))
              : studentCandidates.map((student) => ({
                  label: `${student.fullname || student.username} - ${student.email}`,
                  value: student.id,
                }))
          }
          filterOption={(input, option) =>
            String(option?.label ?? "")
              .toLowerCase()
              .includes(input.toLowerCase())
          }
        />
      </Modal>
    </Space>
  );
}

export default ClassroomDetailPage;
