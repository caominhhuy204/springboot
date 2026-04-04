import { useEffect, useState } from "react";
import {
  BarChartOutlined,
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  LineChartOutlined,
  NotificationOutlined,
  TeamOutlined,
  UserAddOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Button,
  Card,
  Col,
  List,
  Progress,
  Row,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { Link } from "react-router-dom";
import { useUser } from "@/context/authContext";
import api from "@/utils/axiosClient";
import type { UserProfile } from "@/types/user";
import { getAssignments } from "@/api/assignmentApi";
import type { AssignmentDto } from "@/api/assignmentApi";
import { getClassrooms } from "@/api/assignmentApi";
import { examApi } from "@/api/exam";
import type { HistoryResponse } from "@/api/exam";

const { Paragraph, Text, Title } = Typography;

// ── Types ──────────────────────────────────────────────
type TaskItem = {
  title: string;
  deadline: string;
  status: "Sắp đến hạn" | "Đang xử lý" | "Hoàn thành";
};

interface AdminStats {
  totalUsers: number;
  totalTeachers: number;
  totalStudents: number;
  totalAdmins: number;
  totalClassrooms: number;
  pendingAccounts: number;
  totalAssignments: number;
  totalSubmissions: number;
  gradedSubmissions: number;
}

interface MonthlyUserStats {
  month: string;
  students: number;
  teachers: number;
}

interface MonthlySubmissionStats {
  month: string;
  assignments: number;
  submissions: number;
}

// ── Chart colors ────────────────────────────────────────
const PIE_COLORS = ["#10b981", "#3b82f6", "#f59e0b"];

// ── Helpers ─────────────────────────────────────────────
const roleTag = (role: string) => {
  const map: Record<string, { color: string; label: string }> = {
    ADMIN: { color: "red", label: "Quản trị" },
    TEACHER: { color: "blue", label: "Giáo viên" },
    STUDENT: { color: "green", label: "Học sinh" },
  };
  const t = map[role] ?? { color: "default", label: role };
  return <Tag color={t.color}>{t.label}</Tag>;
};

const taskTag = (status: string) => {
  const map: Record<string, { className: string; label: string }> = {
    "Sắp đến hạn": { className: "dashboard-tag-urgent", label: "Sắp đến hạn" },
    "Đang xử lý": { className: "dashboard-tag-processing", label: "Đang xử lý" },
    "Hoàn thành": { className: "dashboard-tag-done", label: "Hoàn thành" },
  };
  const t = map[status] ?? { className: "", label: status };
  return <Tag className={t.className}>{t.label}</Tag>;
};

// ── Stat Card component ────────────────────────────────
const StatCard = ({
  title,
  value,
  icon,
  color,
  bg,
  sub,
  loading,
}: {
  title: string;
  value: number | string;
  icon: JSX.Element;
  color: string;
  bg: string;
  sub: string;
  loading?: boolean;
}) => (
  <Card bordered={false} style={{ background: bg, border: "none" }} loading={loading} className="!rounded-xl">
    <Space align="start" className="w-full justify-between">
      <div>
        <Text type="secondary" style={{ fontSize: 12 }}>{title}</Text>
        <div className="text-3xl font-bold mt-1" style={{ color }}>{value}</div>
        <Text type="secondary" style={{ fontSize: 11 }}>{sub}</Text>
      </div>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color }}>
        {icon}
      </div>
    </Space>
  </Card>
);

