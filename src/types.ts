export interface SurveyResponse {
  id?: string;
  fullName: string;
  birthDate: string;
  q1_gender: string; // "Nam" | "Nữ"
  q2_grade: string; // "6" | "7" | "8" | "9" | "10" | "11" | "12"
  q3_location: string; // "Thành phố" | "Nông thôn"
  q4_livingWith: string; // "Bố mẹ" | "Ông bà" | "Người thân khác"
  q5_parentsHome: string; // "Thường xuyên" | "Thỉnh thoảng" | "Ít khi"
  q6_hasOwnPhone: string; // "Có" | "Không"
  q7_phoneHours: string; // "Dưới 1 giờ" | "1–3 giờ" | "3–5 giờ" | "Trên 5 giờ"
  q8_phoneUsage: string[]; // List of usages, e.g. ["Học tập", "Chơi game", ...]
  q9_studyWithPhone: string; // "Thường xuyên" | "Thỉnh thoảng" | "Hiếm khi"
  q10_distractor: string; // "Điện thoại" | "Game" | "Mạng xã hội" | "Tiếng ồn" | "Khác"
  q11_experienced: string[]; // List of experiences, e.g. ["Thức khuya...", "Quên học bài..."]
  q12_selfStudyHours: string; // "Dưới 1 giờ" | "1–2 giờ" | "2–4 giờ" | "Trên 4 giờ"
  q13_easilyDistracted: string; // "Có" | "Không"
  q14_wantsFocusDevice: string; // "Có" | "Không"
  q15_deviceOpinion: string; // "Rất cần thiết" | "Cần thiết" | "Bình thường" | "Không cần thiết"
  q16_phoneImpact?: string; // Long text
  q17_desiredFeatures?: string; // Long text
  createdAt: any; // Date or Firestore Timestamp
}

export type SurveyStep = 'intro' | 'q_part_a' | 'q_part_b' | 'q_part_c' | 'q_part_d' | 'success';
