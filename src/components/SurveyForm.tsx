import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, Send, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SurveyResponse, SurveyStep } from '../types';

interface SurveyFormProps {
  key?: React.Key;
  fullName: string;
  birthDate: string;
  step: SurveyStep;
  answers: Partial<SurveyResponse>;
  setAnswers: React.Dispatch<React.SetStateAction<Partial<SurveyResponse>>>;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export default function SurveyForm({
  fullName,
  birthDate,
  step,
  answers,
  setAnswers,
  onPrev,
  onNext,
  onSubmit,
  isSubmitting
}: SurveyFormProps) {
  const [validationError, setValidationError] = useState('');

  // Handle single choice selection (radio replacement)
  const handleSelectRadio = (key: keyof SurveyResponse, value: string) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
    setValidationError('');
  };

  // Handle multi-select checkboxes
  const handleToggleCheckbox = (key: 'q8_phoneUsage' | 'q11_experienced', value: string) => {
    const currentList = (answers[key] as string[]) || [];
    let updatedList: string[];
    if (currentList.includes(value)) {
      updatedList = currentList.filter(item => item !== value);
    } else {
      updatedList = [...currentList, value];
    }
    setAnswers(prev => ({ ...prev, [key]: updatedList }));
    setValidationError('');
  };

  // Render option card
  const renderOptionCard = (
    key: keyof SurveyResponse,
    value: string,
    label: string,
    icon?: string
  ) => {
    const isSelected = answers[key] === value;
    return (
      <button
        id={`opt-${key}-${value.replace(/\s+/g, '-')}`}
        type="button"
        onClick={() => handleSelectRadio(key, value)}
        className={`w-full text-left p-3.5 rounded-lg border transition-all flex items-center justify-between cursor-pointer text-sm ${
          isSelected
            ? 'bg-blue-50/70 border-blue-600 text-blue-950 font-semibold shadow-xs'
            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
        }`}
      >
        <span className="flex items-center gap-2.5">
          {icon && <span className="text-lg">{icon}</span>}
          {label}
        </span>
        <div
          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
            isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
          }`}
        >
          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
        </div>
      </button>
    );
  };

  // Render checkbox card
  const renderCheckboxCard = (
    key: 'q8_phoneUsage' | 'q11_experienced',
    value: string,
    label: string,
    icon?: string
  ) => {
    const currentList = (answers[key] as string[]) || [];
    const isSelected = currentList.includes(value);
    return (
      <button
        id={`chk-${key}-${value.replace(/\s+/g, '-')}`}
        type="button"
        onClick={() => handleToggleCheckbox(key, value)}
        className={`w-full text-left p-3.5 rounded-lg border transition-all flex items-center justify-between cursor-pointer text-sm ${
          isSelected
            ? 'bg-blue-50/70 border-blue-600 text-blue-950 font-semibold shadow-xs'
            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
        }`}
      >
        <span className="flex items-center gap-2.5">
          {icon && <span className="text-lg">{icon}</span>}
          {label}
        </span>
        <div
          className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all ${
            isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
          }`}
        >
          {isSelected && (
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </button>
    );
  };

  // Verify that all answers are provided for current step
  const handleNextWithValidation = () => {
    setValidationError('');
    
    if (step === 'q_part_a') {
      if (!answers.q1_gender) return setValidationError('Vui lòng trả lời: "Giới tính của em"');
      if (!answers.q2_grade) return setValidationError('Vui lòng trả lời: "Khối lớp của em"');
      if (!answers.q3_location) return setValidationError('Vui lòng trả lời: "Nơi ở hiện tại của em"');
      if (!answers.q4_livingWith) return setValidationError('Vui lòng trả lời: "Em đang sống cùng với ai"');
      if (!answers.q5_parentsHome) return setValidationError('Vui lòng trả lời: "Bố mẹ có thường xuyên ở nhà hay không"');
    }

    if (step === 'q_part_b') {
      if (!answers.q6_hasOwnPhone) return setValidationError('Vui lòng trả lời: "Em có điện thoại riêng không"');
      if (!answers.q7_phoneHours) return setValidationError('Vui lòng trả lời: "Thời gian sử dụng điện thoại mỗi ngày"');
      if (!answers.q8_phoneUsage || answers.q8_phoneUsage.length === 0) {
        return setValidationError('Vui lòng trả lời: "Em thường dùng điện thoại để làm những việc gì" (chọn ít nhất 1 mục)');
      }
      if (!answers.q9_studyWithPhone) return setValidationError('Vui lòng trả lời: "Tần suất vừa học vừa dùng điện thoại"');
      if (!answers.q10_distractor) return setValidationError('Vui lòng trả lời: "Điều gì làm em mất tập trung học bài nhất"');
      if (!answers.q11_experienced || answers.q11_experienced.length === 0) {
        return setValidationError('Vui lòng trả lời: "Các tình huống em từng gặp phải" (chọn ít nhất 1 mục)');
      }
    }

    if (step === 'q_part_c') {
      if (!answers.q12_selfStudyHours) return setValidationError('Vui lòng trả lời: "Thời gian tự học trung bình mỗi ngày"');
      if (!answers.q13_easilyDistracted) return setValidationError('Vui lòng trả lời: "Em có dễ bị mất tập trung khi học không"');
      if (!answers.q14_wantsFocusDevice) return setValidationError('Vui lòng trả lời: "Em có mong muốn có thiết bị nhắc học bài không"');
      if (!answers.q15_deviceOpinion) return setValidationError('Vui lòng trả lời: "Đánh giá mức độ cần thiết của thiết bị hỗ trợ"');
    }

    onNext();
  };

