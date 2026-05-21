import React, { useState } from 'react';
import { User, Calendar, BookOpen, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface SurveyIntroProps {
  key?: React.Key;
  onStart: (name: string, dob: string) => void;
}

export default function SurveyIntro({ onStart }: SurveyIntroProps) {
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập họ và tên của em.');
      return;
    }
    if (!dob) {
      setError('Vui lòng chọn ngày tháng năm sinh của em.');
      return;
    }
    
    // Check if name is valid length
    if (name.length > 100) {
      setError('Họ và tên không được dài quá 100 ký tự.');
      return;
    }

    setError('');
    onStart(name.trim(), dob);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {/* Banner */}
        <div className="bg-blue-600 px-6 py-10 md:p-12 text-white relative">
          <div className="inline-flex items-center gap-2 bg-blue-500/30 text-blue-100 px-3 py-1 rounded text-xs font-semibold mb-4 border border-blue-400/20">
            <BookOpen className="w-3.5 h-3.5 text-blue-200" />
            Nghiên cứu khoa học học đường
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-3 uppercase">
            Khảo sát chống nghiện điện thoại bằng AI
          </h1>
          <p className="text-blue-100 text-sm md:text-base font-medium max-w-xl">
            Đề tài: “Thiết bị hỗ trợ nhắc nhở học bài chống nghiện điện thoại sử dụng trí tuệ thông minh AI”
          </p>
        </div>

        <div className="p-6 md:p-10 space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-3">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <div className="accent-line !h-4"></div>
              Mục đích khảo sát
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              Khảo sát thói quen sử dụng điện thoại và học tập của học sinh nhằm nghiên cứu thiết bị hỗ trợ tập trung học bài, hạn chế ảnh hưởng tiêu cực từ môi trường số.
            </p>
            <p className="text-xs text-blue-600 font-semibold italic">
              * Toàn bộ thông tin khảo sát thực tế của em chỉ phục vụ mục đích nghiên cứu học tập và được bảo mật tuyệt đối.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide border-b border-slate-200 pb-2 flex items-center gap-2">
              <div className="accent-line !h-4"></div>
              Nhập thông tin cá nhân của em
            </h3>

            {error && (
              <div className="bg-red-50 text-red-700 text-sm p-4 rounded-lg border border-red-100 flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                <p>{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="space-y-2">
                <label htmlFor="name-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Họ và tên của em <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    id="name-input"
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Ví dụ: Nguyễn Minh Anh"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-105 rounded-lg py-3 pl-11 pr-4 text-slate-800 placeholder-slate-400 outline-hidden transition-all text-sm font-medium"
                    required
                  />
                </div>
              </div>

              {/* DOB */}
              <div className="space-y-2">
                <label htmlFor="dob-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Ngày tháng năm sinh <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <input
                    id="dob-input"
                    type="date"
                    value={dob}
                    onChange={(e) => {
                      setDob(e.target.value);
                      if (error) setError('');
                    }}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-105 rounded-lg py-3 pl-11 pr-4 text-slate-800 outline-hidden transition-all text-sm font-medium"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              id="start-survey-btn"
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg py-3.5 px-6 shadow-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer text-sm tracking-wide uppercase"
            >
              Tiến hành trả lời khảo sát
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
