import { Injectable, Logger, MessageEvent } from '@nestjs/common';
import { GoogleGenerativeAI, Content } from '@google/generative-ai';
import { Observable } from 'rxjs';
import { McpCvService } from '../mcp-cv/mcp-cv.service';
import { McpGithubService } from '../mcp-github/mcp-github.service';
import { McpChatHistoryService } from '../mcp-chat-history/mcp-chat-history.service';
import { McpHrService } from '../mcp-hr/mcp-hr.service';
import { ResponseDto } from 'src/common/payload.data';
import { AppUtil } from '../utils/app.util';

// ─── Years of Experience Calculator ──────────────────────────────────────────

/**
 * Parses a duration string like "Apr 2024 – Now" or "Jul 2019 – Mar 2022"
 * and returns { start: Date, end: Date }.
 */
function parseDuration(duration: string): { start: Date; end: Date } | null {
  const MONTH_MAP: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };

  // Normalise separator variations: "–", "—", "-", " to "
  const parts = duration.split(/\s*[–—\-]\s*|\s+to\s+/i).map((s) => s.trim());
  if (parts.length < 2) return null;

  const parseMonthYear = (raw: string): Date | null => {
    const now = /^now$/i.test(raw);
    if (now) return new Date();

    // e.g. "Apr 2024", "July 2019", "2020"
    const match = raw.match(/^([a-zA-Z]+)?\s*(\d{4})$/);
    if (!match) return null;

    const [, monthStr, yearStr] = match;
    const year = parseInt(yearStr, 10);
    const month = monthStr ? (MONTH_MAP[monthStr.slice(0, 3).toLowerCase()] ?? 0) : 0;
    return new Date(year, month, 1);
  };

  const start = parseMonthYear(parts[0]);
  const end = parseMonthYear(parts[1]);
  if (!start || !end) return null;

  return { start, end };
}

/**
 * Calculates total unique months of experience from professional_experience[].duration,
 * then converts to a human-readable string like "8 years 3 months".
 *
 * Overlapping periods are handled by collecting every month worked and de-duplicating.
 */
function calcYearsOfExperience(
  experiences: Array<{ duration?: string }>,
): string {
  const workedMonths = new Set<string>();

  for (const exp of experiences) {
    if (!exp.duration) continue;
    const parsed = parseDuration(exp.duration);
    if (!parsed) continue;

    const { start, end } = parsed;
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);

    while (cursor <= end) {
      workedMonths.add(`${cursor.getFullYear()}-${cursor.getMonth()}`);
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  const totalMonths = workedMonths.size;
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  if (years === 0) return `${months} tháng`;
  if (months === 0) return `${years} năm`;
  return `${years} năm ${months} tháng`;
}

/**
 * Builds the experience line to inject into the system prompt.
 * Falls back to the hard-coded value if cv_content is unavailable.
 */
function buildExperienceLine(cv: { cv_content?: unknown } | null): string {
  const DEFAULT = '8+ năm';

  if (!cv?.cv_content) return DEFAULT;

  const content = cv.cv_content as Record<string, unknown>;
  const experiences = content['professional_experience'];

  if (!Array.isArray(experiences) || experiences.length === 0) return DEFAULT;

  return calcYearsOfExperience(experiences);
}

// ─── System Prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(yearsOfExperience: string): string {
  return `
Bạn là Neko — trợ lý ảo đại diện cho Nguyễn Lý Minh Mẫn, một Senior Full Stack Software Engineer với ${yearsOfExperience} kinh nghiệm.

DANH TÍNH — BẮT BUỘC:
- Tên của bạn là "Neko". LUÔN LUÔN tự giới thiệu là "Neko".
- TUYỆT ĐỐI KHÔNG dùng bất kỳ tên nào khác (Manos, Mẫn, AI, Bot...).
- Nếu HR hỏi tên bạn là gì → trả lời: "Mình là Manos".

CÁCH TRẢ LỜI — BẮT BUỘC:
- KHÔNG bao giờ tóm tắt hoặc nhắc lại nội dung của tin nhắn trước đó.
- KHÔNG bắt đầu câu trả lời bằng cách lặp lại câu hỏi hay câu trả lời cũ.
- Trả lời THẲNG vào câu hỏi hiện tại — ngắn gọn, súc tích.
- Xưng "mình", gọi HR bằng tên nếu đã biết, nếu chưa thì gọi là "bạn".
- Chỉ trả lời dựa trên thông tin CV và GitHub được cung cấp, không bịa đặt.
- Nếu không có thông tin: "Mình chưa có kinh nghiệm về mảng này".
- Nếu HR hỏi về lương hay thời gian bắt đầu: gợi ý email nguyenlyminhman@gmail.com hoặc xem Contact trên trang web hiện tại.
`.trim();
}


