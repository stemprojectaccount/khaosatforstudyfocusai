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

  // IP limit checking states
  const [userIp, setUserIp] = useState<string>('');
  const [isCheckingDuplicity, setIsCheckingDuplicity] = useState(true);
  const [hasSubmittedBefore, setHasSubmittedBefore] = useState<boolean>(() => {
    return localStorage.getItem('has_submitted_survey') === 'true';
  });

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

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans flex flex-col selection:bg-blue-100 selection:text-blue-950">
      {/* Visual Navigation Bar */}
      <header className="bg-white border-b border-slate-200 py-4.5 px-6 md:px-10 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div 
            onClick={handleResetSurvey} 
            className="flex items-center gap-2.5 md:gap-3 cursor-pointer group select-none"
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
            {/* Admin trigger button removed for client safety */}
          </div>
        </div>
      </header>

      {/* Main Container Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 flex flex-col justify-center">
        {hasSubmittedBefore ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full mx-auto bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center space-y-6 my-6 md:my-10"
          >
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border-4 border-red-100">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2.5">
              <h2 className="text-base font-black text-slate-900 uppercase tracking-tight col-cyan-900">
                Em đã gửi câu trả lời rồi!
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Để đảm bảo tính khách quan của cuộc nghiên cứu khoa học học đường, mỗi học sinh (trên mỗi thiết bị và địa chỉ IP mạng) chỉ được tham gia trả lời phiếu khảo sát một lần duy nhất.
              </p>
              {userIp && (
                <div className="pt-2">
                  <span className="inline-block text-[10px] font-mono font-bold text-slate-400 bg-slate-50 border border-slate-150 px-2.5 py-1 rounded">
                    Địa chỉ IP ghi nhận: {userIp}
                  </span>
                </div>
              )}
            </div>
            <div className="pt-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Cảm ơn em đã đóng góp ý kiến cho đề tài khoa học!
            </div>
          </motion.div>
        ) : isCheckingDuplicity ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3.5">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">
              Đang xác thực hệ thống bảo mật...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Display progress if we already entered questionnaire state */}
            {step !== 'intro' && step !== 'success' && (
              <SurveyProgress
                currentStep={getStepNumberValue()}
                totalSteps={5}
                stepTitles={STEP_TITLES}
              />
            )}

            <AnimatePresence mode="wait">
              {step === 'intro' && (
                <SurveyIntro
                  key="intro"
                  onStart={handleStartSurvey}
                />
              )}

              {step !== 'intro' && step !== 'success' && (
                <SurveyForm
                  key="form"
                  fullName={fullName}
                  birthDate={birthDate}
                  step={step}
                  answers={answers}
                  setAnswers={setAnswers}
                  onPrev={handlePrevStep}
                  onNext={handleNextStep}
                  onSubmit={handleSubmitSurvey}
                  isSubmitting={isSubmitting}
                />
              )}

              {step === 'success' && (
                <SuccessView
                  key="success"
                  fullName={fullName}
                  onReset={handleResetSurvey}
                />
              )}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Humble Footer */}
      <footer className="py-6 border-t border-slate-100 px-6 text-center text-[11px] text-slate-400 font-semibold space-y-1 bg-white shrink-0 mt-8">
        <p>© 2026 Nghiên cứu "Thiết bị nhắc học bài chống nghiện điện thoại bằng AI"</p>
        <p className="font-mono text-[9px] text-slate-350">
          Powered by Google AI Studio Sandbox • Secure Firestore Integration
        </p>
      </footer>
    </div>
  );
}
