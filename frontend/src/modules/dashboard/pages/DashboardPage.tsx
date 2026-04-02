import {
  BarChartOutlined,
  ArrowRightOutlined,
  BookOutlined,
  CheckSquareOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  NotificationOutlined,
  RiseOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import type { ReactNode } from "react";
import { Button, Card, Col, List, Progress, Row, Space, Statistic, Tag, Typography } from "antd";
import { Link } from "react-router-dom";
import { useUser } from "@/context/authContext";
import type { UserRole } from "@/types/user";

const { Paragraph, Text, Title } = Typography;

type KpiItem = {
  title: string;
  value: number | string;
  suffix?: string;
  icon: ReactNode;
};

type TaskItem = {
  title: string;
  deadline: string;
  status: "Sap den han" | "Dang xu ly" | "Hoan thanh";
};

const kpiByRole: Record<UserRole, KpiItem[]> = {
  ADMIN: [
    { title: "Tong tai khoan", value: 238, icon: <TeamOutlined /> },
    { title: "Lop dang hoat dong", value: 26, icon: <BookOutlined /> },
    { title: "Bai tap da tao", value: 174, icon: <CheckSquareOutlined /> },
    { title: "Ty le nop bai", value: 91, suffix: "%", icon: <RiseOutlined /> },
  ],
  TEACHER: [
    { title: "Lop phu trach", value: 8, icon: <BookOutlined /> },
    { title: "Bai tap da giao", value: 41, icon: <CheckSquareOutlined /> },
    { title: "Bai can cham", value: 17, icon: <FileTextOutlined /> },
    { title: "Ty le hoan thanh", value: 88, suffix: "%", icon: <RiseOutlined /> },
  ],
  STUDENT: [
    { title: "Bai da lam", value: 36, icon: <CheckSquareOutlined /> },
    { title: "Bai chua lam", value: 9, icon: <ClockCircleOutlined /> },
    { title: "Diem trung binh", value: 8.3, icon: <BarChartOutlined /> },
    { title: "Ty le dung han", value: 93, suffix: "%", icon: <RiseOutlined /> },
  ],
};

const tasksByRole: Record<UserRole, TaskItem[]> = {
  ADMIN: [
    { title: "Kiem tra tai khoan moi dang ky", deadline: "Hom nay 17:00", status: "Sap den han" },
    { title: "Ra soat thong bao he thong", deadline: "Ngay mai 09:00", status: "Dang xu ly" },
    { title: "Tong hop bao cao tuan", deadline: "Thu 6 16:00", status: "Dang xu ly" },
  ],
  TEACHER: [
    { title: "Cham bai lop ENG-101", deadline: "Hom nay 21:00", status: "Sap den han" },
    { title: "Tao assignment phat am", deadline: "Ngay mai 10:00", status: "Dang xu ly" },
    { title: "Gui feedback cho lop ENG-205", deadline: "Thu 5 15:00", status: "Dang xu ly" },
  ],
  STUDENT: [
    { title: "Nop bai grammar unit 5", deadline: "Hom nay 23:59", status: "Sap den han" },
    { title: "Luyen phat am bai 3", deadline: "Ngay mai 20:00", status: "Dang xu ly" },
    { title: "On tap vocabulary quiz", deadline: "Thu 4 19:00", status: "Hoan thanh" },
  ],
};

const progressByRole: Record<UserRole, number> = {
  ADMIN: 84,
  TEACHER: 78,
  STUDENT: 81,
};

const activityFeed = [
  "He thong da cap nhat thong ke 10 phut truoc",
  "2 bai tap moi vua duoc giao trong ngay",
  "1 thong bao nhac han nop bai da gui cho sinh vien",
];

function getStatusColor(status: TaskItem["status"]) {
  if (status === "Sap den han") {
    return "red";
  }
  if (status === "Dang xu ly") {
    return "gold";
  }
  return "green";
}

function DashboardPage() {
  const { user } = useUser();
  const role = user?.role ?? "STUDENT";
  const kpis = kpiByRole[role];
  const tasks = tasksByRole[role];
  const progress = progressByRole[role];

  return (
    <Space direction="vertical" size={20} className="w-full">
      <Card
        bordered={false}
        className="dashboard-hero !rounded-2xl !border-0 !shadow-md"
      >
        <Row align="middle" justify="space-between" gutter={[16, 16]}>
          <Col xs={24} xl={16}>
            <Space direction="vertical" size={6}>
              <Text className="!text-slate-200">Tong quan hoc tap va van hanh</Text>
              <Title level={3} className="!mb-0 !text-slate-50">
                Xin chao {user?.fullname || "ban"}, day la trung tam dieu phoi hom nay
              </Title>
              <Paragraph className="!mb-0 !text-slate-300">
                Uu tien xu ly cac muc sap den han, theo doi tien do va di thang vao cac thao tac quan trong.
              </Paragraph>
            </Space>
          </Col>
          <Col xs={24} xl={8}>
            <Space wrap>
              <Link to="/profile">
                <Button size="large" icon={<BookOutlined />}>
                  Ho so ca nhan
                </Button>
              </Link>
              {role === "ADMIN" && (
                <Link to="/admin/users">
                  <Button size="large" type="primary" icon={<TeamOutlined />}>
                    Quan ly tai khoan
                  </Button>
                </Link>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        {kpis.map((item) => (
          <Col xs={24} sm={12} xl={6} key={item.title}>
            <Card className="dashboard-stat-card !rounded-xl shadow-sm" bordered={false}>
              <Space align="start" className="w-full justify-between">
                <Statistic title={item.title} value={item.value} suffix={item.suffix} />
                <span className="dashboard-stat-icon">{item.icon}</span>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card
            title="Viec can xu ly"
            className="dashboard-surface !rounded-xl shadow-sm"
            extra={
              <Space>
                <NotificationOutlined />
                <Text type="secondary">Cap nhat moi nhat</Text>
              </Space>
            }
          >
            <List
              itemLayout="horizontal"
              dataSource={tasks}
              renderItem={(task) => (
                <List.Item
                  actions={[
                    <Tag color={getStatusColor(task.status)} key={`${task.title}-status`}>
                      {task.status}
                    </Tag>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<ClockCircleOutlined className="text-slate-500" />}
                    title={task.title}
                    description={`Han: ${task.deadline}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card title="Tien do chung" className="dashboard-surface !rounded-xl shadow-sm">
            <Space direction="vertical" className="w-full" size={18}>
              <Progress
                percent={progress}
                strokeColor={{
                  "0%": "#0ea5e9",
                  "100%": "#2563eb",
                }}
              />
              <Card size="small" className="!rounded-lg !bg-slate-50">
                <Space align="start">
                  <CheckCircleOutlined className="text-emerald-600 mt-1" />
                  <div>
                    <Text strong>Dat muc tieu tuan nay</Text>
                    <Paragraph type="secondary" className="!mb-0">
                      Tien do dang o muc on dinh. Ban co the uu tien thao tac trong danh sach ben trai.
                    </Paragraph>
                  </div>
                </Space>
              </Card>
              <Card size="small" className="!rounded-lg !bg-slate-50">
                <Space align="start">
                  <FileTextOutlined className="text-indigo-600 mt-1" />
                  <div>
                    <Text strong>Goi y hanh dong nhanh</Text>
                    <Paragraph type="secondary" className="!mb-0">
                      Mo dashboard moi ngay de theo doi deadline va tinh trang cham bai theo thoi gian thuc.
                    </Paragraph>
                  </div>
                </Space>
              </Card>
              <List
                size="small"
                header={<Text strong>Hoat dong gan day</Text>}
                dataSource={activityFeed}
                renderItem={(item) => <List.Item>{item}</List.Item>}
              />
            </Space>
          </Card>
        </Col>
      </Row>

      <Card bordered={false} className="dashboard-quick !rounded-xl !shadow-md">
        <Row align="middle" justify="space-between" gutter={[12, 12]}>
          <Col xs={24} lg={18}>
            <Space direction="vertical" size={4}>
              <Text className="!text-slate-500">Quick actions</Text>
              <Title level={5} className="!mb-0 !text-slate-900">
                Di den khu vuc can thao tac nhanh trong 1 click
              </Title>
            </Space>
          </Col>
          <Col xs={24} lg={6} className="text-left lg:text-right">
            <Space wrap>
              <Link to="/profile">
                <Button type="default">Cap nhat ho so</Button>
              </Link>
              {role === "ADMIN" && (
                <Link to="/admin/users">
                  <Button type="primary" icon={<ArrowRightOutlined />}>
                    Mo quan tri
                  </Button>
                </Link>
              )}
            </Space>
          </Col>
        </Row>
        <Row gutter={[12, 12]} className="mt-4">
          <Col xs={24} md={8}>
            <Link to="/profile" className="dashboard-action-tile">
              <BookOutlined />
              <span>Mo ho so va cap nhat thong tin</span>
            </Link>
          </Col>
          <Col xs={24} md={8}>
            <div className="dashboard-action-tile">
              <ClockCircleOutlined />
              <span>Kiem tra han nop bai trong ngay</span>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div className="dashboard-action-tile">
              <NotificationOutlined />
              <span>Theo doi thong bao moi tu he thong</span>
            </div>
          </Col>
        </Row>
      </Card>
    </Space>
  );
}

export default DashboardPage;
