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
      if (!id) {
        setLoading(false);
        return;
      }

      const data = await examApi.getExamDetail(id);
      if (data) {
        setExam(data);
      } else {
        message.error("Failed to load exam or exam not found.");
      }
      setLoading(false);
    };

    void fetchExam();
  }, [id]);

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (!exam || !id) {
      return;
    }

    Modal.confirm({
      title: "Nop bai",
      content: "Ban co chac chan muon nop bai thi nay khong?",
      okText: "Co, nop ngay",
      cancelText: "Huy",
      onOk: async () => {
        setSubmitting(true);
        const payload: AnswerPayload[] = Object.keys(answers).map((questionId) => ({
          questionId: Number(questionId),
          studentAnswer: answers[Number(questionId)],
        }));

        try {
          const res = await examApi.submitExam(id, payload);
          if (res) {
            Modal.success({
              title: "Nop bai thanh cong",
              content: (
                <div>
                  <p>
                    So cau dung: {res.correctAnswersCount} / {res.totalQuestionsCount}
                  </p>
                  <p>
                    Tong diem: <strong>{res.totalScore}</strong>
                  </p>
                </div>
              ),
              onOk: () => {
                navigate("/exams/history");
              },
            });
          }
        } catch {
          message.error("Da xay ra loi khi nop bai");
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center mt-20">
        <Spin size="large" />
      </div>
    );
  }

  if (!exam) {
    return <div className="text-center mt-20 text-red-500">De thi khong ton tai</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white shadow rounded p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">{exam.title}</h1>
        <p className="text-gray-600 mb-4">{exam.description}</p>
        {typeof exam.timeLimitMinutes === "number" && (
          <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded font-semibold">
            Thoi gian: {exam.timeLimitMinutes} phut
          </div>
        )}
      </div>

      <div className="space-y-6">
        {exam.questions.map((question, index) => (
          <Card key={question.id} title={`Cau ${index + 1} (${question.points} diem)`}>
            <p className="text-lg mb-4 whitespace-pre-wrap">{question.content}</p>
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
                placeholder="Nhap cau tra loi cua ban..."
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
          className="w-full md:w-1/3 bg-blue-600 hover:bg-blue-700"
        >
          Nop bai thi
        </Button>
      </div>
    </div>
  );
};

export default ExamTakingPage;
