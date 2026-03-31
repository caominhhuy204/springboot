import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, Empty, Form, Input, InputNumber, List, Modal, Progress, Row, Segmented, Skeleton, Space, Statistic, Table, Tag, Typography, Upload, message } from "antd";
import { AudioOutlined, InboxOutlined, RiseOutlined, SoundOutlined, UploadOutlined } from "@ant-design/icons";
import { Link, useParams } from "react-router-dom";
import type { UploadFile } from "antd/es/upload/interface";
import api from "@/utils/axiosClient";
import { useUser } from "@/context/authContext";
import type { PronunciationExercise, PronunciationReviewPayload, PronunciationSubmission } from "@/types/pronunciation";

const { Paragraph, Text, Title } = Typography;

async function getAudioDuration(file: File): Promise<number> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const duration = await new Promise<number>((resolve, reject) => {
      const audio = document.createElement("audio");
      audio.preload = "metadata";
      audio.onloadedmetadata = () => resolve(audio.duration);
      audio.onerror = () => reject(new Error("Khong the doc metadata cua audio"));
      audio.src = objectUrl;
    });

    return Number.isFinite(duration) ? duration : 0;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "--";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getScoreColor(value: number) {
  if (value >= 80) {
    return "#16a34a";
  }
  if (value >= 60) {
    return "#d97706";
  }
  return "#dc2626";
}

