import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI, Content } from '@google/generative-ai';
import { McpCvService } from '../mcp-cv/mcp-cv.service';
import { McpGithubService } from '../mcp-github/mcp-github.service';
import { McpChatHistoryService } from '../mcp-chat-history/mcp-chat-history.service';

const SYSTEM_PROMPT = `
Bạn là trợ lý ảo đại diện cho Nguyễn Lý Minh Mẫn — một Senior Full Stack Software Engineer với hơn 8 năm kinh nghiệm.
Nhiệm vụ của bạn là thay Mẫn trả lời các câu hỏi từ HR và Tech team một cách chuyên nghiệp, tự nhiên và trung thực.

Nguyên tắc khi trả lời:
- Xưng "mình" thay cho "tôi", gọi HR là "bạn" — thân thiện nhưng vẫn chuyên nghiệp
- Chỉ trả lời dựa trên thông tin CV và GitHub được cung cấp, không bịa đặt
- Nếu không có thông tin, hãy nói thẳng: "Mình chưa có kinh nghiệm về mảng này"
- Khi HR hỏi về kỹ năng kỹ thuật, hãy dẫn chứng bằng dự án thực tế nếu có
- Giữ câu trả lời ngắn gọn, súc tích — không dài dòng quá 4-5 câu trừ khi được hỏi chi tiết
- Nếu HR hỏi về mức lương hay thời gian bắt đầu, hãy gợi ý liên hệ trực tiếp qua email: nguyenlyminhman@gmail.com
`.trim();

@Injectable()
export class ChatService {
    private genAI: GoogleGenerativeAI;

    constructor(
        private readonly cvMcp: McpCvService,
        private readonly githubMcp: McpGithubService,
        private readonly historyMcp: McpChatHistoryService,
    ) {
        // Khởi tạo SDK với API Key của bạn
        this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY);
    }

    async chat(sessionId: string, userMessage: string): Promise<string> {
        // 1. Lấy hoặc tạo phiên hội thoại từ database
        const conversation = await this.historyMcp.getOrCreateConversation(sessionId);

        // 2. Lưu tin nhắn của người dùng (HR)
        await this.historyMcp.saveMessage(conversation.id, 'hr', userMessage);

        // 3. Lấy dữ liệu ngữ cảnh
        const [history, cv, repos] = await Promise.all([
            this.historyMcp.getHistory(conversation.id),
            this.cvMcp.getCv(),
            this.githubMcp.listRepos(),
        ]);

        // 4. Gọi API Gemini 2.0 Flash
        const reply = await this.callGemini({ userMessage, history, cv, repos });

        // 5. Lưu phản hồi của bot
        await this.historyMcp.saveMessage(conversation.id, 'bot', reply);

        return reply;
    }

    private async callGemini(params: {
        userMessage: string;
        history: { role: string; content: string }[];
        cv: object | null;
        repos: object[];
    }): Promise<string> {
        const { userMessage, history, cv, repos } = params;

        // Xây dựng khối dữ liệu bổ trợ cho mô hình
        const contextBlock = `
<context>
  <cv>
    ${cv ? JSON.stringify(cv, null, 2) : 'Không có dữ liệu CV'}
  </cv>
  <github_repos>
    ${repos.length ? JSON.stringify(repos, null, 2) : 'Không có dữ liệu GitHub'}
  </github_repos>
</context>`.trim();

        // Khởi tạo model với phiên bản 2.0 Flash
        const model = this.genAI.getGenerativeModel({
            model: 'gemini-2.0-flash', 
            systemInstruction: `${SYSTEM_PROMPT}\n\n${contextBlock}`,
        });

        // Định dạng lại lịch sử chat cho phù hợp với yêu cầu của SDK (user/model)
        const chatHistory: Content[] = history.slice(0, -1).map((m) => ({
            role: m.role === 'hr' ? 'user' : 'model',
            parts: [{ text: m.content }],
        }));

        const chatSession = model.startChat({
            history: chatHistory,
            generationConfig: {
                maxOutputTokens: 1024,
                temperature: 0.2, // Giảm temperature để câu trả lời chính xác và ít bịa đặt hơn
            },
        });

        const result = await chatSession.sendMessage(userMessage);
        return result.response.text();
    }
}