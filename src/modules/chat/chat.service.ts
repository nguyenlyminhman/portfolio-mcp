import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI, Content } from '@google/generative-ai';
import { Observable } from 'rxjs';
import { MessageEvent } from '@nestjs/common';
import { McpCvService } from '../mcp-cv/mcp-cv.service';
import { McpGithubService } from '../mcp-github/mcp-github.service';
import { McpChatHistoryService } from '../mcp-chat-history/mcp-chat-history.service';
import { McpHrService } from '../mcp-hr/mcp-hr.service';
import { ResponseDto } from 'src/common/payload.data';

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `
Bạn là Neko — trợ lý ảo đại diện cho Nguyễn Lý Minh Mẫn, một Senior Full Stack Software Engineer với hơn 8 năm kinh nghiệm.

Tên của bạn là "Neko". Khi giới thiệu bản thân, hãy nói: "Mình là Neko" — KHÔNG bao giờ nói "mình là Mẫn" hay "mình là Nguyễn Lý Minh Mẫn".

Nhiệm vụ của bạn là thay Mẫn trả lời các câu hỏi từ HR và Tech team một cách chuyên nghiệp, tự nhiên và trung thực.

Nguyên tắc khi trả lời:
- Xưng "mình", gọi HR bằng tên nếu đã biết, nếu chưa thì gọi là "bạn" — thân thiện nhưng vẫn chuyên nghiệp
- Chỉ trả lời dựa trên thông tin CV và GitHub được cung cấp, không bịa đặt
- Nếu không có thông tin, hãy nói thẳng: "Mình chưa có kinh nghiệm về mảng này"
- Khi HR hỏi về kỹ năng kỹ thuật, hãy dẫn chứng bằng dự án thực tế nếu có
- Giữ câu trả lời ngắn gọn, súc tích — không dài dòng quá 4-5 câu trừ khi được hỏi chi tiết
- Nếu HR hỏi về mức lương hay thời gian bắt đầu, hãy gợi ý liên hệ trực tiếp qua email: nguyenlyminhman@gmail.com
`.trim();

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class ChatService {
  private genAI: GoogleGenerativeAI;

  constructor(
    private readonly cvMcp: McpCvService,
    private readonly githubMcp: McpGithubService,
    private readonly historyMcp: McpChatHistoryService,
    private readonly hrMcp: McpHrService,
  ) {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY);
  }

  // ── Stream ─────────────────────────────────────────────────────────────────

  chatStream(sessionId: string, userMessage: string): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      (async () => {
        let fullReply = '';
        let conversationId = '';

        try {
          // 1. Lấy hoặc tạo conversation
          const conversation = await this.historyMcp.getOrCreateConversation(sessionId);
          conversationId = conversation.id;

          // 2. Lưu tin nhắn người dùng
          await this.historyMcp.saveMessage(conversation.id, 'hr', userMessage);

          // 3. Lấy HR context trước — có thể throw nếu session chưa tồn tại
          const hrCtx = await this.hrMcp.getSessionContext(sessionId).catch(() => null);

          // 4. Nếu có session HR: trích xuất & cập nhật profile từ tin nhắn mới
          if (hrCtx) {
            const extracted = this.hrMcp.extractProfileFromMessage(userMessage, hrCtx.profile);
            if (Object.keys(extracted).length > 0) {
              await this.hrMcp.updateProfile(sessionId, extracted);
            }
          }

          // 5. Lấy context HR đã cập nhật (sau khi updateProfile)
          const freshHrCtx = hrCtx
            ? await this.hrMcp.getSessionContext(sessionId).catch(() => null)
            : null;

          // 6. Lấy song song history, CV, repos
          const [history, cv, repos] = await Promise.all([
            this.historyMcp.getHistory(conversation.id),
            this.cvMcp.getCv(),
            this.githubMcp.listRepos(),
          ]);

          // 7. Build context block
          const { chatHistory, contextBlock } = this.buildContext({ history, cv, repos });

          // 8. Build HR instruction block
          const isGreeting = freshHrCtx
            ? this.hrMcp.isGreetingOnly(userMessage)
            : false;

          const hrBlock = freshHrCtx
            ? this.hrMcp.buildHrSystemBlock(freshHrCtx, isGreeting)
            : '';

          // 9. Tạo model với system prompt đầy đủ
          const model = this.genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: [SYSTEM_PROMPT, hrBlock, contextBlock]
              .filter(Boolean)
              .join('\n\n'),
          });

          const chatSession = model.startChat({
            history: chatHistory,
            generationConfig: { maxOutputTokens: 1024, temperature: 0.2 },
          });

          // 10. Stream từng chunk về client
          const result = await chatSession.sendMessageStream(userMessage);

          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              fullReply += text;
              subscriber.next({ data: { chunk: text } });
            }
          }

          subscriber.next({ data: { done: true, fullReply } });
          
        } catch (err: any) {
          console.error('Error in chatStream:', err);
          let errorMessage = `Neko đang 'sạc pin' một chút, 1 phút nữa mình sẽ sẵn sàng ngay! ⚡\n Neko is 'recharging' for a bit—I'll be back and ready in just a minute! ⚡`;

          if (err?.status === 429 || err?.message?.includes('429')) {
            errorMessage = `Resource của gói Free có hạn nhưng lòng mến khách của Neko thì vô biên. Tiếc là API Request không cho phép mình nói quá nhanh, đợi mình 1 phút nhé! ⚡\nThe Free Tier's resources have their limits, but Neko's welcome is infinite. Hang with me for a minute! ⚡`;
          }

          fullReply = errorMessage;
          subscriber.next({ data: { error: true, message: errorMessage } });
          
        } finally {
          await this.historyMcp.saveMessage(conversationId, 'bot', fullReply);
          subscriber.complete();
        }
      })();
    });
  }

  // ── History ────────────────────────────────────────────────────────────────

  async fetchChatHistory(sessionId: string): Promise<ResponseDto> {
    const responseDto = new ResponseDto();
    try {
      const conversation = await this.historyMcp.getOrCreateConversation(sessionId);
      responseDto.data = await this.historyMcp.getHistory(conversation.id);
    } catch {
      responseDto.data = { history: [] };
    }
    return responseDto;
  }

  // ── Context Builder ────────────────────────────────────────────────────────

  private buildContext(params: {
    history: { role: string; content: string }[];
    cv: object | null;
    repos: object[];
  }) {
    const { history, cv, repos } = params;

    const contextBlock = `
<context>
  <cv>
    ${cv ? JSON.stringify(cv, null, 2) : 'Không có dữ liệu CV'}
  </cv>
  <github_repos>
    ${repos.length ? JSON.stringify(repos, null, 2) : 'Không có dữ liệu GitHub'}
  </github_repos>
</context>`.trim();

    // Bỏ tin nhắn hiện tại (cuối cùng) ra khỏi history vì sẽ gửi qua sendMessageStream
    const previousMessages = history.slice(0, -1);

    // Chuẩn hoá role về 'user' | 'model'
    const normalized = previousMessages.map((m) => ({
      role: m.role === 'hr' || m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content ?? '' }],
    }));

    // Gemini yêu cầu: phải bắt đầu bằng 'user' và xen kẽ user/model
    // → bỏ các tin model ở đầu, rồi đảm bảo xen kẽ đúng
    let trimmed = normalized;

    // 1. Bỏ các phần tử model ở đầu cho đến khi gặp user đầu tiên
    const firstUserIdx = trimmed.findIndex((m) => m.role === 'user');
    if (firstUserIdx === -1) {
      // Không có tin user nào → truyền history rỗng, an toàn nhất
      trimmed = [];
    } else {
      trimmed = trimmed.slice(firstUserIdx);
    }

    // 2. Đảm bảo xen kẽ: nếu 2 role giống nhau liên tiếp, bỏ cái sau
    const chatHistory: Content[] = [];
    for (const msg of trimmed) {
      const last = chatHistory[chatHistory.length - 1];
      if (last && last.role === msg.role) {
        // Gộp nội dung vào tin trước thay vì bỏ, tránh mất context
        (last.parts as { text: string }[]).push({ text: msg.parts[0].text });
      } else {
        chatHistory.push(msg as Content);
      }
    }

    // 3. Nếu tin cuối là 'model', bỏ đi (Gemini không chấp nhận kết thúc bằng model)
    if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'model') {
      chatHistory.pop();
    }

    return { chatHistory, contextBlock };
  }
}