// ─── Gemini Resilience Helpers ───────────────────────────────────────────────

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.5-flash-lite';
const GEMINI_MAX_RETRIES = Number(process.env.GEMINI_MAX_RETRIES || 3);
const GEMINI_QUEUE_CONCURRENCY = Number(process.env.GEMINI_QUEUE_CONCURRENCY || 2);
const GEMINI_MIN_INTERVAL_MS = Number(process.env.GEMINI_MIN_INTERVAL_MS || 700);
const GEMINI_MAX_RETRY_DELAY_MS = Number(process.env.GEMINI_MAX_RETRY_DELAY_MS || 8000);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(err: any): boolean {
  const status = err?.status || err?.response?.status || err?.error?.code;
  const message = String(err?.message || err?.error?.message || '');
  return status === 429 || message.includes('429') || message.includes('RESOURCE_EXHAUSTED');
}

function getRetryDelayMs(err: any, attempt: number): number {
  const retryDelay = err?.errorDetails?.find?.((x: any) => x?.retryDelay)?.retryDelay;

  if (typeof retryDelay === 'string') {
    const seconds = Number(retryDelay.replace('s', ''));
    if (!Number.isNaN(seconds)) {
      return Math.min(seconds * 1000, GEMINI_MAX_RETRY_DELAY_MS);
    }
  }

  const exponential = 1000 * 2 ** attempt;
  const jitter = Math.floor(Math.random() * 300);
  return Math.min(exponential + jitter, GEMINI_MAX_RETRY_DELAY_MS);
}