  const getStepTitleAndSubtitle = () => {
    switch (step) {
      case 'q_part_a':
        return {
          title: 'PHẦN A. THÔNG TIN CHUNG',
          subtitle: 'Giúp nhóm nghiên cứu hiểu rõ hơn về đối tượng khảo sát nhằm điều chỉnh thuật toán AI.'
        };
      case 'q_part_b':
        return {
          title: 'PHẦN B. THỰC TRẠNG SỬ DỤNG ĐIỆN THOẠI',
          subtitle: 'Tìm hiểu thói quen dùng màn hình và mức độ phụ thuộc điện thoại của học sinh hiện nay.'
        };
      case 'q_part_c':
        return {
          title: 'PHẦN C. THÓI QUEN HỌC TẬP',
          subtitle: 'Đo lường năng lực tập trung tự học và hướng giải pháp thiết kế cho máy AI thông minh.'
        };
      case 'q_part_d':
        return {
          title: 'PHẦN D. Ý KIẾN THỰC TẾ',
          subtitle: 'Hãy bày tỏ suy nghĩ thật của em. Những ý kiến này cực kỳ quan trọng để hoàn thiện đề tài thiết bị.'
        };
      default:
        return { title: '', subtitle: '' };
    }
  };

  const { title, subtitle } = getStepTitleAndSubtitle();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {/* Step Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-6 md:px-10">
          <div className="flex items-center gap-2 mb-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
            <div className="accent-line !h-3.5 !w-[3px]" />
            Khảo sát: {fullName} • {birthDate.split('-').reverse().join('/')}
          </div>
          <h2 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            {title}
          </h2>
          <p className="text-slate-500 text-xs md:text-sm mt-1 leading-relaxed font-semibold">
            {subtitle}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 md:p-10">
          {validationError && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-amber-50 text-amber-900 text-sm p-4 rounded-lg border border-amber-200 mb-6 flex items-start gap-2.5"
            >
              <Info className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold">Còn thông tin chưa điền</p>
                <p className="text-xs text-amber-700 mt-0.5">{validationError}</p>
              </div>
            </motion.div>
          )}

          <div className="space-y-8">
            <AnimatePresence mode="wait">
              {step === 'q_part_a' && (
                <motion.div
                  key="part-a"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  {/* Q1 */}
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-800">
                      1. Giới tính của em: <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {renderOptionCard('q1_gender', 'Nam', 'Nam', '👦')}
                      {renderOptionCard('q1_gender', 'Nữ', 'Nữ', '👧')}
                    </div>
                  </div>

