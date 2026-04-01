import { useEffect, useState } from "react";
import {
  Avatar,
  Card,
  Col,
  Descriptions,
  Empty,
  List,
  Row,
  Space,
  Tag,
  Typography,
  Modal,
  Button,
  Checkbox,
  Input,
  message,
} from "antd";
import { Link, useParams } from "react-router-dom";
import { PlusOutlined } from "@ant-design/icons";
import api from "@/utils/axiosClient";
import type { Classroom, ClassroomStudent, ClassroomTeacher, ClassroomMember } from "@/types/classroom";

const { Text } = Typography;

function ClassroomDetailPage() {
  const { id } = useParams();

  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [students, setStudents] = useState<ClassroomStudent[]>([]);
  const [teachers, setTeachers] = useState<ClassroomTeacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteType, setInviteType] = useState<"student" | "teacher">("student");
  const [availableUsers, setAvailableUsers] = useState<ClassroomMember[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [inviting, setInviting] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [pendingInvites, setPendingInvites] = useState<Set<number>>(new Set());

  const classroomId = Number(id);

  const loadDetail = async () => {
    const [classroomRes, studentsRes, teachersRes] = await Promise.all([
      api.get<Classroom>(`/api/classrooms/${classroomId}`),
      api.get<ClassroomStudent[]>(`/api/classrooms/${classroomId}/students`),
      api.get<ClassroomTeacher[]>("/api/classrooms/teachers"),
    ]);

    setClassroom(classroomRes.data);
    setStudents(studentsRes.data);
    
    // Get all teachers from backend
    const allTeachers = teachersRes.data || [];
    setTeachers(allTeachers);
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

  const openInviteModal = async (type: "student" | "teacher") => {
    setInviteType(type);
    setSelectedUsers([]);
    setSearchKeyword("");
    
    try {
      let response;
      if (type === "student") {
        response = await api.get("/api/classrooms/students");
      } else {
        response = await api.get("/api/classrooms/teachers");
      }
      
      const allUsers = response.data || [];
      
      // Filter out users already in the classroom
      const existingIds = new Set(
        type === "student" 
          ? students.map(s => s.id) 
          : teachers.map(t => t.id)
      );
      
      const available = allUsers
        .filter((user: ClassroomMember) => !existingIds.has(user.id))
        .map((user: ClassroomMember) => ({
          ...user,
          pending: pendingInvites.has(user.id),
        }));
      
      setAvailableUsers(available);
      setInviteModalOpen(true);
    } catch (error) {
      message.error("Không thể tải danh sách người dùng");
    }
  };

  const handleInviteSubmit = async () => {
    if (selectedUsers.length === 0) {
      message.warning("Vui lòng chọn ít nhất một người");
      return;
    }

    setInviting(true);
    try {
      const invitePromises = selectedUsers.map((userId) =>
        api.post(`/api/classrooms/${classroomId}/${inviteType === "student" ? "students" : "teachers"}/${userId}`)
      );

      await Promise.all(invitePromises);
      
      // Add to pending invites
      const newPendingInvites = new Set(pendingInvites);
      selectedUsers.forEach(id => newPendingInvites.add(id));
      setPendingInvites(newPendingInvites);
      
      message.success(`Đã mời ${selectedUsers.length} ${inviteType === "student" ? "sinh viên" : "giáo viên"}`);
      setInviteModalOpen(false);
      await loadDetail();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message ?? `Không thể mời ${inviteType === "student" ? "sinh viên" : "giáo viên"}`;
      message.error(errorMessage);
    } finally {
      setInviting(false);
    }
  };

  const filteredUsers = availableUsers.filter((user) => {
    const searchLower = searchKeyword.toLowerCase();
    return (
      user.fullname.toLowerCase().includes(searchLower) ||
      user.username.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  });

  if (!classroom && !loading) {
    return <Empty description="Lớp học không tồn tại" />;
  }

  return (
    <Space direction="vertical" size={16} className="w-full">
      <Link to="/classrooms">Quay lai danh sach lop hoc</Link>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={9}>
          <Card title="Thong tin lop hoc" className="shadow-sm" loading={loading}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Mã lớp">{classroom?.code}</Descriptions.Item>
              <Descriptions.Item label="Tên lớp">{classroom?.name}</Descriptions.Item>
              <Descriptions.Item label="Giáo viên">
                {classroom?.teacherName || <Tag></Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="Email giáo viên">{classroom?.teacherEmail || "-"}</Descriptions.Item>
              <Descriptions.Item label="Số lượng sinh viên">{students.length}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} xl={15}>
          <Space direction="vertical" size={16} className="w-full">
            {/* Teachers List */}
            <Card 
              title="Giáo viên" 
              className="shadow-sm" 
              loading={loading}
              extra={
                <Button 
                  type="text" 
                  icon={<PlusOutlined />} 
                  onClick={() => openInviteModal("teacher")}
                  size="small"
                >
                  Mời giáo viên
                </Button>
              }
            >
              {teachers.length === 0 ? (
                <Empty description="Không có giáo viên" />
              ) : (
                <List
                  dataSource={teachers}
                  pagination={teachers.length > 10 ? { pageSize: 10 } : false}
                  renderItem={(teacher: ClassroomTeacher) => {
                    const isPending = pendingInvites.has(teacher.id);
                    return (
                      <List.Item>
                        <Space size={12} align="center" className={isPending ? "opacity-50" : ""}>
                          <Avatar className="portal-avatar" style={isPending ? { opacity: 0.6 } : {}}>
                            {getInitials(teacher.fullname || teacher.username)}
                          </Avatar>
                          <div>
                            <Text strong style={isPending ? { color: "#999" } : {}}>
                              {teacher.fullname || teacher.username}
                              {isPending && <span style={{ color: "#999" }}> (đã được mời)</span>}
                            </Text>
                            <div>
                              <Text type="secondary" style={isPending ? { color: "#ccc" } : {}}>
                                {teacher.email}
                              </Text>
                            </div>
                          </div>
                        </Space>
                      </List.Item>
                    );
                  }}
                />
              )}
            </Card>

            {/* Students List */}
            <Card 
              title="Sinh viên" 
              className="shadow-sm" 
              loading={loading}
              extra={
                <Button 
                  type="text" 
                  icon={<PlusOutlined />} 
                  onClick={() => openInviteModal("student")}
                  size="small"
                >
                  Mời sinh viên
                </Button>
              }
            >
              {students.length === 0 ? (
                <Empty description="Không có sinh viên" />
              ) : (
                <List
                  dataSource={students}
                  pagination={students.length > 10 ? { pageSize: 10 } : false}
                  renderItem={(student: ClassroomStudent) => {
                    const isPending = pendingInvites.has(student.id);
                    return (
                      <List.Item>
                        <Space size={12} align="center" className={isPending ? "opacity-50" : ""}>
                          <Avatar className="portal-avatar" style={isPending ? { opacity: 0.6 } : {}}>
                            {getInitials(student.fullname || student.username)}
                          </Avatar>
                          <div>
                            <Text strong style={isPending ? { color: "#999" } : {}}>
                              {student.fullname || student.username}
                              {isPending && <span style={{ color: "#999" }}> (đã được mời)</span>}
                            </Text>
                            <div>
                              <Text type="secondary" style={isPending ? { color: "#ccc" } : {}}>
                                {student.email}
                              </Text>
                            </div>
                          </div>
                        </Space>
                      </List.Item>
                    );
                  }}
                />
              )}
            </Card>
          </Space>
        </Col>
      </Row>

      {/* Invite Modal */}
      <Modal
        open={inviteModalOpen}
        title={`Mời ${inviteType === "student" ? "sinh viên" : "giáo viên"}`}
        onCancel={() => setInviteModalOpen(false)}
        onOk={() => void handleInviteSubmit()}
        confirmLoading={inviting}
        okText="Mời"
        cancelText="Hủy"
        width={500}
      >
        <Space direction="vertical" size={16} className="w-full">
          <Input
            placeholder={`Tìm ${inviteType === "student" ? "sinh viên" : "giáo viên"}...`}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            allowClear
          />
          
          <div className="max-h-96 overflow-y-auto border rounded p-2">
            {filteredUsers.length === 0 ? (
              <Empty 
                description={`Không có ${inviteType === "student" ? "sinh viên" : "giáo viên"} có sẵn`}
                style={{ marginTop: 20, marginBottom: 20 }}
              />
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <Checkbox
                    key={user.id}
                    checked={selectedUsers.includes(user.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers([...selectedUsers, user.id]);
                      } else {
                        setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                      }
                    }}
                    className="block"
                  >
                    <div>
                      <Text strong>{user.fullname || user.username}</Text>
                      <div>
                        <Text type="secondary">{user.email}</Text>
                      </div>
                    </div>
                  </Checkbox>
                ))}
              </div>
            )}
          </div>

          <Text type="secondary">
            Đã chọn {selectedUsers.length} {inviteType === "student" ? "sinh viên" : "giáo viên"}
          </Text>
        </Space>
      </Modal>
    </Space>
  );
}

export default ClassroomDetailPage;