// ── DashboardPage ───────────────────────────────────────
function DashboardPage() {
  const { user } = useUser();
  const isAdmin = user?.role === "ADMIN";
  const isTeacher = user?.role === "TEACHER";

  // ── ADMIN state ─────────────────────────────────────
  const [adminStats, setAdminStats] = useState<AdminStats>({
    totalUsers: 0, totalTeachers: 0, totalStudents: 0, totalAdmins: 0,
    totalClassrooms: 0, pendingAccounts: 0, totalAssignments: 0, totalSubmissions: 0, gradedSubmissions: 0,
  });
  const [monthlyUserStats, setMonthlyUserStats] = useState<MonthlyUserStats[]>([]);
  const [monthlySubmissionStats, setMonthlySubmissionStats] = useState<MonthlySubmissionStats[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);

  // ── TEACHER state ────────────────────────────────────
  const [teacherAssignments, setTeacherAssignments] = useState<AssignmentDto[]>([]);
  const [teacherClassrooms, setTeacherClassrooms] = useState<any[]>([]);
  const [examHistory, setExamHistory] = useState<HistoryResponse[]>([]);
  const [teacherLoading, setTeacherLoading] = useState(false);

  // ── STUDENT state ────────────────────────────────────
  const [studentHistory, setStudentHistory] = useState<HistoryResponse[]>([]);
  const [studentLoading, setStudentLoading] = useState(false);

  // ── Load ADMIN data ─────────────────────────────────
  useEffect(() => {
    if (!isAdmin) return;
    void loadAdminData();
  }, [isAdmin]);

  const loadAdminData = async () => {
    setAdminLoading(true);
    try {
      const [statsRes, monthlyUsersRes, monthlySubmissionsRes, usersRes] = await Promise.all([
        api.get<AdminStats>("/api/admin/stats"),
        api.get<MonthlyUserStats[]>("/api/admin/stats/monthly-users"),
        api.get<MonthlySubmissionStats[]>("/api/admin/stats/monthly-submissions"),
        api.get<UserProfile[]>("/api/admin/users"),
      ]);

      setAdminStats(statsRes.data);
      setMonthlyUserStats(monthlyUsersRes.data);
      setMonthlySubmissionStats(monthlySubmissionsRes.data);
      setRecentUsers(usersRes.data.slice(0, 5).map((u) => ({
        id: u.id,
        fullname: u.fullname,
        email: u.email,
        role: u.role,
      })));
    } catch {
      // fallback: keep empty
    } finally {
      setAdminLoading(false);
    }
  };

  // ── Load TEACHER data ────────────────────────────────
  useEffect(() => {
    if (!isTeacher) return;
    void loadTeacherData();
  }, [isTeacher]);

  const loadTeacherData = async () => {
    setTeacherLoading(true);
    try {
      const [assignmentsRes, classroomsRes, historyRes] = await Promise.all([
        getAssignments(),
        getClassrooms(),
        examApi.getHistory(),
      ]);
      setTeacherAssignments(assignmentsRes);
      setTeacherClassrooms(classroomsRes as any[]);
      setExamHistory(historyRes);
    } catch {
      // fallback
    } finally {
      setTeacherLoading(false);
    }
  };

  // ── Load STUDENT data ────────────────────────────────
  useEffect(() => {
    if (isAdmin || isTeacher) return;
    void loadStudentData();
  }, [isAdmin, isTeacher]);

  const loadStudentData = async () => {
    setStudentLoading(true);
    try {
      const historyRes = await examApi.getHistory();
      setStudentHistory(historyRes);
    } catch {
      // fallback
    } finally {
      setStudentLoading(false);
    }
  };

  // ── ADMIN view ────────────────────────────────────────────────
  if (isAdmin) {
    const adminStatCards = [
      { title: "Tổng tài khoản", value: adminStats.totalUsers, icon: <TeamOutlined />, color: "#3b82f6", bg: "#eff6ff", sub: "Tất cả người dùng" },
      { title: "Học sinh", value: adminStats.totalStudents, icon: <UserAddOutlined />, color: "#10b981", bg: "#f0fdf4", sub: "Tài khoản học sinh" },
      { title: "Giáo viên", value: adminStats.totalTeachers, icon: <UserOutlined />, color: "#8b5cf6", bg: "#f5f3ff", sub: "Tài khoản giáo viên" },
      { title: "Lớp học", value: adminStats.totalClassrooms, icon: <BookOutlined />, color: "#f59e0b", bg: "#fffbeb", sub: "Tổng số lớp" },
    ];

    const pieData = [
      { name: "Học sinh", value: adminStats.totalStudents, color: PIE_COLORS[0] },
      { name: "Giáo viên", value: adminStats.totalTeachers, color: PIE_COLORS[1] },
      { name: "Quản trị", value: adminStats.totalAdmins, color: PIE_COLORS[2] },
    ];

    return (
      <Space direction="vertical" size={20} className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Title level={3} className="!mb-0">Trang quản trị</Title>
            <Text type="secondary">Tổng quan hệ thống và quản lý người dùng</Text>
          </div>
          <Space>
            <Link to="/admin/users">
              <Button icon={<TeamOutlined />}>Danh sách tài khoản</Button>
            </Link>
          </Space>
        </div>

        {/* Stats */}
        <Row gutter={[14, 14]}>
          {adminStatCards.map((item) => (
            <Col xs={12} sm={12} md={6} key={item.title}>
              <StatCard {...item} loading={adminLoading} />
            </Col>
          ))}
        </Row>

        {/* Charts */}
        <Row gutter={[14, 14]}>
          <Col xs={24} lg={15}>
            <Card title={<Space><BarChartOutlined className="text-blue-500" /><span>Thống kê người dùng theo tháng</span></Space>} className="dashboard-surface">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyUserStats} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                    formatter={(value, name) => [value, name === "students" ? "Học sinh" : "Giáo viên"]}
                  />
                  <Legend formatter={(value) => (value === "students" ? "Học sinh" : "Giáo viên")} />
                  <Bar dataKey="students" fill="#10b981" radius={[6, 6, 0, 0]} name="students" />
                  <Bar dataKey="teachers" fill="#3b82f6" radius={[6, 6, 0, 0]} name="teachers" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          <Col xs={24} lg={9}>
            <Card title={<Space><CheckCircleOutlined className="text-emerald-500" /><span>Phân bố vai trò</span></Space>} className="dashboard-surface h-full">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value) => [value, ""]} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                  <Legend formatter={(value) => <span style={{ color: "#475569", fontSize: 13 }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
              {adminStats.pendingAccounts > 0 && (
                <div className="mt-4 p-3 rounded-lg" style={{ background: "#fff7ed", border: "1px solid #fed7aa" }}>
                  <Space>
                    <ClockCircleOutlined style={{ color: "#f59e0b" }} />
                    <Text style={{ fontSize: 13, color: "#92400e" }}>
                      <strong>{adminStats.pendingAccounts}</strong> tài khoản đang chờ xác thực
                    </Text>
                  </Space>
                </div>
              )}
            </Card>
          </Col>
        </Row>

        {/* Stats row 2 */}
        <Row gutter={[14, 14]}>
          {[
            { title: "Bài tập", value: adminStats.totalAssignments, icon: <FileTextOutlined />, color: "#3b82f6", bg: "#eff6ff", sub: "Tổng bài tập" },
            { title: "Bài nộp", value: adminStats.totalSubmissions, icon: <CheckCircleOutlined />, color: "#10b981", bg: "#f0fdf4", sub: "Tổng bài nộp" },
            { title: "Đã chấm", value: adminStats.gradedSubmissions, icon: <CheckCircleOutlined />, color: "#f59e0b", bg: "#fffbeb", sub: "Bài đã có feedback" },
          ].map((item) => (
            <Col xs={12} sm={8} key={item.title}>
              <StatCard {...item} loading={adminLoading} />
            </Col>
          ))}
        </Row>

        {/* Recent users table */}
        <Card
          title={<Space><UserAddOutlined className="text-sky-500" /><span>Tài khoản mới đăng ký</span></Space>}
          extra={<Link to="/admin/users"><Button type="link" style={{ paddingRight: 0 }}>Xem tất cả →</Button></Link>}
          className="dashboard-surface"
        >
          <Table rowKey="id" dataSource={recentUsers} pagination={false} size="middle" loading={adminLoading}
            columns={[
              { title: "ID", dataIndex: "id", key: "id", width: 70, render: (id: number) => <Text type="secondary" className="font-mono">#{id}</Text> },
              { title: "Họ và tên", dataIndex: "fullname", key: "fullname", render: (name: string, record: any) => <Link to={`/admin/users/${record.id}`}><Text strong style={{ color: "#1e40af" }}>{name}</Text></Link> },
              { title: "Email", dataIndex: "email", key: "email" },
              { title: "Vai trò", dataIndex: "role", key: "role", width: 120, render: roleTag },
            ]}
          />
        </Card>
      </Space>
    );
  }

  // ── TEACHER view ────────────────────────────────────────────────
  if (isTeacher) {
    const totalAssignments = teacherAssignments.length;
    const totalQuestions = teacherAssignments.reduce((sum, a) => sum + (a.questions?.length ?? 0), 0);
    const totalClassrooms = teacherClassrooms.length;
    const gradedCount = examHistory.filter((h) => h.teacherFeedback && h.teacherFeedback.trim() !== "").length;
    const submissionCount = examHistory.length;
    const submissionRate = submissionCount > 0 ? Math.round((gradedCount / submissionCount) * 100) : 0;

    const teacherStatCards = [
      { title: "Bài tập đã tạo", value: totalAssignments, icon: <FileTextOutlined />, color: "#3b82f6", bg: "#eff6ff", sub: "Tổng số bài tập" },
      { title: "Câu hỏi", value: totalQuestions, icon: <BookOutlined />, color: "#8b5cf6", bg: "#f5f3ff", sub: "Tổng câu hỏi" },
      { title: "Lớp đang dạy", value: totalClassrooms, icon: <TeamOutlined />, color: "#10b981", bg: "#f0fdf4", sub: "Số lớp phụ trách" },
      { title: "Bài đã chấm", value: gradedCount, icon: <CheckCircleOutlined />, color: "#f59e0b", bg: "#fffbeb", sub: `${submissionCount} bài nộp` },
    ];

    const pieData = [
      { name: "Đã chấm", value: gradedCount, color: "#10b981" },
      { name: "Chưa chấm", value: Math.max(0, submissionCount - gradedCount), color: "#fca5a5" },
    ];

    const recentAssignments = teacherAssignments.slice(0, 5).map((a) => ({
      id: a.id,
      title: a.title,
      questionCount: a.questions?.length ?? 0,
      classroomCount: a.classrooms?.length ?? 0,
    }));

    const TEACHER_TASKS: TaskItem[] = [
      { title: "Chấm bài nộp mới", deadline: "—", status: "Đang xử lý" },
      { title: "Tạo bài tập phát âm mới", deadline: "—", status: "Đang xử lý" },
    ];

    return (
      <Space direction="vertical" size={20} className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Title level={3} className="!mb-0">Trang giáo viên</Title>
            <Text type="secondary">Tổng quan bài tập, lớp học và tiến độ sinh viên</Text>
          </div>
          <Space>
            <Link to="/teacher/assignments">
              <Button type="primary" icon={<FileTextOutlined />}>Quản lý bài tập</Button>
            </Link>
            <Link to="/classrooms">
              <Button icon={<TeamOutlined />}>Danh sách lớp</Button>
            </Link>
          </Space>
        </div>

        {/* Stats */}
        <Row gutter={[14, 14]}>
          {teacherStatCards.map((item) => (
            <Col xs={12} sm={12} md={6} key={item.title}>
              <StatCard {...item} loading={teacherLoading} />
            </Col>
          ))}
        </Row>

        {/* Charts */}
        <Row gutter={[14, 14]}>
          <Col xs={24} lg={14}>
            <Card title={<Space><LineChartOutlined className="text-blue-500" /><span>Bài tập &amp; bài nộp theo tháng</span></Space>} className="dashboard-surface">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={monthlySubmissionStats} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                    formatter={(value, name) => [value, name === "assignments" ? "Bài tập" : "Bài nộp"]}
                  />
                  <Legend formatter={(value) => <span style={{ color: "#475569", fontSize: 13 }}>{value === "assignments" ? "Bài tập đã tạo" : "Bài nộp"}</span>} />
                  <Line type="monotone" dataKey="assignments" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: "#3b82f6" }} name="assignments" />
                  <Line type="monotone" dataKey="submissions" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: "#10b981" }} name="submissions" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          <Col xs={24} lg={10}>
            <Card title={<Space><BarChartOutlined className="text-emerald-500" /><span>Tỷ lệ chấm bài</span></Space>} className="dashboard-surface h-full">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value) => [value, ""]} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                  <Legend formatter={(value) => <span style={{ color: "#475569", fontSize: 13 }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4">
                <Space className="w-full justify-between mb-2">
                  <Text type="secondary" style={{ fontSize: 12 }}>Tỷ lệ chấm bài</Text>
                  <Text strong style={{ color: "#10b981", fontSize: 15 }}>{submissionRate}%</Text>
                </Space>
                <Progress percent={submissionRate} showInfo={false} strokeColor="#10b981" trailColor="#fca5a5" size="small" />
              </div>
            </Card>
          </Col>
        </Row>

        {/* Assignments table & Tasks */}
        <Row gutter={[14, 14]}>
          <Col xs={24} xl={14}>
            <Card
              title={<Space><FileTextOutlined className="text-sky-500" /><span>Bài tập gần đây</span></Space>}
              extra={<Link to="/teacher/assignments"><Button type="link" style={{ paddingRight: 0 }}>Quản lý →</Button></Link>}
              className="dashboard-surface"
            >
              <Table
                rowKey="id"
                dataSource={recentAssignments}
                pagination={false}
                size="small"
                loading={teacherLoading}
                locale={{ emptyText: "Chưa có bài tập nào" }}
                columns={[
                  { title: "ID", dataIndex: "id", key: "id", width: 60, render: (id: number) => <Text type="secondary" className="font-mono">#{id}</Text> },
                  { title: "Tiêu đề", dataIndex: "title", key: "title", render: (title: string) => <Text strong>{title || "—"}</Text> },
                  { title: "Câu hỏi", dataIndex: "questionCount", key: "questionCount", width: 90, align: "center" as const, render: (n: number) => <Tag color="blue">{n} câu</Tag> },
                  { title: "Lớp", dataIndex: "classroomCount", key: "classroomCount", width: 80, align: "center" as const, render: (n: number) => <Tag color="cyan">{n} lớp</Tag> },
                ]}
              />
            </Card>
          </Col>

          <Col xs={24} xl={10}>
            <Card title={<Space><NotificationOutlined className="text-sky-500" /><span>Công việc cần xử lý</span></Space>} className="dashboard-surface">
              <List
                itemLayout="horizontal"
                dataSource={TEACHER_TASKS}
                locale={{ emptyText: "Không có công việc nào" }}
                renderItem={(task: TaskItem) => (
                  <List.Item className="dashboard-task-item">
                    <List.Item.Meta
                      avatar={
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: task.status === "Hoàn thành" ? "#f0fdf4" : task.status === "Sắp đến hạn" ? "#fff1f2" : "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <ClockCircleOutlined style={{ fontSize: 16, color: task.status === "Hoàn thành" ? "#16a34a" : task.status === "Sắp đến hạn" ? "#e11d48" : "#b45309" }} />
                        </div>
                      }
                      title={<span className="dashboard-task-title">{task.title}</span>}
                      description={<Text className="dashboard-task-deadline">{task.deadline}</Text>}
                    />
                    {taskTag(task.status)}
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      </Space>
    );
  }

  // ── STUDENT view ────────────────────────────────────────────────
  const doneCount = studentHistory.filter((h) => h.totalScore > 0).length;
  const totalExams = studentHistory.length;
  const avgScore = totalExams > 0 ? studentHistory.reduce((sum: number, h: HistoryResponse) => sum + (h.totalScore ?? 0), 0) / totalExams : 0;
  const gradedCount = studentHistory.filter((h) => h.teacherFeedback && h.teacherFeedback.trim() !== "").length;

  const studentStatCards = [
    { title: "Bài đã làm", value: totalExams, icon: <CheckCircleOutlined />, color: "#10b981", bg: "#f0fdf4", sub: "Bài thi & bài tập" },
    { title: "Bài đã nộp", value: doneCount, icon: <FileTextOutlined />, color: "#3b82f6", bg: "#eff6ff", sub: "Tổng số bài" },
    { title: "Điểm trung bình", value: totalExams > 0 ? avgScore.toFixed(1) : "—", icon: <BarChartOutlined />, color: "#8b5cf6", bg: "#f5f3ff", sub: "Trên thang 10" },
    { title: "Feedback nhận", value: gradedCount, icon: <NotificationOutlined />, color: "#f59e0b", bg: "#fffbeb", sub: "Phản hồi từ giáo viên" },
  ];

  const recentExams = studentHistory.slice(0, 5).map((h) => ({
    id: h.submissionId,
    title: h.examTitle,
    score: h.totalScore,
    date: new Date(h.submitTime).toLocaleDateString("vi-VN"),
    hasFeedback: !!(h.teacherFeedback && h.teacherFeedback.trim() !== ""),
  }));

  const studentTasks: TaskItem[] = [
    { title: "Hoàn thành các bài tập còn lại", deadline: "—", status: "Đang xử lý" },
    { title: "Xem phản hồi từ giáo viên", deadline: "—", status: "Đang xử lý" },
  ];

  const studentProgress = totalExams > 0 ? Math.round((doneCount / totalExams) * 100) : 0;

  return (
    <Space direction="vertical" size={20} className="w-full">
      {/* Hero Banner */}
      <Card bordered={false} className="dashboard-hero !rounded-2xl !border-0 !shadow-lg">
        <Row align="middle" justify="space-between" gutter={[16, 16]}>
          <Col xs={24} xl={15}>
            <Space direction="vertical" size={8}>
              <Title level={2} className="dashboard-hero__title !mb-0">
                Xin chào {user?.fullname || "bạn"}!
              </Title>
              <Paragraph className="dashboard-hero__sub !mb-0">
                Ưu tiên xử lý các mục sắp đến hạn, theo dõi tiến độ và đi thẳng vào các thao tác quan trọng.
              </Paragraph>
            </Space>
          </Col>
          <Col xs={24} xl={9} className="text-left xl:text-right">
            <Space wrap className="justify-start xl:justify-end">
              <Link to="/profile">
                <Button size="large" icon={<BookOutlined />} className="dashboard-hero__btn">
                  Hồ sơ cá nhân
                </Button>
              </Link>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* KPI Stats */}
      <Row gutter={[14, 14]}>
        {studentStatCards.map((item) => (
          <Col xs={12} sm={12} md={6} key={item.title}>
            <StatCard {...item} loading={studentLoading} />
          </Col>
        ))}
      </Row>

      {/* Exam history table & Tasks */}
      <Row gutter={[14, 14]}>
        <Col xs={24} xl={14}>
          <Card
            title={<Space><FileTextOutlined className="text-sky-500" /><span>Lịch sử bài làm gần đây</span></Space>}
            extra={<Link to="/exams/history"><Button type="link" style={{ paddingRight: 0 }}>Xem tất cả →</Button></Link>}
            className="dashboard-surface"
          >
            <Table
              rowKey="id"
              dataSource={recentExams}
              pagination={false}
              size="small"
              loading={studentLoading}
              locale={{ emptyText: "Chưa có bài làm nào" }}
              columns={[
                { title: "ID", dataIndex: "id", key: "id", width: 60, render: (id: number) => <Text type="secondary" className="font-mono">#{id}</Text> },
                { title: "Tên bài", dataIndex: "title", key: "title", render: (title: string) => <Text strong>{title || "—"}</Text> },
                { title: "Điểm", dataIndex: "score", key: "score", width: 80, align: "center" as const, render: (s: number) => <Text strong style={{ color: s >= 8 ? "#10b981" : s >= 5 ? "#f59e0b" : "#ef4444" }}>{s}</Text> },
                { title: "Ngày", dataIndex: "date", key: "date", width: 100, render: (d: string) => <Text type="secondary">{d}</Text> },
                {
                  title: "Feedback",
                  key: "hasFeedback",
                  width: 100,
                  align: "center" as const,
                  render: (hasFeedback: boolean) => hasFeedback
                    ? <Tag color="green">Có</Tag>
                    : <Tag color="default">—</Tag>,
                },
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} xl={10}>
          <Space direction="vertical" size={14} className="w-full">
            <Card title={<Space size={8}><BarChartOutlined className="text-sky-500" /><span>Tiến độ chung</span></Space>} className="dashboard-surface">
              <Space direction="vertical" className="w-full" size={16}>
                <div>
                  <Space className="w-full justify-between mb-2">
                    <Text type="secondary" style={{ fontSize: 12 }}>Tổng tiến độ hoàn thành</Text>
                    <Text strong style={{ color: "#0ea5e9", fontSize: 15 }}>{studentProgress}%</Text>
                  </Space>
                  <Progress percent={studentProgress} showInfo={false} strokeColor={{ "0%": "#0ea5e9", "100%": "#0284c7" }} className="dashboard-progress" size="default" />
                </div>

                <Card size="small" className="dashboard-info-box">
                  <Space align="start" size={10}>
                    <CheckCircleOutlined className="text-emerald-500 mt-0.5" style={{ fontSize: 16 }} />
                    <div>
                      <Text strong style={{ fontSize: 13 }}>Đạt mục tiêu tuần này</Text>
                      <Paragraph type="secondary" className="!mb-0" style={{ fontSize: 12, lineHeight: 1.5 }}>
                        Tiến độ đang ở mức ổn định. Bạn có thể ưu tiên thao tác trong danh sách bên trái.
                      </Paragraph>
                    </div>
                  </Space>
                </Card>

                <Card size="small" className="dashboard-info-box">
                  <Space align="start" size={10}>
                    <FileTextOutlined className="text-indigo-500 mt-0.5" style={{ fontSize: 16 }} />
                    <div>
                      <Text strong style={{ fontSize: 13 }}>Gợi ý hành động nhanh</Text>
                      <Paragraph type="secondary" className="!mb-0" style={{ fontSize: 12, lineHeight: 1.5 }}>
                        Mở dashboard mỗi ngày để theo dõi deadline và tình trạng chấm bài theo thời gian thực.
                      </Paragraph>
                    </div>
                  </Space>
                </Card>
              </Space>
            </Card>

            {/* Tasks */}
            <Card title={<Space><NotificationOutlined className="text-sky-500" /><span>Công việc cần xử lý</span></Space>} className="dashboard-surface">
              <List
                itemLayout="horizontal"
                dataSource={studentTasks}
                locale={{ emptyText: "Không có công việc nào" }}
                renderItem={(task: TaskItem) => (
                  <List.Item className="dashboard-task-item">
                    <List.Item.Meta
                      avatar={
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: task.status === "Hoàn thành" ? "#f0fdf4" : "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <ClockCircleOutlined style={{ fontSize: 16, color: task.status === "Hoàn thành" ? "#16a34a" : "#b45309" }} />
                        </div>
                      }
                      title={<span className="dashboard-task-title">{task.title}</span>}
                    />
                    {taskTag(task.status)}
                  </List.Item>
                )}
              />
            </Card>
          </Space>
        </Col>
      </Row>

      <style>{`
        @keyframes dashboard-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </Space>
  );
}

export default DashboardPage;
