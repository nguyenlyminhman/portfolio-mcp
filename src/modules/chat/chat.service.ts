import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI, Content } from '@google/generative-ai';
import { Observable } from 'rxjs';
import { MessageEvent } from '@nestjs/common';
import { McpCvService } from '../mcp-cv/mcp-cv.service';
import { McpGithubService } from '../mcp-github/mcp-github.service';
import { McpChatHistoryService } from '../mcp-chat-history/mcp-chat-history.service';
import { ResponseDto } from 'src/common/payload.data';

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
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY);
  }

  async chat(sessionId: string, userMessage: string): Promise<string> {
    const conversation = await this.historyMcp.getOrCreateConversation(sessionId);
    await this.historyMcp.saveMessage(conversation.id, 'hr', userMessage);

    const [history, cv, repos] = await Promise.all([
      this.historyMcp.getHistory(conversation.id),
      this.cvMcp.getCv(),
      this.githubMcp.listRepos(),
    ]);

    const reply = await this.callGemini({ userMessage, history, cv, repos });
    await this.historyMcp.saveMessage(conversation.id, 'bot', reply);

    return reply;
  }

  chatStream(sessionId: string, userMessage: string): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      (async () => {
        let fullReply = '';
        let conversationId = '';
        try {
          // 1. Lấy context
          const conversation = await this.historyMcp.getOrCreateConversation(sessionId);
          conversationId = conversation.id;

          await this.historyMcp.saveMessage(conversation.id, 'hr', userMessage);

          const [history, cv, repos] = await Promise.all([
            this.historyMcp.getHistory(conversation.id),
            this.cvMcp.getCv(),
            this.githubMcp.listRepos(),
          ]);

          // 2. Build context
          const { chatHistory, contextBlock } = this.buildContext({ history, cv, repos });

          // 3. Khởi tạo model + chat session
          const model = this.genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: `${SYSTEM_PROMPT}\n\n${contextBlock}`,
          });

          const chatSession = model.startChat({
            history: chatHistory,
            generationConfig: { maxOutputTokens: 1024, temperature: 0.2 },
          });

          // 4. Stream từng chunk về client
          const result = await chatSession.sendMessageStream(userMessage);

          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              fullReply += text;
              subscriber.next({ data: { chunk: text } }); // frontend nhận từng chữ\
            }
          }

          // 5. Báo done + lưu full reply
          subscriber.next({ data: { done: true, fullReply } });
          // await this.historyMcp.saveMessage(conversation.id, 'bot', fullReply);

          subscriber.complete();
        } catch (err) {
          // Gửi thông báo lỗi cụ thể về cho UI thay vì chỉ crash stream
          let errorMessage = `Manny đang 'sạc pin' một chút, 1 phút nữa mình sẽ sẵn sàng ngay! ⚡

                    Manny is 'recharging' for a bit—I'll be back and ready in just a minute! ⚡`;

          // Check lỗi Rate Limit từ Gemini
          if (err.status === 429 || err.message?.includes('429')) {
            errorMessage = `Resource của gói Free có hạn nhưng lòng mến khách của Mẫn thì vô biên. Tiếc là API Request không cho phép mình nói quá nhanh, đợi mình 1 phút nhé! ⚡ 

                    The Free Tier's resources have their limits, but Mẫn’s welcome is infinite. Too bad the API requests keep me from talking too fast. Hang with me for a minute! ⚡`;
          }

          for await (const chunk of errorMessage) {
            const text = chunk;
            if (text) {
              fullReply += text;
              subscriber.next({ data: { error: true, message: errorMessage } }); // frontend nhận từng chữ
            }
          }

          subscriber.complete(); // Đóng stream một cách chủ động
        } finally {
          await this.historyMcp.saveMessage(conversationId, 'bot', fullReply);
        }
      })();
    });
  }

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

    const chatHistory: Content[] = history.slice(0, -1).map((m) => ({
      role: m.role === 'hr' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    return { chatHistory, contextBlock };
  }
  //MessageEvent {isTrusted: true, data: '[GoogleGenerativeAI Error]: Error fetching from ht…://ai.google.dev/gemini-api/docs/billing#prepay. ', origin: 'http://localhost:3001', lastEventId: '1', source: null, …}_
  private async callGemini(params: {
    userMessage: string;
    history: { role: string; content: string }[];
    cv: object | null;
    repos: object[];
  }): Promise<string> {
    const { userMessage, history, cv, repos } = params;

    const { chatHistory, contextBlock } = this.buildContext({ history, cv, repos });

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: `${SYSTEM_PROMPT}\n\n${contextBlock}`,
    });

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

  async fetchChatHistory(sessionId: string): Promise<ResponseDto> {
    const responseDto = new ResponseDto();

    try {
      const conversation = await this.historyMcp.getOrCreateConversation(sessionId);
      const history = await this.historyMcp.getHistory(conversation.id);

      responseDto.data =  history; 
    } catch (error) {
      responseDto.data = { history: [] };
    }

    return responseDto;
  }
}