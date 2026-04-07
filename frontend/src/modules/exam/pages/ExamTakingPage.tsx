import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { examApi, AnswerPayload, ExamDetail } from "@/api/exam";
import { Button, Card, Input, message, Modal, Radio, Spin, Tag } from "antd";

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "Không đặt hạn";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const ExamTakingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const autoSubmittedRef = useRef(false);

  useEffect(() => {
    const fetchExam = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const data = await examApi.getExamDetail(id);
        setExam(data);
        if (data && typeof data.timeLimitMinutes === "number" && data.timeLimitMinutes > 0) {
          setRemainingSeconds(data.timeLimitMinutes * 60);
        } else {
          setRemainingSeconds(null);
        }
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message ?? "Không thể tải bài tập hoặc bài tập không còn khả dụng.";
        message.error(errorMessage);
        navigate("/assignments");
      } finally {
        setLoading(false);
      }
    };

    void fetchExam();
  }, [id, navigate]);

  useEffect(() => {
    if (remainingSeconds == null || remainingSeconds <= 0 || submitting) {
      return;
    }

    const timer = window.setInterval(() => {
      setRemainingSeconds((previous) => {
        if (previous == null) {
          return previous;
        }
        return previous - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [remainingSeconds, submitting]);

  useEffect(() => {
    if (remainingSeconds !== 0 || autoSubmittedRef.current || !exam || !id) {
      return;
    }

    autoSubmittedRef.current = true;
    void submitExam(true);
  }, [remainingSeconds, exam, id]);

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers((previous) => ({ ...previous, [questionId]: value }));
  };

  const buildPayload = (): AnswerPayload[] =>
    Object.keys(answers).map((questionId) => ({
      questionId: Number(questionId),
      studentAnswer: answers[Number(questionId)],
    }));

  const formatRemainingTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remain = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remain).padStart(2, "0")}`;
  };

  const submitExam = async (autoSubmit = false) => {
    if (!exam || !id) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await examApi.submitExam(id, buildPayload());
      if (res) {
        Modal.success({
          title: autoSubmit ? "Hết giờ, bài đã được nộp tự động" : "Nộp bài thành công",
          content: (
            <div>
              <p>
                Số câu đúng: {res.correctAnswersCount} / {res.totalQuestionsCount}
              </p>
              <p>
                Tổng điểm: <strong>{res.totalScore}</strong> / 10
              </p>
              <p>Lượt còn lại: {res.remainingAttempts ?? 0}</p>
            </div>
          ),
          onOk: () => {
            navigate("/exams/history");
          },
        });
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message ?? "Đã xảy ra lỗi khi nộp bài";
      message.error(errorMessage);
      autoSubmittedRef.current = false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!exam || !id) {
      return;
    }

    Modal.confirm({
      title: "Nộp bài",
      content: "Bạn có chắc chắn muốn nộp bài này không?",
      okText: "Có, nộp ngay",
      cancelText: "Hủy",
      onOk: async () => {
        await submitExam(false);
      },
    });
  };

  if (loading) {
    return (
      <div className="mt-20 flex justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!exam) {
    return <div className="mt-20 text-center text-red-500">Bài tập không tồn tại</div>;
  }

  const isExpired = !!exam.dueAt && new Date(exam.dueAt).getTime() < Date.now();
  const noAttemptsLeft = (exam.remainingAttempts ?? 0) <= 0;

  return (
    <div className="mx-auto max-w-4xl p-4">
      <div className="mb-6 rounded bg-white p-6 shadow">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="mb-0 text-2xl font-bold">{exam.title}</h1>
          <div className="flex flex-wrap gap-2">
            <Tag color="blue">Số lần làm: {exam.maxAttempts ?? 1}</Tag>
            <Tag color={(exam.remainingAttempts ?? 0) > 0 ? "cyan" : "red"}>
              Lượt còn lại: {exam.remainingAttempts ?? 0}
            </Tag>
            <Tag color={isExpired ? "red" : "magenta"}>Hạn làm: {formatDateTime(exam.dueAt)}</Tag>
            {typeof exam.timeLimitMinutes === "number" && exam.timeLimitMinutes > 0 ? (
              <Tag color={remainingSeconds != null && remainingSeconds <= 60 ? "red" : "gold"}>
                Còn lại: {formatRemainingTime(Math.max(remainingSeconds ?? 0, 0))}
              </Tag>
            ) : (
              <Tag color="default">Không giới hạn thời gian</Tag>
            )}
          </div>
        </div>
        <p className="mb-4 text-gray-600">{exam.description}</p>
      </div>

      <div className="space-y-6">
        {exam.questions.map((question, index) => (
          <Card key={question.id} title={`Câu ${index + 1} (${question.points} điểm)`}>
            <p className="mb-4 whitespace-pre-wrap text-lg">{question.content}</p>
            {question.type === "MULTIPLE_CHOICE" ? (
              <Radio.Group
                onChange={(event) => handleAnswerChange(question.id, event.target.value)}
                value={answers[question.id]}
                className="flex flex-col space-y-3"
              >
                {Array.isArray(question.options) &&
                  question.options.map((option: string, optionIndex: number) => (
                    <Radio key={optionIndex} value={option} className="text-base">
                      {option}
                    </Radio>
                  ))}
              </Radio.Group>
            ) : (
              <Input
                placeholder="Nhập câu trả lời của bạn..."
                size="large"
                value={answers[question.id] || ""}
                onChange={(event) => handleAnswerChange(question.id, event.target.value)}
              />
            )}
          </Card>
        ))}
      </div>

      <div className="mt-8 flex justify-center pb-12">
        <Button
          type="primary"
          size="large"
          onClick={() => void handleSubmit()}
          loading={submitting}
          disabled={isExpired || noAttemptsLeft}
          className="w-full bg-blue-600 hover:bg-blue-700 md:w-1/3"
        >
          Nộp bài
        </Button>
      </div>
    </div>
  );
};

export default ExamTakingPage;
