import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { examApi, ExamDetail, AnswerPayload } from "@/api/exam";
import { Button, Card, Radio, Input, message, Modal, Spin } from "antd";

const ExamTakingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  useEffect(() => {
    const fetchExam = async () => {
      if (!id) return;
      const data = await examApi.getExamDetail(id);
      if (data) {
        setExam(data);
      } else {
        message.error("Failed to load exam or exam not found.");
      }
      setLoading(false);
    };
    fetchExam();
  }, [id]);

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (!exam || !id) return;

    Modal.confirm({
      title: "Nộp bài",
      content: "Bạn có chắc chắn muốn nộp bài thi này không?",
      okText: "Có, Nộp ngay",
      cancelText: "Hủy",
      onOk: async () => {
        setSubmitting(true);
        const payload: AnswerPayload[] = Object.keys(answers).map((qId) => ({
          questionId: parseInt(qId),
          studentAnswer: answers[parseInt(qId)],
        }));

        try {
          const res = await examApi.submitExam(id, payload);
          if (res) {
            Modal.success({
              title: "Nộp bài thành công!",
              content: (
                <div>
                  <p>Số câu đúng: {res.correctAnswersCount} / {res.totalQuestionsCount}</p>
                  <p>Tổng điểm: <strong>{res.totalScore}</strong></p>
                </div>
              ),
              onOk: () => {
                navigate("/exams/history");
              },
            });
          }
        } catch (error) {
          message.error("Đã xảy ra lỗi khi nộp bài");
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  if (loading) {
    return <div className="flex justify-center mt-20"><Spin size="large" /></div>;
  }

  if (!exam) {
    return <div className="text-center mt-20 text-red-500">Đề thi không tồn tại!</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white shadow rounded p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">{exam.title}</h1>
        <p className="text-gray-600 mb-4">{exam.description}</p>
        <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded font-semibold">
          Thời gian: {exam.timeLimitMinutes} phút
        </div>
      </div>

      <div className="space-y-6">
        {exam.questions.map((q, index) => (
          <Card key={q.id} title={`Câu ${index + 1} (${q.points} điểm)`}>
            <p className="text-lg mb-4 whitespace-pre-wrap">{q.content}</p>
            {q.type === "MULTIPLE_CHOICE" ? (
              <Radio.Group
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                value={answers[q.id]}
                className="flex flex-col space-y-3"
              >
                {q.options &&
                  JSON.parse(q.options).map((opt: string, i: number) => (
                    <Radio key={i} value={opt} className="text-base">
                      {opt}
                    </Radio>
                  ))}
              </Radio.Group>
            ) : (
              <Input
                placeholder="Nhập câu trả lời của bạn..."
                size="large"
                value={answers[q.id] || ""}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
              />
            )}
          </Card>
        ))}
      </div>

      <div className="mt-8 flex justify-center pb-12">
        <Button
          type="primary"
          size="large"
          onClick={handleSubmit}
          loading={submitting}
          className="w-full md:w-1/3 bg-blue-600 hover:bg-blue-700"
        >
          Nộp Bài Thi
        </Button>
      </div>
    </div>
  );
};

export default ExamTakingPage;
