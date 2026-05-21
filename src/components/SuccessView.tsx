import React from 'react';
import { CheckCircle, ArrowRight, CornerDownRight, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';

interface SuccessProps {
  key?: React.Key;
  fullName: string;
  onReset: () => void;
}

export default function SuccessView({ fullName, onReset }: SuccessProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35 }}
      className="max-w-xl mx-auto text-center px-4"
    >
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 md:p-12 space-y-6">
        {/* Animated Checkmark */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center border-4 border-blue-100 relative">
            <CheckCircle className="w-10 h-10 text-blue-600" />
            <div className="absolute inset-0 bg-blue-400 rounded-full scale-110 opacity-10 animate-ping" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase">
            Gửi phiếu thành công!
          </h1>
          <p className="text-sm font-bold text-blue-600 uppercase">
            Hệ thống xin cảm ơn câu trả lời của em, {fullName}!
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 text-xs md:text-sm text-slate-705 space-y-3 prose leading-relaxed max-w-sm mx-auto text-left">
          <div className="flex items-start gap-2.5">
            <CornerDownRight className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="font-semibold">Dữ liệu ý kiến của em đã được mã hóa và gửi lưu trữ an toàn về cơ sở dữ liệu học tập.</p>
          </div>
          <div className="flex items-start gap-2.5">
            <CornerDownRight className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="font-semibold">Nhóm nghiên cứu học sinh sẽ tổng hợp các thói quen này để đưa ra thông số hoàn hảo cho thiết bị tự ngắt wifi và rung nhịp AI.</p>
          </div>
        </div>

        <div className="pt-4 flex justify-center items-center">
          <button
            id="reset-survey-btn"
            type="button"
            onClick={onReset}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-slate-800 font-bold px-8 py-3 rounded-lg border border-slate-250 transition-all cursor-pointer text-xs uppercase"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Khảo sát mới
          </button>
        </div>
      </div>
    </motion.div>
  );
}
