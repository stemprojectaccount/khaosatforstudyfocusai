import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  collection, getDocs, addDoc, query, orderBy, deleteDoc, doc, serverTimestamp, getDocFromServer
} from 'firebase/firestore';
import { signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import { db, auth, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { SurveyResponse } from '../types';
import { 
  ChevronLeft, Database, Trash2, LogIn, LogOut, Loader2, BarChart2, 
  Users, Smartphone, BookOpen, MessageSquare, Plus, CheckCircle, ShieldAlert
} from 'lucide-react';
import { motion } from 'motion/react';

interface AdminDashboardProps {
  onBack: () => void;
}

const COLORS = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#1E40AF', '#1D4ED8', '#475569'];

export default function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'stats' | 'list'>('stats');
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponse | null>(null);

  // Monitor Auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        fetchData();
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch responses from Firestore
  const fetchData = async () => {
    setLoading(true);
    setError('');
    const path = 'survey_responses';
    try {
      // Test collection first as per validation blueprint
      try {
        await getDocFromServer(doc(db, 'test-connection-doc-dont-exists', 'conn'));
      } catch (e) {
        // Safe to ignore non-permission issues
      }

      const q = query(collection(db, path), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data: SurveyResponse[] = [];
      querySnapshot.forEach((docSnap) => {
        const item = docSnap.data();
        data.push({
          id: docSnap.id,
          ...item,
          createdAt: item.createdAt ? item.createdAt.toDate?.() || new Date(item.createdAt) : new Date(),
        } as SurveyResponse);
      });
      setResponses(data);
    } catch (err) {
      console.error(err);
      setError('Không thể tải dữ liệu từ Firestore. Bạn cần Đăng nhập và được cấp quyền để truy cập.');
      // Handle but don't crash UI, allow viewing in console
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (uiErr) {
        // Handled in state
      }
    } finally {
      setLoading(false);
    }
  };

  // Login handler
  const handleLogin = async () => {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error(err);
      setError('Đăng nhập thất bại. Trình duyệt có thể đã chặn popup.');
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setResponses([]);
      setUser(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Deletion logic
  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá phiếu khảo sát này khỏi dữ liệu Firebase không?')) {
      return;
    }
    const path = `survey_responses/${id}`;
    try {
      await deleteDoc(doc(db, 'survey_responses', id));
      setResponses(prev => prev.filter(item => item.id !== id));
      if (selectedResponse?.id === id) {
        setSelectedResponse(null);
      }
    } catch (err) {
      console.error(err);
      alert('Không có quyền xoá tài nguyên này!');
      try {
        handleFirestoreError(err, OperationType.DELETE, path);
      } catch(e) {}
    }
  };

  // Batch insert mock responses for immediate testing!
  const generateMockData = async () => {
    setLoading(true);
    const mockNames = ['Lê Hoàng Long', 'Nguyễn Thị Minh', 'Trần Tiến Đạt', 'Vũ Khánh Huyền', 'Phạm Minh Quân', 'Hoàng Bảo Ngọc'];
    const mockDobs = ['2011-04-12', '2010-08-25', '2012-01-05', '2009-11-20', '2010-03-15', '2011-09-02'];
    const genders = ['Nam', 'Nữ'];
    const grades = ['6', '7', '8', '9'];
    const locations = ['Thành phố', 'Nông thôn'];
    const livingWiths = ['Bố mẹ', 'Ông bà', 'Người thân khác'];
    const parentsHomes = ['Thường xuyên', 'Thỉnh thoảng', 'Ít khi'];
    const yesNos = ['Có', 'Không'];
    const phoneHoursArr = ['Dưới 1 giờ', '1–3 giờ', '3–5 giờ', 'Trên 5 giờ'];
    const usagesList = ['Học tập', 'Chơi game', 'Xem TikTok/Facebook', 'Nhắn tin', 'Khác'];
    const studyPhones = ['Thường xuyên', 'Thỉnh thoảng', 'Hiếm khi'];
    const distractors = ['Điện thoại', 'Game', 'Mạng xã hội', 'Tiếng ồn', 'Khác'];
    const experiences = ['Thức khuya vì điện thoại', 'Quên học bài vì điện thoại', 'Bị bố mẹ nhắc nhở nhiều lần', 'Khác'];
    const studyHoursArr = ['Dưới 1 giờ', '1–2 giờ', '2–4 giờ', 'Trên 4 giờ'];
    const deviceOpinions = ['Rất cần thiết', 'Cần thiết', 'Bình thường', 'Không cần thiết'];
    const impacts = [
      'Điện thoại làm em thức khuya lướt mạng xã hội mệt mỏi, hôm sau lên lớp không tập trung học ngủ gật.',
      'Rất tiện lợi để tra từ điển Tiếng Anh hoặc hỏi bài nhóm, nhưng thỉnh thoảng hiện thông báo tin nhắn lại mải rep mất cả tiếng.',
      'Khá là khó chịu vì thỉnh thoảng không thể ngừng xem video ngắn trên TikTok, mong muốn có thiết bị tự khóa điện thoại lại.',
      'Cần tích hợp máy nhắc tự động dùng AI phân tích dáng ngồi học chống cận thị.'
    ];
    const features = [
      'Tự động ngắt wifi wifi và báo cáo trực tiếp thời gian thực về máy cho ba mẹ giám sát.',
      'Phát nhạc đố vui và hỗ trợ nhắc nhở em đứng dậy vận động nhẹ sau 45 phút học căng thẳng.',
      'Chức năng nhận diện khuôn mặt xem em có ngồi đúng bàn học không.'
    ];

    try {
      for (let i = 0; i < 5; i++) {
        const mockPayload = {
          fullName: mockNames[Math.floor(Math.random() * mockNames.length)] + ' (Mẫu)',
          birthDate: mockDobs[Math.floor(Math.random() * mockDobs.length)],
          q1_gender: genders[Math.floor(Math.random() * genders.length)],
          q2_grade: grades[Math.floor(Math.random() * grades.length)],
          q3_location: locations[Math.floor(Math.random() * locations.length)],
          q4_livingWith: livingWiths[Math.floor(Math.random() * livingWiths.length)],
          q5_parentsHome: parentsHomes[Math.floor(Math.random() * parentsHomes.length)],
          q6_hasOwnPhone: yesNos[Math.floor(Math.random() * yesNos.length)],
          q7_phoneHours: phoneHoursArr[Math.floor(Math.random() * phoneHoursArr.length)],
          q8_phoneUsage: [usagesList[0], usagesList[Math.floor(Math.random() * 4) + 1]],
          q9_studyWithPhone: studyPhones[Math.floor(Math.random() * studyPhones.length)],
          q10_distractor: distractors[Math.floor(Math.random() * distractors.length)],
          q11_experienced: [experiences[Math.floor(Math.random() * experiences.length)]],
          q12_selfStudyHours: studyHoursArr[Math.floor(Math.random() * studyHoursArr.length)],
          q13_easilyDistracted: yesNos[Math.floor(Math.random() * yesNos.length)],
          q14_wantsFocusDevice: yesNos[Math.floor(Math.random() * yesNos.length)],
          q15_deviceOpinion: deviceOpinions[Math.floor(Math.random() * deviceOpinions.length)],
          q16_phoneImpact: impacts[Math.floor(Math.random() * impacts.length)],
          q17_desiredFeatures: features[Math.floor(Math.random() * features.length)],
          createdAt: serverTimestamp()
        };
        await addDoc(collection(db, 'survey_responses'), mockPayload);
      }
      await fetchData();
    } catch (e) {
      console.error(e);
      alert('Không thể nạp dữ liệu mẫu. Hãy đảm bảo tài khoản của bạn đã được cấu quyền!');
    } finally {
      setLoading(false);
    }
  };

  // Process data for charts
  const getGenderData = () => {
    const counts: { [key: string]: number } = {};
    responses.forEach(r => {
      counts[r.q1_gender] = (counts[r.q1_gender] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  const getGradeData = () => {
    const grades = ['6', '7', '8', '9'];
    const counts: { [key: string]: number } = {};
    grades.forEach(g => { counts[g] = 0; });
    responses.forEach(r => {
      if (counts[r.q2_grade] !== undefined) {
        counts[r.q2_grade]++;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name: `Lớp ${name}`, value }));
  };

  const getPhoneHoursData = () => {
    const counts: { [key: string]: number } = {
      'Dưới 1 giờ': 0, '1–3 giờ': 0, '3–5 giờ': 0, 'Trên 5 giờ': 0
    };
    responses.forEach(r => {
      if (counts[r.q7_phoneHours] !== undefined) {
        counts[r.q7_phoneHours]++;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  const getOpinionData = () => {
    const counts: { [key: string]: number } = {
      'Rất cần thiết': 0, 'Cần thiết': 0, 'Bình thường': 0, 'Không cần thiết': 0
    };
    responses.forEach(r => {
      if (counts[r.q15_deviceOpinion] !== undefined) {
        counts[r.q15_deviceOpinion]++;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  const getUsagePurposesData = () => {
    const counts: { [key: string]: number } = {
      'Học tập': 0, 'Chơi game': 0, 'Xem TikTok/Facebook': 0, 'Nhắn tin': 0, 'Khác': 0
    };
    responses.forEach(r => {
      if (r.q8_phoneUsage && Array.isArray(r.q8_phoneUsage)) {
        r.q8_phoneUsage.forEach(tag => {
          if (counts[tag] !== undefined) {
            counts[tag]++;
          }
        });
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 min-h-[400px]">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-505 text-sm font-semibold mt-3">Đang kết nối hệ thống...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-2 space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 border border-slate-200 rounded-lg p-4">
        <button
          id="admin-back-btn"
          onClick={onBack}
          className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-bold text-xs cursor-pointer transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Quay lại màn hình khảo sát
        </button>

        {user && (
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <span className="text-xs bg-blue-50 text-blue-700 font-bold px-3 py-1.5 rounded border border-blue-105 flex items-center gap-1">
              <Database className="w-3.5 h-3.5" />
              {user.email} (Admin)
            </span>
            <button
              id="admin-logout-btn"
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-150 flex items-center gap-1 transition-all cursor-pointer"
            >
              <LogOut className="w-3 h-3" />
              Đăng xuất
            </button>
          </div>
        )}
      </div>

      {/* Auth Gate view */}
      {!user ? (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto border-4 border-amber-100 font-semibold text-amber-600">
            <ShieldAlert className="w-8 h-8 text-amber-500 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              Yêu cầu quyền truy cập
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Theo chính sách bảo mật trong <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">firestore.rules</code>, chỉ những tài khoản thử nghiệm của nhóm nghiên cứu (hoặc người thử nghiệm trong môi trường Sandbox) mới có quyền đọc và lập biểu đồ phiếu khảo sát.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 text-xs p-3 rounded-lg text-left leading-relaxed font-medium">
              {error}
            </div>
          )}

          <button
            id="admin-google-login-btn"
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg border border-blue-650 shadow-sm transition-all duration-200 hover:-translate-y-0.5 cursor-pointer text-sm uppercase tracking-wide"
          >
            <LogIn className="w-4 h-4" />
            Đăng nhập tài khoản Google của bạn
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Title & Action controls */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                <BarChart2 className="w-6 h-6 text-blue-600" />
                Hệ thống quản trị & Biểu đồ thống kê
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-semibold">
                Lấy thông tin trực tiếp từ Firestore liên tục không qua trung gia.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                id="tab-btn-stats"
                onClick={() => setActiveTab('stats')}
                className={`px-4.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'stats'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Số liệu & Biểu đồ
              </button>
              <button
                id="tab-btn-list"
                onClick={() => setActiveTab('list')}
                className={`px-4.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'list'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Danh sách câu trả lời ({responses.length})
              </button>
              
              <button
                id="generate-mock-data-btn"
                onClick={generateMockData}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-650 font-bold px-3.5 py-2 rounded-lg text-xs flex items-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {loading ? 'Đang tạo...' : 'Tạo 5 phiếu mẫu'}
              </button>
            </div>
          </div>

          {/* Quick Metrics widget row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4.5 border border-slate-200 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between text-blue-600">
                <Users className="w-5 h-5" />
                <span className="text-[10px] font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-105">Tổng số</span>
              </div>
              <p className="text-2xl font-black text-slate-900 font-mono">{responses.length}</p>
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Phiếu gửi ghi nhận</p>
            </div>

            <div className="bg-white rounded-lg p-4.5 border border-slate-200 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between text-blue-600">
                <Smartphone className="w-5 h-5" />
                <span className="text-[10px] font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-105">Điện thoại</span>
              </div>
              <p className="text-2xl font-black text-slate-900 font-mono">
                {responses.length > 0
                  ? `${Math.round((responses.filter(r => r.q6_hasOwnPhone === 'Có').length / responses.length) * 100)}%`
                  : '0%'
                }
              </p>
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Có điện thoại riêng</p>
            </div>

            <div className="bg-white rounded-lg p-4.5 border border-slate-200 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between text-rose-650">
                <BookOpen className="w-5 h-5" />
                <span className="text-[10px] font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-105">Xao nhãng</span>
              </div>
              <p className="text-2xl font-black text-slate-900 font-mono">
                {responses.length > 0
                  ? `${Math.round((responses.filter(r => r.q13_easilyDistracted === 'Có').length / responses.length) * 100)}%`
                  : '0%'
                }
              </p>
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Dễ mất tập trung</p>
            </div>

            <div className="bg-white rounded-lg p-4.5 border border-slate-200 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between text-amber-650">
                <MessageSquare className="w-5 h-5" />
                <span className="text-[10px] font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-105">Máy AI</span>
              </div>
              <p className="text-2xl font-black text-slate-900 font-mono">
                {responses.length > 0
                  ? `${Math.round((responses.filter(r => ['Very necessary', 'Rất cần thiết', 'Cần thiết'].includes(r.q15_deviceOpinion)).length / responses.length) * 100)}%`
                  : '0%'
                }
              </p>
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Ủng hộ thiết bị AI</p>
            </div>
          </div>

          {/* TAB 1: Graphs panel */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              {responses.length === 0 ? (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-16 text-center space-y-3">
                  <p className="text-slate-500 text-sm font-semibold">Chưa có kết quả khảo sát thực tế nào ở cơ sở dữ liệu Firebase.</p>
                  <p className="text-xs text-slate-400">Hãy nhấn nút "Tạo 5 phiếu mẫu" ở trên hoặc điền đầy đủ phiếu khảo sát để làm hiển thị đồ thị.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Graph 1: Gender Distribution */}
                  <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
                    <h3 className="text-xs font-bold text-slate-800 border-b border-slate-200 pb-2 uppercase tracking-wide flex items-center gap-2">
                      <div className="accent-line !h-4" />
                      👦 Phân bố giới tính học sinh ({responses.length} mẫu)
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getGenderData()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius={80}
                            fill="#2563EB"
                            dataKey="value"
                          >
                            {getGenderData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Graph 2: Grades count */}
                  <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
                    <h3 className="text-xs font-bold text-slate-800 border-b border-slate-200 pb-2 uppercase tracking-wide flex items-center gap-2">
                      <div className="accent-line !h-4" />
                      🏫 Phân bố Khối lớp học
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getGradeData()}>
                          <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                          <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                          <Tooltip cursor={{ fill: '#f8fafc' }} />
                          <Bar dataKey="value" fill="#2563EB" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Graph 3: Daily use hours */}
                  <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
                    <h3 className="text-xs font-bold text-slate-800 border-b border-slate-200 pb-2 uppercase tracking-wide flex items-center gap-2">
                      <div className="accent-line !h-4" />
                      ⏱️ Thời gian lướt điện thoại mỗi ngày
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getPhoneHoursData()} layout="vertical">
                          <XAxis type="number" stroke="#64748b" fontSize={11} hide />
                          <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} width={80} tickLine={false} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Graph 4: App Usage stats */}
                  <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
                    <h3 className="text-xs font-bold text-slate-800 border-b border-slate-200 pb-2 uppercase tracking-wide flex items-center gap-2">
                      <div className="accent-line !h-4" />
                      🎬 Mục đích lướt màn hình nhiều nhất
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getUsagePurposesData()}>
                          <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                          <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#1D4ED8" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Graph 5: Device Opinions */}
                  <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs md:col-span-2 space-y-3">
                    <h3 className="text-xs font-bold text-slate-800 border-b border-slate-200 pb-2 uppercase tracking-wide flex items-center gap-2">
                      <div className="accent-line !h-4" />
                      🤖 Sự cần thiết của "Thiết bị chống nghiện & nhắc học bài bằng AI"
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getOpinionData()}>
                          <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                          <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#1E40AF" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Feed grid list response */}
          {activeTab === 'list' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Sidebar list items */}
              <div className="bg-white border border-slate-200 rounded-lg md:col-span-1 overflow-hidden flex flex-col max-h-[600px]">
                <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Các phiếu gửi gần đây ({responses.length})
                  </h3>
                </div>

                <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
                  {responses.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      Chưa có phiếu trả lời học sinh nào.
                    </div>
                  ) : (
                    responses.map((item) => {
                      const isSelected = selectedResponse?.id === item.id;
                      return (
                        <div
                          key={item.id}
                          className={`p-3.5 text-left cursor-pointer transition-all flex items-start justify-between gap-2.5 ${
                            isSelected ? 'bg-blue-50/50 border-l-4 border-l-blue-600' : 'hover:bg-slate-50'
                          }`}
                          onClick={() => setSelectedResponse(item)}
                        >
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{item.fullName}</h4>
                            <p className="text-[10px] text-slate-500 font-medium">
                              Lớp {item.q2_grade} • {item.q1_gender} • {item.q3_location}
                            </p>
                            <p className="text-[9px] font-mono text-slate-400">
                              {item.createdAt instanceof Date ? item.createdAt.toLocaleString('vi-VN') : 'Mới ghi nhận'}
                            </p>
                          </div>
                          
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.id) handleDelete(item.id);
                            }}
                            className="text-slate-400 hover:text-red-500 p-1 rounded-sm transition-colors cursor-pointer"
                            title="Xóa phiếu"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Detail view pane */}
              <div className="bg-white border border-slate-200 rounded-lg p-5 overflow-y-auto max-h-[600px] space-y-5 md:col-span-2">
                {selectedResponse ? (
                  <div className="space-y-6">
                    {/* Detail metadata block */}
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
                      <div>
                        <h3 className="text-base font-black text-slate-900">{selectedResponse.fullName}</h3>
                        <p className="text-[11px] font-semibold text-slate-500">
                          Sinh ngày: {selectedResponse.birthDate.split('-').reverse().join('/')} • Lớp {selectedResponse.q2_grade} • {selectedResponse.q1_gender}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded border border-blue-105">
                        {selectedResponse.q3_location}
                      </span>
                    </div>

                    {/* All questionnaire answers detail list */}
                    <div className="space-y-5">
                      {/* Section A */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                          <div className="accent-line !h-3" />
                          A. Thông tin chung
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 font-medium">
                          <p className="bg-slate-50 p-2.5 rounded border border-slate-100">
                            👪 Sống cùng: <span className="font-bold text-slate-900">{selectedResponse.q4_livingWith}</span>
                          </p>
                          <p className="bg-slate-50 p-2.5 rounded border border-slate-100">
                            ⏱️ Bố mẹ ở nhà đôn đốc: <span className="font-bold text-slate-900">{selectedResponse.q5_parentsHome}</span>
                          </p>
                        </div>
                      </div>

                      {/* Section B */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                          <div className="accent-line !h-3" />
                          B. Thực trạng lướt điện thoại
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-705 font-semibold">
                          <p className="bg-slate-50 p-2.5 rounded border border-slate-100">
                            📱 Sở hữu điện thoại: <span className="font-bold text-slate-900">{selectedResponse.q6_hasOwnPhone}</span>
                          </p>
                          <p className="bg-slate-50 p-2.5 rounded border border-slate-100">
                            ⏳ Dùng trên màn hình: <span className="font-bold text-rose-600">{selectedResponse.q7_phoneHours}</span>
                          </p>
                          <p className="bg-slate-50 p-2.5 rounded border border-slate-100">
                            🔁 Tần suất vừa học vừa lướt: <span className="font-bold text-rose-600">{selectedResponse.q9_studyWithPhone}</span>
                          </p>
                          <p className="bg-slate-50 p-2.5 rounded border border-slate-100">
                            🔔 Tác nhân gây mất tập trung: <span className="font-bold text-slate-900">{selectedResponse.q10_distractor}</span>
                          </p>
                        </div>

                        <div className="space-y-1.5 text-xs">
                          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-wider">🎯 Mục đích dùng điện thoại chính:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedResponse.q8_phoneUsage?.map((u) => (
                              <span key={u} className="bg-blue-50 text-blue-800 text-[10px] font-bold px-2.5 py-1 rounded border border-blue-105">
                                {u}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1.5 text-xs pt-1">
                          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-wider">⚠️ Các triệu chứng đã gặp phải:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedResponse.q11_experienced?.map((e) => (
                              <span key={e} className="bg-rose-50 text-rose-800 text-[10px] font-bold px-2.5 py-1 rounded border border-rose-105">
                                {e}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Section C */}
                      <div className="space-y-2 pt-1">
                        <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                          <div className="accent-line !h-3" />
                          C. Thói quen tự học & Ý kiến máy AI
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-705 font-semibold">
                          <p className="bg-slate-50 p-2.5 rounded border border-slate-100">
                            🕰️ Thời gian tự học: <span className="font-bold text-slate-900">{selectedResponse.q12_selfStudyHours}</span>
                          </p>
                          <p className="bg-slate-50 p-2.5 rounded border border-slate-100">
                            🧠 Khả năng xao nhãng: <span className="font-bold text-slate-900">{selectedResponse.q13_easilyDistracted}</span>
                          </p>
                          <p className="bg-slate-50 p-2.5 rounded border border-slate-100">
                            ⚡ Mong muốn một máy AI hỗ trợ học: <span className="font-bold text-blue-600">{selectedResponse.q14_wantsFocusDevice}</span>
                          </p>
                          <p className="bg-slate-50 p-2.5 rounded border border-slate-100 col-span-1 sm:col-span-2">
                            💎 Đánh giá mức độ cần thiết: <span className="font-bold text-amber-600">{selectedResponse.q15_deviceOpinion}</span>
                          </p>
                        </div>
                      </div>

                      {/* Section D */}
                      <div className="space-y-4 pt-1">
                        <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                          <div className="accent-line !h-3" />
                          D. Ý kiến tự sự thực tế
                        </h4>
                        <div className="space-y-3">
                          <div className="bg-slate-50 p-3 rounded border border-slate-200 relative pt-5.5">
                            <span className="absolute top-1.5 right-3 bg-blue-50 text-blue-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-blue-105">
                              Câu 16: Ảnh hưởng điện thoại
                            </span>
                            <p className="text-[11px] font-bold text-slate-650 italic">
                              "{selectedResponse.q16_phoneImpact || 'Học sinh chưa viết nhận định'}"
                            </p>
                          </div>

                          <div className="bg-slate-50 p-3 rounded border border-slate-200 relative pt-5.5">
                            <span className="absolute top-1.5 right-3 bg-slate-200 text-slate-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-slate-300">
                              Câu 17: Tính năng mong muốn thêm
                            </span>
                            <p className="text-[11px] font-bold text-slate-650 italic">
                              "{selectedResponse.q17_desiredFeatures || 'Học sinh chưa có đề xuất khác'}"
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center space-y-2 text-slate-400">
                    <Database className="w-10 h-10 text-slate-300 animate-pulse" />
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Bảng chi tiết phiếu gửi</p>
                    <p className="text-[10px] font-semibold">Nhấp chọn một học sinh trong danh sách bên trái để lấy báo cáo trả lời chi tiết.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