function PronunciationExerciseDetailPage() {
  const { classroomId, exerciseId } = useParams();
  const { user } = useUser();
  const numericExerciseId = Number(exerciseId);
  const numericClassroomId = Number(classroomId);
  const isStudent = user?.role === "STUDENT";

  const [exercise, setExercise] = useState<PronunciationExercise | null>(null);
  const [submissions, setSubmissions] = useState<PronunciationSubmission[]>([]);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewingSubmission, setReviewingSubmission] = useState<PronunciationSubmission | null>(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewFilter, setReviewFilter] = useState<"ALL" | "PENDING" | "REVIEWED">("ALL");
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "ready">("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedPreviewUrl, setRecordedPreviewUrl] = useState<string | null>(null);
  const [reviewForm] = Form.useForm<PronunciationReviewPayload>();

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [exerciseRes, submissionsRes] = await Promise.all([
        api.get<PronunciationExercise>(`/api/pronunciation/exercises/${numericExerciseId}`),
        api.get<PronunciationSubmission[]>(`/api/pronunciation/exercises/${numericExerciseId}/submissions`),
      ]);

      setExercise(exerciseRes.data);
      setSubmissions(submissionsRes.data);
    } catch {
      setError("Khong the tai du lieu bai phat am.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!Number.isFinite(numericExerciseId)) {
      return;
    }

    void loadData();
  }, [numericExerciseId]);

  const latestSubmission = submissions[0] ?? null;
  const canReview = user?.role === "ADMIN" || user?.role === "TEACHER";
  const pendingCount = submissions.filter((submission) => submission.reviewStatus === "PENDING").length;
  const reviewedCount = submissions.filter((submission) => submission.reviewStatus === "REVIEWED").length;

  const groupedSubmissions = useMemo(() => {
    if (isStudent) {
      return submissions;
    }

    if (reviewFilter === "PENDING") {
      return submissions.filter((submission) => submission.reviewStatus === "PENDING");
    }

    if (reviewFilter === "REVIEWED") {
      return submissions.filter((submission) => submission.reviewStatus === "REVIEWED");
    }

    return submissions;
  }, [isStudent, reviewFilter, submissions]);

  const openReviewModal = (submission: PronunciationSubmission) => {
    setReviewingSubmission(submission);
    reviewForm.setFieldsValue({
      teacherScore: submission.teacherScore ?? submission.autoOverallScore,
      teacherFeedback: submission.teacherFeedback ?? submission.autoFeedback,
    });
    setReviewModalOpen(true);
  };

  const handleReviewSubmit = async () => {
    if (!reviewingSubmission) {
      return;
    }

    const values = await reviewForm.validateFields();
    setReviewSubmitting(true);

    try {
      await api.put(`/api/pronunciation/submissions/${reviewingSubmission.id}/review`, values);
      message.success("Da luu diem va nhan xet cua giao vien");
      setReviewModalOpen(false);
      setReviewingSubmission(null);
      reviewForm.resetFields();
      await loadData();
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      message.error("Chon mot file audio truoc khi nop");
      return;
    }

    setSubmitting(true);
    try {
      const durationSeconds = await getAudioDuration(selectedFile);
      const formData = new FormData();
      formData.append("audio", selectedFile);
      formData.append("durationSeconds", durationSeconds.toString());

      await api.post(`/api/pronunciation/exercises/${numericExerciseId}/submissions`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      message.success("Da nop bai phat am");
      clearSelectedAudio();
      await loadData();
    } catch (submitError: any) {
      const errorMessage = submitError?.response?.data?.message ?? "Khong the nop bai phat am";
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (recordingState !== "recording") {
      return;
    }

    const interval = window.setInterval(() => {
      setRecordingTime((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [recordingState]);

  useEffect(() => {
    return () => {
      if (recordedPreviewUrl) {
        URL.revokeObjectURL(recordedPreviewUrl);
      }
    };
  }, [recordedPreviewUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType || "audio/webm" });
        const recordedFile = new File([blob], `recording-${Date.now()}.webm`, {
          type: blob.type || "audio/webm",
        });

        if (recordedPreviewUrl) {
          URL.revokeObjectURL(recordedPreviewUrl);
        }

        const previewUrl = URL.createObjectURL(blob);
        setRecordedPreviewUrl(previewUrl);
        setSelectedFile(recordedFile);
        setFileList([
          {
            uid: String(Date.now()),
            name: recordedFile.name,
            status: "done",
            size: recordedFile.size,
            type: recordedFile.type,
            originFileObj: recordedFile as unknown as UploadFile["originFileObj"],
          },
        ]);
        setRecordingState("ready");
        stream.getTracks().forEach((track) => track.stop());
      };

      (window as Window & { pronunciationRecorder?: MediaRecorder }).pronunciationRecorder = mediaRecorder;
      setRecordingTime(0);
      setRecordingState("recording");
      mediaRecorder.start();
    } catch {
      message.error("Khong the truy cap microphone. Hay kiem tra quyen ghi am.");
    }
  };

  const stopRecording = () => {
    const recorder = (window as Window & { pronunciationRecorder?: MediaRecorder }).pronunciationRecorder;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  };

  const clearSelectedAudio = () => {
    setSelectedFile(null);
    setFileList([]);
    setRecordingState("idle");
    setRecordingTime(0);
    if (recordedPreviewUrl) {
      URL.revokeObjectURL(recordedPreviewUrl);
      setRecordedPreviewUrl(null);
    }
  };

  if (!exercise && !loading) {
    return <Empty description="Khong tim thay bai phat am" />;
  }

  const exerciseData = exercise;

  return (
    <Space direction="vertical" size={16} className="w-full">
      <Card className="pronunciation-hero !rounded-3xl !border-0">
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} xl={15}>
            <Space direction="vertical" size={12} className="w-full">
              <Link to={`/classrooms/${numericClassroomId}/pronunciation`} className="!text-cyan-100">
                Quay lai danh sach bai phat am
              </Link>
              <span className="pronunciation-hero__eyebrow">
                <SoundOutlined />
                Exercise detail
              </span>
              <Title level={2} className="!mb-0 !text-cyan-50">
                {exerciseData?.title ?? "Dang tai bai luyen"}
              </Title>
              <Paragraph className="!mb-0 !text-cyan-100">
                Luyen theo cau mau, ghi am nhanh va theo doi ket qua cham bai trong cung mot man hinh.
              </Paragraph>
              <div className="flex flex-wrap gap-2">
                <span className="pronunciation-pill">
                  <AudioOutlined />
                  Do kho {exerciseData?.difficultyLevel ?? 0}/5
                </span>
                <span className="pronunciation-pill">
                  <UploadOutlined />
                  Toi da {exerciseData?.maxAttempts ?? 0} lan nop
                </span>
              </div>
            </Space>
          </Col>
          <Col xs={24} xl={9}>
            <Row gutter={[12, 12]}>
              <Col span={12}>
                <Card bordered={false} className="pronunciation-metric">
                  <Statistic title="Tong bai nop" value={submissions.length} prefix={<RiseOutlined />} />
                </Card>
              </Col>
              <Col span={12}>
                <Card bordered={false} className="pronunciation-metric">
                  <Statistic title="Cho cham" value={pendingCount} prefix={<SoundOutlined />} />
                </Card>
              </Col>
              <Col span={24}>
                <Card bordered={false} className="pronunciation-metric">
                  <Statistic title="Da cham" value={reviewedCount} prefix={<AudioOutlined />} />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {error && <Alert type="error" showIcon message={error} />}

      {loading ? (
        <Card className="pronunciation-panel !rounded-2xl">
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} xl={10}>
              <Card className="pronunciation-panel !rounded-3xl">
                <Space direction="vertical" size={14} className="w-full">
                  <Space wrap>
                    <Tag color="blue">Do kho {exerciseData?.difficultyLevel}/5</Tag>
                    <Tag color="gold">Toi da {exerciseData?.maxAttempts} lan nop</Tag>
                    <Tag color="green">{submissions.length} bai nop</Tag>
                  </Space>
                  <Title level={3} className="!mb-0">
                    {exerciseData?.title}
                  </Title>
                  <Card size="small" className="!rounded-2xl !border-cyan-100 !bg-cyan-50">
                    <Text strong>Cau mau</Text>
                    <Paragraph className="!mb-0 !mt-2 !text-slate-700">
                      {exerciseData?.referenceText}
                    </Paragraph>
                  </Card>
                  {exerciseData?.focusSkill && (
                    <Alert
                      type="info"
                      showIcon
                      message={`Ky nang trong tam: ${exerciseData.focusSkill}`}
                    />
                  )}
                  {exerciseData?.description && (
                    <Paragraph className="!mb-0 !text-slate-600">{exerciseData.description}</Paragraph>
                  )}
                  <Text type="secondary">
                    Tao boi {exerciseData?.createdByName} luc {formatDateTime(exerciseData?.createdAt)}
                  </Text>
                </Space>
              </Card>

              {isStudent && (
                <Card title="Ghi am va nop bai" className="pronunciation-panel !rounded-3xl mt-4">
                  <Form layout="vertical">
                    <Space direction="vertical" size={14} className="w-full">
                      <div className="pronunciation-recorder p-4">
                        <Space direction="vertical" size={12} className="w-full">
                          <Space wrap>
                            <Button
                              icon={<AudioOutlined />}
                              type={recordingState === "recording" ? "default" : "primary"}
                              danger={recordingState === "recording"}
                              onClick={() => void (recordingState === "recording" ? stopRecording() : startRecording())}
                            >
                              {recordingState === "recording" ? "Dung ghi am" : "Bat dau ghi am"}
                            </Button>
                            {(selectedFile || recordedPreviewUrl) && (
                              <Button onClick={clearSelectedAudio}>Xoa audio da chon</Button>
                            )}
                          </Space>
                          {recordingState === "recording" && (
                            <span className="pronunciation-recording-live">
                              Dang ghi {recordingTime}s
                            </span>
                          )}
                          <Text type="secondary">
                            Ban co the ghi am truc tiep tu trinh duyet hoac tai len file audio co san.
                          </Text>
                        </Space>
                      </div>

                      <Upload.Dragger
                        accept="audio/*"
                        beforeUpload={(file) => {
                          if (recordedPreviewUrl) {
                            URL.revokeObjectURL(recordedPreviewUrl);
                            setRecordedPreviewUrl(null);
                          }
                          setSelectedFile(file);
                          setRecordingState("ready");
                          setFileList([
                            {
                              uid: file.uid,
                              name: file.name,
                              status: "done",
                              size: file.size,
                              type: file.type,
                              originFileObj: file,
                            },
                          ]);
                          return false;
                        }}
                        fileList={fileList}
                        maxCount={1}
                        onRemove={() => {
                          clearSelectedAudio();
                        }}
                      >
                        <p className="ant-upload-drag-icon">
                          <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">Keo tha hoac chon file audio</p>
                        <p className="ant-upload-hint">Ho tro file ghi am tu trinh duyet hoac file upload thu cong.</p>
                      </Upload.Dragger>

                      {recordedPreviewUrl && (
                        <div>
                          <Text type="secondary">Nghe lai ban ghi truoc khi nop</Text>
                          <audio controls src={recordedPreviewUrl} className="w-full mt-2" />
                        </div>
                      )}

                      <Button type="primary" size="large" onClick={() => void handleSubmit()} loading={submitting}>
                        Nop bai phat am
                      </Button>
                    </Space>
                  </Form>
                </Card>
              )}
            </Col>

            <Col xs={24} xl={14}>
              {isStudent && latestSubmission && (
                <Card title="Ket qua gan nhat" className="pronunciation-panel !rounded-3xl mb-4">
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <Card bordered={false} className="pronunciation-metric">
                        <Statistic
                          title="Diem giao vien"
                          value={latestSubmission.reviewStatus === "REVIEWED" ? latestSubmission.teacherScore ?? 0 : 0}
                          valueStyle={{
                            color:
                              latestSubmission.reviewStatus === "REVIEWED"
                                ? getScoreColor(latestSubmission.teacherScore ?? 0)
                                : "#0f172a",
                          }}
                          suffix={latestSubmission.reviewStatus === "REVIEWED" ? "/100" : "Cho cham"}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} md={12}>
                      <Card bordered={false} className="pronunciation-metric h-full">
                        <Space direction="vertical" size={10}>
                          <Tag color={latestSubmission.reviewStatus === "REVIEWED" ? "green" : "orange"}>
                            {latestSubmission.reviewStatus === "REVIEWED" ? "Da giao vien cham" : "Dang cho giao vien cham"}
                          </Tag>
                          <Text type="secondary">
                            Nop luc {formatDateTime(latestSubmission.submittedAt)}
                          </Text>
                        </Space>
                      </Card>
                    </Col>
                  </Row>
                  <Space direction="vertical" size={12} className="w-full mt-4">
                    {latestSubmission.reviewStatus === "PENDING" && (
                      <>
                        <div>
                          <Text>Auto completeness</Text>
                          <Progress percent={latestSubmission.autoCompletenessScore} />
                        </div>
                        <div>
                          <Text>Auto fluency</Text>
                          <Progress percent={latestSubmission.autoFluencyScore} strokeColor="#f59e0b" />
                        </div>
                        <div>
                          <Text>Auto consistency</Text>
                          <Progress percent={latestSubmission.autoConsistencyScore} strokeColor="#22c55e" />
                        </div>
                      </>
                    )}
                    <Alert
                      type={latestSubmission.reviewStatus === "REVIEWED" ? "success" : "info"}
                      showIcon
                      message={
                        latestSubmission.reviewStatus === "REVIEWED"
                          ? (latestSubmission.teacherFeedback || "Giao vien da cham diem.")
                          : "Bai nop da duoc ghi nhan va dang cho giao vien cham."
                      }
                    />
                  </Space>
                </Card>
              )}

              <Card
                title={isStudent ? "Lich su nop bai" : "Danh sach bai nop"}
                className="pronunciation-panel !rounded-3xl"
                extra={!isStudent && (
                  <Segmented
                    value={reviewFilter}
                    onChange={(value) => setReviewFilter(value as "ALL" | "PENDING" | "REVIEWED")}
                    options={[
                      { label: `Tat ca (${submissions.length})`, value: "ALL" },
                      { label: `Cho cham (${pendingCount})`, value: "PENDING" },
                      { label: `Da cham (${reviewedCount})`, value: "REVIEWED" },
                    ]}
                  />
                )}
              >
                {groupedSubmissions.length === 0 ? (
                  <Empty description="Chua co bai nop nao" />
                ) : isStudent ? (
                  <List
                    dataSource={groupedSubmissions}
                    renderItem={(submission) => (
                      <List.Item className="pronunciation-submission-item">
                        <Space direction="vertical" size={8} className="w-full">
                          <Space wrap>
                            <Tag color="blue">Lan {submission.attemptNumber}</Tag>
                            <Tag color={submission.reviewStatus === "REVIEWED" ? "green" : "orange"}>
                              {submission.reviewStatus === "REVIEWED" ? "Da cham" : "Cho cham"}
                            </Tag>
                            <Tag color="cyan">{formatDateTime(submission.submittedAt)}</Tag>
                          </Space>
                          <Text strong>
                            Diem giao vien: {submission.reviewStatus === "REVIEWED" ? `${submission.teacherScore}/100` : "Chua cham"}
                          </Text>
                          <Text type="secondary">Thoi luong: {submission.durationSeconds.toFixed(1)} giay</Text>
                          <audio controls src={submission.audioUrl} className="w-full" />
                          {submission.reviewStatus === "PENDING" && (
                            <Text type="secondary">Diem tham khao he thong: {submission.autoOverallScore}/100</Text>
                          )}
                          <Text>
                            {submission.reviewStatus === "REVIEWED"
                              ? (submission.teacherFeedback || "Khong co nhan xet bo sung")
                              : "Bai nop dang cho giao vien danh gia."}
                          </Text>
                        </Space>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Table<PronunciationSubmission>
                    rowKey="id"
                    className="pronunciation-table"
                    dataSource={groupedSubmissions}
                    pagination={{ pageSize: 6 }}
                    columns={[
                      { title: "Sinh vien", dataIndex: "studentName", key: "studentName" },
                      { title: "Lan", dataIndex: "attemptNumber", key: "attemptNumber", width: 80 },
                      {
                        title: "Diem",
                        dataIndex: "teacherScore",
                        key: "teacherScore",
                        width: 100,
                        render: (value: number | null, record) => record.reviewStatus === "REVIEWED" ? `${value}/100` : "Cho cham",
                      },
                      {
                        title: "Trang thai",
                        dataIndex: "reviewStatus",
                        key: "reviewStatus",
                        render: (status: PronunciationSubmission["reviewStatus"]) => (
                          <Tag color={status === "REVIEWED" ? "green" : "orange"}>
                            {status === "REVIEWED" ? "Da cham" : "Cho cham"}
                          </Tag>
                        ),
                      },
                      {
                        title: "Auto score",
                        dataIndex: "autoOverallScore",
                        key: "autoOverallScore",
                        width: 110,
                        render: (value: number) => `${value}/100`,
                      },
                      {
                        title: "Thoi gian nop",
                        dataIndex: "submittedAt",
                        key: "submittedAt",
                        width: 170,
                        render: (value: string) => formatDateTime(value),
                      },
                      {
                        title: "Audio",
                        key: "audio",
                        width: 260,
                        render: (_, record) => <audio controls src={record.audioUrl} />,
                      },
                      ...(canReview ? [{
                        title: "Cham bai",
                        key: "review",
                        render: (_: unknown, record: PronunciationSubmission) => (
                          <Button type="primary" onClick={() => openReviewModal(record)}>
                            {record.reviewStatus === "REVIEWED" ? "Sua diem" : "Cham diem"}
                          </Button>
                        ),
                      }] : []),
                    ]}
                  />
                )}
              </Card>
            </Col>
          </Row>

          <Modal
            open={reviewModalOpen}
            title="Cham bai phat am"
            onCancel={() => {
              setReviewModalOpen(false);
              setReviewingSubmission(null);
            }}
            onOk={() => void handleReviewSubmit()}
            confirmLoading={reviewSubmitting}
            okText="Luu diem"
          >
            <Space direction="vertical" size={12} className="w-full mb-4">
              <Text>
                Auto score tham khao: <strong>{reviewingSubmission?.autoOverallScore ?? "-"}/100</strong>
              </Text>
              <Text type="secondary">{reviewingSubmission?.autoFeedback}</Text>
            </Space>
            <Form layout="vertical" form={reviewForm}>
              <Form.Item
                name="teacherScore"
                label="Diem giao vien"
                rules={[{ required: true, message: "Nhap diem giao vien" }]}
              >
                <InputNumber min={0} max={100} className="w-full" />
              </Form.Item>
              <Form.Item name="teacherFeedback" label="Nhan xet giao vien">
                <Input.TextArea rows={4} placeholder="Nhan xet chi tiet cho hoc sinh" />
              </Form.Item>
            </Form>
          </Modal>
        </>
      )}
    </Space>
  );
}

export default PronunciationExerciseDetailPage;