function buildBusyMessage(userMessage: string): string {
  const isVn = AppUtil.isVietnamese(userMessage);

  if (isVn) {
    return 'Neko đang nhận hơi nhiều câu hỏi cùng lúc nên phản hồi chậm một chút. Bạn cứ hỏi tiếp nhé, mình vẫn giữ cuộc hội thoại này và sẽ trả lời ngay khi hệ thống ổn định hơn. ⚡';
  }

  return 'Neko is receiving many questions at once, so the response is a bit delayed. You can keep asking — I will keep this conversation and reply as soon as the system is stable again. ⚡';
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private genAI: GoogleGenerativeAI;

  private static activeGeminiRequests = 0;
  private static waitingGeminiResolvers: Array<() => void> = [];
  private static lastGeminiRequestAt = 0;

  constructor(
    private readonly cvMcp: McpCvService,
    private readonly githubMcp: McpGithubService,
    private readonly historyMcp: McpChatHistoryService,
    private readonly hrMcp: McpHrService,
  ) {
    if (!process.env.GOOGLE_GENAI_API_KEY) {
      throw new Error('Missing GOOGLE_GENAI_API_KEY');
    }

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
            this.historyMcp.getHistory(conversation.id, 20),
            this.cvMcp.getCv(),
            this.githubMcp.listRepos(),
          ]);

          // 7. Tính số năm kinh nghiệm từ cv_content.professional_experience
          const yearsOfExperience = buildExperienceLine(cv as { cv_content?: unknown } | null);

          // 8. Build context block
          const { chatHistory, contextBlock } = this.buildContext({ history, cv, repos });

          // 9. Build HR instruction block
          const isGreeting = freshHrCtx
            ? this.hrMcp.isGreetingOnly(userMessage)
            : false;

          const hrBlock = freshHrCtx
            ? this.hrMcp.buildHrSystemBlock(freshHrCtx, isGreeting)
            : '';

          // 10. Tạo model với system prompt đầy đủ (bao gồm số năm kinh nghiệm động)
          const systemInstruction = [buildSystemPrompt(yearsOfExperience), hrBlock, contextBlock]
            .filter(Boolean)
            .join('\n\n');

          // 11. Gọi Gemini qua queue + retry.
          // Nếu model chính bị 429 liên tục, fallback sang Flash Lite để không làm đứt flow HR.
          const result = await this.sendGeminiStreamWithRetry({
            userMessage,
            chatHistory,
            systemInstruction,
          });

          // const data = await result.response;

    // usageMetadata: {
    // promptTokenCount: 5665,
    // candidatesTokenCount: 38,
    // totalTokenCount: 6685,
    // promptTokensDetails: [ [Object] ],
    // thoughtsTokenCount: 982,
    // serviceTier: 'standard'
  // },

          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              fullReply += text;
              subscriber.next({ data: { chunk: text } });
            }
          }

          // res 
          
           

          subscriber.next({ data: { done: true, fullReply } });
          subscriber.complete();
        } catch (err: any) {
          this.logger.error('Gemini chatStream failed', err?.stack || err);

          const errorMessage = buildBusyMessage(userMessage);

          fullReply = errorMessage;
          subscriber.next({ data: { error: true, message: errorMessage } });
          subscriber.complete();
        } finally {
          if (conversationId) {
            await this.historyMcp.saveMessage(conversationId, 'bot', fullReply);
          }
        }
      })();
    });
  }


  private async waitForGeminiSlot(): Promise<void> {
    if (ChatService.activeGeminiRequests >= GEMINI_QUEUE_CONCURRENCY) {
      await new Promise<void>((resolve) => {
        ChatService.waitingGeminiResolvers.push(resolve);
      });
    }

    ChatService.activeGeminiRequests += 1;

    const now = Date.now();
    const diff = now - ChatService.lastGeminiRequestAt;

    if (diff < GEMINI_MIN_INTERVAL_MS) {
      await sleep(GEMINI_MIN_INTERVAL_MS - diff);
    }

    ChatService.lastGeminiRequestAt = Date.now();
  }

  private releaseGeminiSlot(): void {
    ChatService.activeGeminiRequests = Math.max(0, ChatService.activeGeminiRequests - 1);

    const next = ChatService.waitingGeminiResolvers.shift();
    if (next) {
      next();
    }
  }

  private async runGeminiQueued<T>(task: () => Promise<T>): Promise<T> {
    await this.waitForGeminiSlot();

    try {
      return await task();
    } finally {
      this.releaseGeminiSlot();
    }
  }

  private createChatSession(params: {
    modelName: string;
    chatHistory: Content[];
    systemInstruction: string;
  }) {
    const model = this.genAI.getGenerativeModel({
      model: params.modelName,
      systemInstruction: params.systemInstruction,
    });

    return model.startChat({
      history: params.chatHistory,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.2,
      },
    });
  }

  private async sendGeminiStreamWithRetry(params: {
    userMessage: string;
    chatHistory: Content[];
    systemInstruction: string;
  }) {
    let lastError: any;

    for (let attempt = 0; attempt <= GEMINI_MAX_RETRIES; attempt++) {
      try {
        return await this.runGeminiQueued(async () => {
          const chatSession = this.createChatSession({
            modelName: GEMINI_MODEL,
            chatHistory: params.chatHistory,
            systemInstruction: params.systemInstruction,
          });

          return chatSession.sendMessageStream(params.userMessage);
        });
      } catch (err: any) {
        lastError = err;

        if (!isRateLimitError(err) || attempt === GEMINI_MAX_RETRIES) {
          break;
        }

        const delayMs = getRetryDelayMs(err, attempt);
        this.logger.warn(`Gemini 429. Retry ${attempt + 1}/${GEMINI_MAX_RETRIES} after ${delayMs}ms`);
        await sleep(delayMs);
      }
    }

    if (isRateLimitError(lastError) && GEMINI_FALLBACK_MODEL) {
      this.logger.warn(`Gemini primary model exhausted. Falling back to ${GEMINI_FALLBACK_MODEL}`);

      return this.runGeminiQueued(async () => {
        const fallbackChatSession = this.createChatSession({
          modelName: GEMINI_FALLBACK_MODEL,
          chatHistory: params.chatHistory,
          systemInstruction: params.systemInstruction,
        });

        return fallbackChatSession.sendMessageStream(params.userMessage);
      });
    }

    throw lastError;
  }

  // ── History ────────────────────────────────────────────────────────────────

  async fetchChatHistory(sessionId: string): Promise<ResponseDto> {
    const responseDto = new ResponseDto();
    try {
      const conversation = await this.historyMcp.getOrCreateConversation(sessionId);
      responseDto.data = await this.historyMcp.getHistory(conversation.id, 500);
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
    // Tin của model: cắt ngắn còn 300 ký tự để Gemini không "warm up" lại nội dung cũ
    const MAX_MODEL_MSG_LENGTH = 300;
    const normalized = previousMessages.map((m) => {
      const isUser = m.role === 'hr' || m.role === 'user';
      let text = m.content ?? '';
      if (!isUser && text.length > MAX_MODEL_MSG_LENGTH) {
        text = text.slice(0, MAX_MODEL_MSG_LENGTH) + '…';
      }
      return {
        role: isUser ? 'user' : 'model',
        parts: [{ text }],
      };
    });

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

    // 2. Đảm bảo xen kẽ user/model: nếu 2 role giống nhau liên tiếp → bỏ cái sau
    // KHÔNG gộp nội dung vì sẽ khiến Gemini tóm tắt lại tin cũ trước khi trả lời
    const chatHistory: Content[] = [];
    for (const msg of trimmed) {
      const last = chatHistory[chatHistory.length - 1];
      if (last && last.role === msg.role) {
        // Bỏ qua — CV/GitHub context đã đủ để Gemini trả lời đúng
        continue;
      }
      chatHistory.push(msg as Content);
    }

    // 3. Nếu tin cuối là 'model', bỏ đi (Gemini không chấp nhận kết thúc bằng model)
    if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'model') {
      chatHistory.pop();
    }

    return { chatHistory, contextBlock };
  }
}