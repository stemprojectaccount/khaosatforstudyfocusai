import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json({ limit: "15mb" }));

// Initialize Gemini API client on server-side
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Full analytical report & assistant AI prompt handler
app.post("/api/analyze-report", async (req, res) => {
  try {
    const { responses, customPrompt, analysisType } = req.body;

    if (!apiKey || !ai) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured. Please add it in Settings > Secrets.",
      });
    }

    if (!responses || !Array.isArray(responses)) {
      return res.status(400).json({ error: "Missing or invalid 'responses' array." });
    }

    // Prepare text summary of collected answers
    const totalCount = responses.length;
    let serializedData = `SỐ LIỆU KHẢO SÁT CHỐNG NGHIỆN ĐIỆN THOẠI BẰNG AI
Tổng số phiếu thu thập được: ${totalCount} phiếu.

`;

    responses.forEach((r, idx) => {
      serializedData += `=== Phiếu số ${idx + 1} ===
- Họ tên: ${r.fullName || "Ẩn danh"}
- Giới tính: ${r.q1_gender || "Chưa cung cấp"}
- Khối lớp: ${r.q2_grade || "Chưa cung cấp"}
- Nơi sinh sống: ${r.q3_location || "Chưa cung cấp"}
- Sống cùng ai: ${r.q4_livingWith || "Chưa cung cấp"}
- Có điện thoại riêng: ${r.q6_hasOwnPhone || "Chưa cung cấp"}
- Thời gian dùng điện thoại: ${r.q7_phoneHours || "Chưa cung cấp"}
- Việc chính dùng điện thoại: ${Array.isArray(r.q8_phoneUsage) ? r.q8_phoneUsage.join(", ") : r.q8_phoneUsage || "Không rõ"}
- Vừa học vừa dùng đt: ${r.q9_studyWithPhone || "Chưa cung cấp"}
- Yếu tố gây xao nhãng nhất: ${r.q10_distractor || "Chưa cung cấp"}
- Tác hại đã gặp: ${Array.isArray(r.q11_experienced) ? r.q11_experienced.join(", ") : r.q11_experienced || "Không rõ"}
- Thời gian tự học ở nhà: ${r.q12_selfStudyHours || "Chưa cung cấp"}
- Dễ bị xao nhãng không: ${r.q13_easilyDistracted || "Chưa cung cấp"}
- Mong muốn thiết bị nhắc tự học bằng AI không: ${r.q14_wantsFocusDevice || "Chưa cung cấp"}
- Nhận định về thiết bị: ${r.q15_deviceOpinion || "Chưa cung cấp"}
- Ảnh hưởng của điện thoại đối với bản thân: ${r.q16_phoneImpact || "Chưa cung cấp/Không có"}
- Tính năng mong muốn ở thiết bị chống nghiện điện thoại AI: ${r.q17_desiredFeatures || "Chưa cung cấp/Không có"}
\n`;
    });

    // Determine instructions based on analysisType
    let systemInstruction = "Bạn là một Trợ lý AI Chuyên gia Phân tích Dữ liệu Nghiên cứu Khoa học và Tâm lý học Đường xuất chúng. Bạn viết báo cáo phân tích, tổng hợp số liệu khoa học cực kỳ sâu sắc, mạch lạc với luận cứ sắc bén và ngôn từ học thuật nhưng dễ tiếp cận, hoàn toàn bằng tiếng Việt.";
    let promptText = "";

    if (analysisType === "full_report") {
      promptText = `Dựa trên dữ liệu của ${totalCount} phiếu khảo sát học sinh dưới đây, hãy lập một báo cáo nghiên cứu khoa học hoàn chỉnh, chi tiết và có cấu trúc rõ ràng về thực trạng thói quen sử dụng điện thoại, hành vi xao nhãng và giải pháp thiết kế thiết bị nhắc học bài chống nghiện điện thoại bằng AI.

Báo cáo cần phải có các phần sau:
1. Tóm tắt tổng quan (Mô tả khái quát số phiếu, mục đích nghiên cứu).
2. Phân tích thực trạng sử dụng điện thoại (Thời lượng sử dụng, mục đích chính, tỷ lệ có điện thoại riêng).
3. Tác hại học đường và thói quen tự học (Thức muộn, quên học bài, mức độ xao nhãng, so sánh giữa các khối lớp 6,7,8,9).
4. Phân tích nhu cầu về thiết bị chống nghiện điện thoại bằng AI (Mức độ cần thiết, tổng hợp các đề xuất tính năng mong muốn phong phú nhất từ học sinh).
5. Đề xuất giải pháp thiết kế sản phẩm chi tiết (Dựa trên nhu cầu học sinh, hãy phác thảo mô tả thiết bị chống nghiện bằng AI tối ưu nhất có tích hợp camera/âm thanh/nhắc nhở).
6. Kết luận & Đề xuất hành động (cho nhà trường, phụ huynh và nhóm nghiên cứu).

Yêu cầu: Viết theo ngôn từ chuẩn nghiên cứu khoa học (Academic), có số liệu dẫn chứng biểu đồ/phân tích phần trăm cụ thể ước lượng từ dữ liệu. Sử dụng định dạng Markdown đẹp, chuyên nghiệp.

Dưới đây là bộ dữ liệu khảo sát thực tế:
${serializedData}`;
    } else if (analysisType === "assistant") {
      promptText = `Dữ liệu của ${totalCount} phiếu khảo sát học sinh như sau:
${serializedData}

Yêu cầu của người điều hành nghiên cứu khoa học: "${customPrompt || "Hãy phân tích nhanh các ý kiến tự sự và đề xuất tính năng thiết bị ở câu 17"}"

Hãy trả lời phân tích câu hỏi trên một cách chuyên sâu, chi tiết, bám sát các thông tin thực tế trong dữ liệu khảo sát học sinh.`;
    } else {
      promptText = `Dựa trên dữ liệu khảo sát bên dưới, hãy tổng hợp nhanh các chỉ số thống kê nổi bật nhất dưới dạng tóm tắt ngắn gọi và đề xuất 3 tính năng AI quan trọng nhất học sinh mong đợi ở thiết bị chống nghiện.

Dữ liệu:
${serializedData}`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ result: response.text });
  } catch (error: any) {
    console.error("Gemini analysis error:", error);
    res.status(500).json({ error: error?.message || "Internal server error during analysis." });
  }
});

// Setup Vite middleware / static build production folder
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express custom server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
