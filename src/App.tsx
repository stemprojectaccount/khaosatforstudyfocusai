import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { SurveyResponse, SurveyStep } from './types';
import SurveyIntro from './components/SurveyIntro';
import SurveyProgress from './components/SurveyProgress';
import SurveyForm from './components/SurveyForm';
import SuccessView from './components/SuccessView';
import AdminDashboard from './components/AdminDashboard';
import { BookOpen, ShieldCheck, Milestone, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Helper to fetch user's public IP
const fetchIpAddress = async (): Promise<string | null> => {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    if (!res.ok) throw new Error('Network response non-ok');
    const data = await res.json();
    return data.ip || null;
  } catch (err) {
    console.warn('Failed to fetch IP via ipify, trying fallback...', err);
    try {
      const res2 = await fetch('https://ipapi.co/json/');
      if (!res2.ok) throw new Error('API request failed');
      const data2 = await res2.json();
      return data2.ip || null;
    } catch (err2) {
      console.error('All IP resolution options failed', err2);
      return null;
    }
  }
};

// Helper to check if IP already exists in Firestore
const checkIfIpSubmitted = async (ip: string): Promise<boolean> => {
  try {
    const q = query(collection(db, 'survey_responses'), where('ipAddress', '==', ip), limit(1));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (err) {
    console.error('Error querying backend for IP:', err);
    return false;
  }
};

// Step progress configuration
const STEP_TITLES = ['Bắt đầu', 'Thông tin chung', 'Màn hình & Điện thoại', 'Thói quen tự học', 'Ý kiến tự sự'];
const STEPS_ORDER: SurveyStep[] = ['intro', 'q_part_a', 'q_part_b', 'q_part_c', 'q_part_d', 'success'];

export default function App() {
  const [adminMode, setAdminMode] = useState(false);
  const [step, setStep] = useState<SurveyStep>('intro');
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin access secret states
  const [showPassModal, setShowPassModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [logoClicks, setLogoClicks] = useState(0);

  // IP limit checking states
  const [userIp, setUserIp] = useState<string>('');
  const [isCheckingDuplicity, setIsCheckingDuplicity] = useState(true);
  const [hasSubmittedBefore, setHasSubmittedBefore] = useState<boolean>(() => {
    return localStorage.getItem('has_submitted_survey') === 'true';
  });

  // Check URL query parameters on mount or load for easy admin bypass
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true' || params.get('mode') === 'admin') {
      setAdminMode(true);
    }
  }, []);

  // Verify IP uniqueness on load
  useEffect(() => {
    let active = true;

    // Quick local storage check bypass
    if (localStorage.getItem('has_submitted_survey') === 'true') {
      setHasSubmittedBefore(true);
      setIsCheckingDuplicity(false);
      return;
    }

    const verifyDeviceSafety = async () => {
      const ip = await fetchIpAddress();
      if (!active) return;

      if (ip) {
        setUserIp(ip);
        const alreadySubmitted = await checkIfIpSubmitted(ip);
        if (!active) return;

        if (alreadySubmitted) {
          setHasSubmittedBefore(true);
          localStorage.setItem('has_submitted_survey', 'true');
        }
      }
      setIsCheckingDuplicity(false);
    };

    verifyDeviceSafety();

    return () => {
      active = false;
    };
  }, []);

  // Secret password submit
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'admin123' || passwordInput === '123456') {
      setAdminMode(true);
      setShowPassModal(false);
      setPasswordInput('');
      setLoginError('');
    } else {
      setLoginError('Mật mã quản trị chưa chính xác. Vui lòng thử lại.');
    }
  };

  const handleLogoClick = () => {
    const nextClicks = logoClicks + 1;
    setLogoClicks(nextClicks);
    if (nextClicks >= 5) {
      setShowPassModal(true);
      setLogoClicks(0);
    }
  };

  // Initializing empty choices format matching schema
  const [answers, setAnswers] = useState<Partial<SurveyResponse>>({
    q1_gender: '',
    q2_grade: '',
    q3_location: '',
    q4_livingWith: '',
    q5_parentsHome: '',
    q6_hasOwnPhone: '',
    q7_phoneHours: '',
    q8_phoneUsage: [],
    q9_studyWithPhone: '',
    q10_distractor: '',
    q11_experienced: [],
    q12_selfStudyHours: '',
    q13_easilyDistracted: '',
    q14_wantsFocusDevice: '',
    q15_deviceOpinion: '',
    q16_phoneImpact: '',
    q17_desiredFeatures: ''
  });

  // Start survey from Intro
  const handleStartSurvey = (name: string, dob: string) => {
    setFullName(name);
    setBirthDate(dob);
    setStep('q_part_a');
  };

  // Nav: Next step
  const handleNextStep = () => {
    const currentIndex = STEPS_ORDER.indexOf(step);
    if (currentIndex < STEPS_ORDER.length - 1) {
      setStep(STEPS_ORDER[currentIndex + 1]);
    }
  };

  // Nav: Prev step
  const handlePrevStep = () => {
    const currentIndex = STEPS_ORDER.indexOf(step);
    if (currentIndex === 1) {
      // Return to intro
      setStep('intro');
    } else if (currentIndex > 1) {
      setStep(STEPS_ORDER[currentIndex - 1]);
    }
  };

  // Reset/Restart entire survey
  const handleResetSurvey = () => {
    setFullName('');
    setBirthDate('');
    setAnswers({
      q1_gender: '',
      q2_grade: '',
      q3_location: '',
      q4_livingWith: '',
      q5_parentsHome: '',
      q6_hasOwnPhone: '',
      q7_phoneHours: '',
      q8_phoneUsage: [],
      q9_studyWithPhone: '',
      q10_distractor: '',
      q11_experienced: [],
      q12_selfStudyHours: '',
      q13_easilyDistracted: '',
      q14_wantsFocusDevice: '',
      q15_deviceOpinion: '',
      q16_phoneImpact: '',
      q17_desiredFeatures: ''
    });
    setStep('intro');
  };

  // Submit survey responses directly into Firestore database
  const handleSubmitSurvey = async () => {
    setIsSubmitting(true);
    const path = 'survey_responses';
    try {
      // Craft the strictly conforming payload
      const payload = {
        fullName: fullName.trim(),
        birthDate: birthDate,
        q1_gender: answers.q1_gender,
        q2_grade: answers.q2_grade,
        q3_location: answers.q3_location,
        q4_livingWith: answers.q4_livingWith,
        q5_parentsHome: answers.q5_parentsHome,
        q6_hasOwnPhone: answers.q6_hasOwnPhone,
        q7_phoneHours: answers.q7_phoneHours,
        q8_phoneUsage: answers.q8_phoneUsage || [],
        q9_studyWithPhone: answers.q9_studyWithPhone,
        q10_distractor: answers.q10_distractor,
        q11_experienced: answers.q11_experienced || [],
        q12_selfStudyHours: answers.q12_selfStudyHours,
        q13_easilyDistracted: answers.q13_easilyDistracted,
        q14_wantsFocusDevice: answers.q14_wantsFocusDevice,
        q15_deviceOpinion: answers.q15_deviceOpinion,
        q16_phoneImpact: answers.q16_phoneImpact?.trim() || '',
        q17_desiredFeatures: answers.q17_desiredFeatures?.trim() || '',
        ipAddress: userIp || 'unknown', // Save public IP/device identifier
        createdAt: serverTimestamp() // Satisfies Temporal Integrity constraints
      };

      await addDoc(collection(db, path), payload);
      
      // Permanently mark this client device as submitted to prevent double surveys
      localStorage.setItem('has_submitted_survey', 'true');
      setHasSubmittedBefore(true);
      setStep('success');
    } catch (err) {
      console.error(err);
      alert('Không thể lưu phiếu khảo sát học sinh. Vui lòng kiểm tra cấu hình mạng hoặc Firestore rules.');
      try {
        handleFirestoreError(err, OperationType.CREATE, path);
      } catch (e) {}
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepNumberValue = () => {
    if (step === 'intro') return 1;
    if (step === 'q_part_a') return 2;
    if (step === 'q_part_b') return 3;
    if (step === 'q_part_c') return 4;
    if (step === 'q_part_d') return 5;
    return 5;
  };

  if (adminMode) {
    return (
      <AdminDashboard 
        onBack={() => {
          setAdminMode(false);
          const url = new URL(window.location.href);
          url.searchParams.delete('admin');
          url.searchParams.delete('mode');
          window.history.replaceState({}, '', url.pathname);
        }} 
      />
    );
  }

  return (
    <div 
      className="min-h-screen text-slate-800 font-sans flex flex-col selection:bg-blue-100 selection:text-blue-950 relative"
      style={{
        backgroundImage: "linear-gradient(rgba(241, 245, 249, 0.92), rgba(241, 245, 249, 0.95)), url('https://i.postimg.cc/cHcYpxLS/Thiet-ke-chua-co-ten-(7).png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Visual Navigation Bar */}
      <header className="bg-white border-b border-slate-200 py-4.5 px-6 md:px-10 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div 
            onClick={handleLogoClick} 
            className="flex items-center gap-2.5 md:gap-3 cursor-pointer group select-none"
            title="Click 5 lần để đăng nhập Quản Trị Viên"
          >
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform duration-200">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-sm md:text-base tracking-tight text-slate-900 uppercase block lg:inline mr-1">
                KHẢO SÁT CHỐNG NGHIỆN ĐIỆN THOẠI
              </span>
              <span className="hidden sm:inline-block text-[10px] font-bold text-blue-600 tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-105 uppercase">
                STUDY FOCUS AI 🤖
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowPassModal(true)}
              className="text-xs font-bold text-slate-400 hover:text-blue-600 cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Quản trị viên</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Content containing the Survey Closed screen */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 flex flex-col justify-center items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-2xl w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-8 md:p-12 text-center space-y-8 my-6 md:my-10 relative overflow-hidden"
        >
          {/* Subtle Accent Stripe */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600" />

          {/* Icon Badge */}
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-100 shadow-xs">
            <ShieldCheck className="w-10 h-10" />
          </div>

          <div className="space-y-4">
            <span className="inline-block px-3 py-1 text-[10px] font-black tracking-widest text-blue-600 bg-blue-50 border border-blue-200 rounded-full uppercase animate-pulse">
              KHẢO SÁT ĐÃ ĐÓNG • SURVEY CLOSED
            </span>
            <h1 className="text-xl md:text-2xl font-black text-slate-950 uppercase tracking-tight leading-tight">
              Khảo sát chống nghiện điện thoại bằng AI
            </h1>
            <p className="text-sm md:text-base text-slate-650 leading-relaxed font-medium pt-2 max-w-lg mx-auto">
              Bài khảo sát này đã kết thúc. Xin cảm ơn bạn đã truy cập vào làm nhưng rất tiếc bài khảo sát đã kết thúc, xin hẹn gặp lại lần sau!
            </p>
          </div>

          {/* Social Proof / Metadata */}
          <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-slate-100 max-w-md mx-auto text-center">
            <div>
              <div className="text-lg font-black text-blue-600">100%</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Học sinh THCS</div>
            </div>
            <div className="border-l border-r border-slate-150">
              <div className="text-lg font-black text-slate-800">Cấp độ 6-9</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Khối lớp khảo sát</div>
            </div>
            <div>
              <div className="text-lg font-black text-indigo-600">AI Study</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Đề tài NCKH</div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider pt-2">
            Đề tài: Thiết kế thiết bị nhắc học bài tự học chống nghiện điện thoại AI
          </div>
        </motion.div>
      </main>

      {/* Secret Password Entry Modal for Administrator Login */}
      <AnimatePresence>
        {showPassModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="font-extrabold text-sm text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Đăng nhập Quản trị viên
                </span>
                <button 
                  onClick={() => { setShowPassModal(false); setLoginError(''); }}
                  className="text-slate-400 hover:text-slate-600 text-sm font-semibold cursor-pointer"
                >
                  Đóng
                </button>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Nhập Mật mã Quản trị:
                  </label>
                  <input
                    type="password"
                    placeholder="Nhập PIN hoặc mật mã (admin123)..."
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium"
                    autoFocus
                  />
                  {loginError && (
                    <p className="text-xs text-red-500 font-semibold">{loginError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 text-white rounded-md text-xs font-bold uppercase tracking-wider hover:bg-blue-700 transition-colors cursor-pointer shadow-xs"
                >
                  Xác nhận Truy cập
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Humble Footer */}
      <footer className="py-6 border-t border-slate-100 px-6 text-center text-[11px] text-slate-400 font-semibold space-y-1 bg-white shrink-0 mt-8">
        <p>© 2026 Nghiên cứu "Thiết bị nhắc học bài chống nghiện điện thoại bằng AI"</p>
        <p 
          onClick={handleLogoClick}
          className="font-mono text-[9px] text-slate-350 cursor-pointer select-none hover:text-slate-500 transition-colors"
        >
          Powered by Google AI Studio Sandbox • Secure Firestore Integration
        </p>
      </footer>
    </div>
  );
}