                  {/* Q2 */}
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-800">
                      2. Em đang học khối lớp nào: <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {['6', '7', '8', '9', '10', '11', '12'].map((grade) => (
                        <button
                          key={grade}
                          id={`opt-q2_grade-Lớp-${grade}`}
                          type="button"
                          onClick={() => handleSelectRadio('q2_grade', grade)}
                          className={`py-2.5 px-3 rounded-lg border text-center font-bold transition-all text-xs cursor-pointer ${
                            answers.q2_grade === grade
                              ? 'bg-blue-600 border-blue-600 text-white shadow-sm ring-2 ring-blue-100'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          Khối {grade}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Q3 */}
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-800">
                      3. Nơi ở hiện tại của gia đình em: <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {renderOptionCard('q3_location', 'Thành phố', 'Thành phố', '🏙️')}
                      {renderOptionCard('q3_location', 'Nông thôn', 'Nông thôn', '🏡')}
                    </div>
                  </div>

                  {/* Q4 */}
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-800">
                      4. Hiện tại em đang sống nhiều nhất cùng với ai: <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2.5">
                      {renderOptionCard('q4_livingWith', 'Bố mẹ', 'Bố mẹ', '👨‍👩‍👧‍👦')}
                      {renderOptionCard('q4_livingWith', 'Ông bà', 'Ông bà', '👴👵')}
                      {renderOptionCard('q4_livingWith', 'Người thân khác', 'Người thân khác', '👥')}
                    </div>
                  </div>

                  {/* Q5 */}
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-800">
                      5. Bố mẹ có thường ở nhà đôn đốc em tự học không: <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2.5 bg-slate-50 p-4 rounded-lg border border-slate-200">
                      {renderOptionCard('q5_parentsHome', 'Thường xuyên', 'Thường xuyên', '🕒')}
                      <div className="h-1.5" />
                      {renderOptionCard('q5_parentsHome', 'Thỉnh thoảng', 'Thỉnh thoảng', '⏳')}
                      <div className="h-1.5" />
                      {renderOptionCard('q5_parentsHome', 'Ít khi', 'Ít khi (đi làm sớm về khuya/đi làm xa)', '🎒')}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 'q_part_b' && (
                <motion.div
                  key="part-b"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  {/* Q6 */}
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-800">
                      6. Em có được sở hữu điện thoại thông minh riêng không: <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {renderOptionCard('q6_hasOwnPhone', 'Có', 'Có điện thoại riêng', '📱')}
                      {renderOptionCard('q6_hasOwnPhone', 'Không', 'Không (dùng chung bố mẹ)', '🚫')}
                    </div>
                  </div>

                  {/* Q7 */}
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-800">
                      7. Trung bình mỗi ngày em sử dụng điện thoại bao lâu: <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2.5">
                      {renderOptionCard('q7_phoneHours', 'Dưới 1 giờ', 'Ít (Dưới 1 giờ)', '⏱️')}
                      {renderOptionCard('q7_phoneHours', '1–3 giờ', 'Vừa phải (1–3 giờ)', '🕒')}
                      {renderOptionCard('q7_phoneHours', '3–5 giờ', 'Nhiều (3–5 giờ)', '⚠️')}
                      {renderOptionCard('q7_phoneHours', 'Trên 5 giờ', 'Rất nhiều (Trên 5 giờ)', '🛑')}
                    </div>
                  </div>

                  {/* Q8 */}
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-800">
                      8. Em thường dùng điện thoại để làm những việc gì nhất: <span className="text-red-500">*</span>{' '}
                      <span className="text-[11px] text-blue-600 font-bold">(Được chọn nhiều mục)</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {renderCheckboxCard('q8_phoneUsage', 'Học tập', 'Học tập / Tra tài liệu', '📖')}
                      {renderCheckboxCard('q8_phoneUsage', 'Chơi game', 'Chơi game / Giải trí', '🎮')}
                      {renderCheckboxCard('q8_phoneUsage', 'Xem TikTok/Facebook', 'Xem TikTok / Web / Facebook', '🎬')}
                      {renderCheckboxCard('q8_phoneUsage', 'Nhắn tin', 'Nhắn tin / Tán chuyện', '💬')}
                      {renderCheckboxCard('q8_phoneUsage', 'Khác', 'Các mục đích khác', '🔮')}
                    </div>
                  </div>

                  {/* Q9 */}
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-800">
                      9. Em có thường vừa mở bài học vừa lướt mạng xã hội/nhắn tin không: <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2.5 bg-slate-50 p-4 rounded-lg border border-slate-200">
                      {renderOptionCard('q9_studyWithPhone', 'Thường xuyên', 'Thường xuyên (Cứ học 5-10 phút lại sờ điện thoại)', '🔁')}
                      <div className="h-1.5" />
                      {renderOptionCard('q9_studyWithPhone', 'Thỉnh thoảng', 'Thỉnh thoảng (Khi thấy buồn ngủ/mệt mỏi)', '⚡')}
                      <div className="h-1.5" />
                      {renderOptionCard('q9_studyWithPhone', 'Hiếm khi', 'Hiếm khi / Không bao giờ (Cất hẳn điện thoại đi)', '🛡️')}
                    </div>
                  </div>

                  {/* Q10 */}
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-800">
                      10. Điều gì trong phòng học khiến em dễ bị phân tâm nhiều nhất: <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2.5">
                      {renderOptionCard('q10_distractor', 'Điện thoại', 'Thông báo điện thoại sáng màn hình', '🔔')}
                      {renderOptionCard('q10_distractor', 'Game', 'Game online thôi thúc muốn vào chơi', '🕹️')}
                      {renderOptionCard('q10_distractor', 'Mạng xã hội', 'Các trend mạng xã hội (TikTok, Facebook, Group chat)', '🌎')}
                      {renderOptionCard('q10_distractor', 'Tiếng ồn', 'Tiếng ồn từ ngoài đường / Tivi trong nhà', '📢')}
                      {renderOptionCard('q10_distractor', 'Khác', 'Thứ khác (Buồn ngủ, chuyện gia đình, học mệt...)', '💭')}
                    </div>
                  </div>

                  {/* Q11 */}
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-800">
                      11. Bản thân em đã từng gặp phải các tình huống nào dưới đây chưa: <span className="text-red-500">*</span>{' '}
                      <span className="text-[11px] text-blue-600 font-bold">(Được chọn nhiều mục)</span>
                    </label>
                    <div className="space-y-2.5">
                      {renderCheckboxCard('q11_experienced', 'Thức khuya vì điện thoại', 'Buồn ngủ, mệt mỏi, thức rất khuya vì mải xem điện thoại', '🌙')}
                      {renderCheckboxCard('q11_experienced', 'Quên học bài vì điện thoại', 'Mê mẩn điện thoại dẫn đến quên làm bài tập / lười chuẩn bị bài', '📝')}
                      {renderCheckboxCard('q11_experienced', 'Bị bố mẹ nhắc nhở nhiều lần', 'Bị bố mẹ nhắc nhở dữ dội, tịch thu điện thoại nhiều lần', '😤')}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 'q_part_c' && (
                <motion.div
                  key="part-c"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  {/* Q12 */}
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-800">
                      12. Trung bình mỗi ngày em tự học (ở nhà) khoảng bao lâu: <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2.5">
                      {renderOptionCard('q12_selfStudyHours', 'Dưới 1 giờ', 'Ít (Dưới 1 giờ)', '⏳')}
                      {renderOptionCard('q12_selfStudyHours', '1–2 giờ', 'Trình độ cơ bản (1–2 giờ)', '📖')}
                      {renderOptionCard('q12_selfStudyHours', '2–4 giờ', 'Trình độ chăm chỉ (2–4 giờ)', '🌟')}
                      {renderOptionCard('q12_selfStudyHours', 'Trên 4 giờ', 'Học cật lực thi cử (Trên 4 giờ)', '🔥')}
                    </div>
                  </div>

                  {/* Q13 */}
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-800">
                      13. Khi mở sách tự học, em thấy mình có dễ mất tập trung không: <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {renderOptionCard('q13_easilyDistracted', 'Có', 'Có, rất dễ xao nhãng', '🧠💥')}
                      {renderOptionCard('q13_easilyDistracted', 'Không', 'Không, rất kiên định', '🛡️🎯')}
                    </div>
                  </div>

                  {/* Q14 */}
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-800">
                      14. Em thấy đề tài chế tạo một "Thiết bị hỗ trợ nhắc nhở học tập bằng trí tuệ nhân tạo AI" có đáng kỳ vọng không: <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {renderOptionCard('q14_wantsFocusDevice', 'Có', 'Có kỳ vọng lớn', '⚡🤖')}
                      {renderOptionCard('q14_wantsFocusDevice', 'Không', 'Không cần thiết', '✖️')}
                    </div>
                  </div>

                  {/* Q15 */}
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-800">
                      15. Nếu có 1 thiết bị thực tế để đặt tại bàn học giúp:
                      <ul className="list-disc list-inside text-xs text-slate-500 font-normal mt-1.5 stroke-indigo-100 pl-2 space-y-0.5">
                        <li>Rung/Phát âm thanh nhắc nhở khi em thò tay lướt điện thoại mải chơi</li>
                        <li>Phát hiện mệt mỏi, bù ngủ bằng camera AI hỗ trợ sinh hoạt khoa học</li>
                        <li>Hỗ trợ báo cáo thống kê mức độ chuyên cần cho em và phụ huynh theo dõi tiến bộ</li>
                      </ul>
                      <p className="mt-2 text-slate-800 font-bold">Em thấy thiết bị này cần thiết thế nào?</p>
                    </label>
                    <div className="space-y-2.5">
                      {renderOptionCard('q15_deviceOpinion', 'Rất cần thiết', 'Cực kỳ cần thiết (Rất muốn mua dùng thử)', '💎')}
                      {renderOptionCard('q15_deviceOpinion', 'Cần thiết', 'Cần thiết (Giúp cải thiện hiệu suất tự học)', '✨')}
                      {renderOptionCard('q15_deviceOpinion', 'Bình thường', 'Bình thường (Có hay không cũng được)', '⚖️')}
                      {renderOptionCard('q15_deviceOpinion', 'Không cần thiết', 'Không cần thiết (Tự giác học là chính)', '✖️')}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 'q_part_d' && (
                <motion.div
                  key="part-d"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  {/* Q16 */}
                  <div className="space-y-2">
                    <label htmlFor="q16-textarea" className="block text-sm font-bold text-slate-800">
                      16. Theo em, điện thoại di động thông minh ảnh hưởng tiêu cực/tích cực như thế nào đến nhiệm vụ học tập của học sính ngày nay?
                    </label>
                    <p className="text-xs text-slate-550 mb-1.5 italic">
                      (Ví dụ: Làm tốn thời gian ngủ, giảm khả năng suy nghĩ sâu, nhưng cũng có thể giúp tra bài nhanh...)
                    </p>
                    <textarea
                      id="q16-textarea"
                      rows={4}
                      value={answers.q16_phoneImpact || ''}
                      onChange={(e) => handleSelectRadio('q16_phoneImpact', e.target.value)}
                      placeholder="Gõ suy nghĩ thật lòng của em vào đây nhé..."
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-650 focus:bg-white focus:ring-1 focus:ring-blue-105 rounded-lg p-4 text-slate-800 text-sm font-medium outline-hidden transition-all"
                    />
                  </div>

                  {/* Q17 */}
                  <div className="space-y-2">
                    <label htmlFor="q17-textarea" className="block text-sm font-bold text-slate-800">
                      17. Em mong muốn một thiết bị AI hỗ trợ chống nghiện điện thoại học tập lý tưởng sẽ tích hợp thêm chức năng gì thú vị?
                    </label>
                    <p className="text-xs text-slate-550 mb-1.5 italic">
                      (Ví dụ: Rung điện nhẹ, báo nhạc chuông to, kết nối tắt bộ phát Wi-Fi gia đình lúc đang học bài, trợ lý học tập đố vui...)
                    </p>
                    <textarea
                      id="q17-textarea"
                      rows={4}
                      value={answers.q17_desiredFeatures || ''}
                      onChange={(e) => handleSelectRadio('q17_desiredFeatures', e.target.value)}
                      placeholder="Ví dụ: Mong muốn có chức năng đếm số phút lướt TikTok, tự khoá Wi-Fi..."
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-650 focus:bg-white focus:ring-1 focus:ring-blue-105 rounded-lg p-4 text-slate-800 text-sm font-medium outline-hidden transition-all"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="bg-slate-50 border-t border-slate-201 px-6 py-5 md:px-10 flex items-center justify-between">
          <button
            id="survey-prev-btn"
            type="button"
            onClick={onPrev}
            className="flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 font-bold px-4.5 py-2.5 rounded-lg border border-slate-250 shadow-xs transition-all cursor-pointer text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Quay lại
          </button>

          {step !== 'q_part_d' ? (
            <button
              id="survey-next-btn"
              type="button"
              onClick={handleNextWithValidation}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5.5 py-2.5 rounded-lg border border-blue-650 shadow-sm transition-all cursor-pointer text-sm"
            >
              Tiếp theo
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              id="survey-submit-btn"
              type="button"
              disabled={isSubmitting}
              onClick={onSubmit}
              className={`flex items-center gap-2 bg-blue-600 hover:bg-blue-700 font-bold text-white px-7 py-3 rounded-lg border border-blue-650 shadow-md transition-all cursor-pointer text-sm ${
                isSubmitting ? 'opacity-70 cursor-not-allowed scale-98' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang ghi nhận...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Hoàn tất phiếu gửi
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
