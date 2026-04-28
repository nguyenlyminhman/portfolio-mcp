import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
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
    private anthropic: Anthropic;

    constructor(
        private readonly cvMcp: McpCvService,
        private readonly githubMcp: McpGithubService,
        private readonly historyMcp: McpChatHistoryService,
    ) {
        this.anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });
    }

    // ─── Main: xử lý 1 lượt chat ─────────────────────────────────────────────

    async chat(sessionId: string, userMessage: string): Promise<string> {
        // 1. Lấy hoặc tạo conversation
        const conversation =
            await this.historyMcp.getOrCreateConversation(sessionId);

        // 2. Lưu tin nhắn HR
        await this.historyMcp.saveMessage(conversation.id, 'hr', userMessage);

        // 3. Thu thập context song song
        const [history, cv, repos] = await Promise.all([
            this.historyMcp.getHistory(conversation.id),
            this.cvMcp.getCv(),
            this.githubMcp.listRepos(),
        ]);

        // 4. Gọi Claude
        const reply = await this.callClaude({ userMessage, history, cv, repos });

        // 5. Lưu reply của bot
        await this.historyMcp.saveMessage(conversation.id, 'bot', reply);

        return reply;
    }

    // ─── Gọi Claude API ───────────────────────────────────────────────────────

    private async callClaude(params: {
        userMessage: string;
        history: { role: string; content: string }[];
        cv: object | null;
        repos: object[];
    }): Promise<string> {
        const { userMessage, history, cv, repos } = params;

        // Build context block đưa vào system
        const contextBlock = `
<context>
  <cv>
    ${cv ? JSON.stringify(cv, null, 2) : 'Không có dữ liệu CV'}
  </cv>
  <github_repos>
    ${repos.length ? JSON.stringify(repos, null, 2) : 'Không có dữ liệu GitHub'}
  </github_repos>
</context>
    `.trim();

        // Build messages từ lịch sử (bỏ tin nhắn hiện tại vì đã có trong messages)
        const messages: Anthropic.MessageParam[] = [
            // Lịch sử cũ
            ...history.slice(0, -1).map((m) => ({
                role: (m.role === 'hr' ? 'user' : 'assistant') as 'user' | 'assistant',
                content: m.content,
            })),
            // Tin nhắn hiện tại của HR
            {
                role: 'user' as const,
                content: userMessage,
            },
        ];

        const response = await this.anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: `${SYSTEM_PROMPT}\n\n${contextBlock}`,
            messages,
        });

        const block = response.content[0];
        if (block.type !== 'text') {
            throw new Error('Unexpected response type from Claude');
        }

        return block.text;
    }
}