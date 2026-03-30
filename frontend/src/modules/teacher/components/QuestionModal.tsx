import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Button, Space } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { QuestionDto } from '../../../api/assignmentApi';

const { Option } = Select;

interface Props {
  visible: boolean;
  onCancel: () => void;
  onSuccess: (values: QuestionDto) => void;
  initialValues?: QuestionDto | null;
  loading: boolean;
}

const QuestionModal: React.FC<Props> = ({ visible, onCancel, onSuccess, initialValues, loading }) => {
  const [form] = Form.useForm();
  const [questionType, setQuestionType] = useState<'MULTIPLE_CHOICE' | 'FILL_IN_BLANK'>('MULTIPLE_CHOICE');

  useEffect(() => {
    if (visible && initialValues) {
      setQuestionType(initialValues.type || 'MULTIPLE_CHOICE');
      form.setFieldsValue({
        ...initialValues,
        options: initialValues.options || []
      });
    } else if (visible && !initialValues) {
      setQuestionType('MULTIPLE_CHOICE');
      form.resetFields();
      form.setFieldsValue({ type: 'MULTIPLE_CHOICE' });
    }
  }, [visible, initialValues, form]);

  const handleOk = () => {
    form.validateFields().then((values) => {
      onSuccess(values as QuestionDto);
    });
  };

  return (
    <Modal
      title={initialValues ? "Cập nhật Câu hỏi" : "Tạo Mới Câu hỏi"}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      okText="Lưu"
      cancelText="Hủy"
      width={600}
    >
      <Form form={form} layout="vertical" initialValues={{ type: 'MULTIPLE_CHOICE' }}>
        <Form.Item name="type" label="Loại Câu Hỏi" rules={[{ required: true, message: 'Vui lòng chọn loại câu hỏi' }]}>
          <Select onChange={(value: 'MULTIPLE_CHOICE' | 'FILL_IN_BLANK') => setQuestionType(value)}>
            <Option value="MULTIPLE_CHOICE">Trắc nghiệm (MULTIPLE_CHOICE)</Option>
            <Option value="FILL_IN_BLANK">Điền từ (FILL_IN_BLANK)</Option>
          </Select>
        </Form.Item>

        <Form.Item name="content" label="Nội dung" rules={[{ required: true, message: 'Vui lòng nhập nội dung câu hỏi' }]}>
          <Input.TextArea placeholder="Nhập nội dung câu hỏi..." rows={3} />
        </Form.Item>

        {questionType === 'MULTIPLE_CHOICE' && (
          <Form.List
            name="options"
            rules={[
              {
                validator: async (_, options) => {
                  if (!options || options.length < 2) {
                    return Promise.reject(new Error('Vui lòng thêm ít nhất 2 phương án'));
                  }
                },
              },
            ]}
          >
            {(fields, { add, remove }, { errors }) => (
              <>
                <div className="mb-2"><strong>Các phương án:</strong></div>
                {fields.map((field, index) => (
                  <Form.Item required={false} key={field.key} className="mb-2">
                    <Form.Item
                      {...field}
                      validateTrigger={['onChange', 'onBlur']}
                      rules={[{ required: true, whitespace: true, message: 'Nhập nội dung phương án hoặc xóa' }]}
                      noStyle
                    >
                      <Input placeholder={`Phương án ${index + 1}`} style={{ width: '85%' }} />
                    </Form.Item>
                    {fields.length > 2 ? (
                      <MinusCircleOutlined
                        className="dynamic-delete-button ml-3 text-red-500 hover:text-red-700"
                        onClick={() => remove(field.name)}
                      />
                    ) : null}
                  </Form.Item>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Thêm Phương Án
                  </Button>
                  <Form.ErrorList errors={errors} />
                </Form.Item>
              </>
            )}
          </Form.List>
        )}

        <Form.Item 
          name="correctAnswer" 
          label="Đáp án đúng" 
          rules={[{ required: true, message: 'Vui lòng nhập hoặc chọn đáp án đúng' }]}
          extra={questionType === 'MULTIPLE_CHOICE' ? "Hãy copy đúng y hệt nội dung của 1 trong các phương án trên. Hoặc nếu là điền từ, hãy gõ từ cần điền." : "Từ khóa người dùng cần nhập vào đoạn trống."}
        >
          <Input placeholder="Nhập đáp án đúng..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default QuestionModal;
