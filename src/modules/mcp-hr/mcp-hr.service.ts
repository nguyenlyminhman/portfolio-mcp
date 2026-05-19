import { Injectable } from '@nestjs/common';
import { DbConnectService } from '../db-connect/db-connect.service';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface HrProfile {
  name?: string;
  company?: string;
  companyWebsite?: string;
  companyAddress?: string;
  isCompanyVerified?: boolean;
  hasRefusedInfo?: boolean;
}

export interface HrSessionContext {
  sessionId: string;
  profile: HrProfile;
  isProfileComplete: boolean;
  missingFields: string[];
}

export interface CompanySearchResult {
  found: boolean;
  website?: string;
  description?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const REQUIRED_FIELDS: (keyof HrProfile)[] = ['name', 'company'];

const CONTACT_EMAIL = 'nguyenlyminhman@gmail.com';

const REFUSAL_PATTERNS = [
  /không tiện/i,
  /bí mật/i,
  /tại sao phải/i,
  /không cần biết/i,
  /từ chối/i,
  /không muốn nói/i,
  /không cần thiết/i,
  /khỏi cần/i,
  /kệ tôi/i,
  /cứ xem cv/i,
];

/**
 * Các mẫu tin nhắn chào hỏi thuần túy — chưa mang thông tin nào.
 * Dùng để nhận biết HR chỉ đang mở đầu cuộc trò chuyện.
 */
const GREETING_PATTERNS = [
  /^h+e+l+o+[!?.]*$/i,           // hello, helloooo
  /^h+i+[!?.]*$/i,                // hi, hiii
  /^hey[!?.]*$/i,
  /^xin\s*chào[!?.\s]*$/i,
  /^chào(\s*bạn)?[!?.\s]*$/i,
  /^chào\s*(buổi)?\s*(sáng|trưa|chiều|tối)[!?.\s]*$/i,
  /^good\s*(morning|afternoon|evening|day)[!?.\s]*$/i,
  /^(alo|alô)[!?.\s]*$/i,
  /^(yo|sup|hola)[!?.\s]*$/i,
  /^(bạn|mn|anh|chị)\s*ơi[!?.\s]*$/i,  // "bạn ơi", "anh ơi"
  /^(có\s*ai|ai\s*đó)\s*(ở\s*đây|không)[!?.\s]*$/i,
];

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class McpHrService {
  constructor(private readonly db: DbConnectService) {}

  // ── DB Helpers ─────────────────────────────────────────────────────────────

  /**
   * Lấy session context hiện tại từ DB.
   * Tên HR được lưu vào cột `user_agent`, profile JSON lưu vào `company_hint`.
   */
  async getSessionContext(sessionId: string): Promise<HrSessionContext> {
    const session = await this.db.hr_sessions.findUnique({
      where: { cookie_token: sessionId },
    });

    if (!session) {
      throw new Error(`HR session not found: ${sessionId}`);
    }

    let profile: HrProfile = {};

    // Lấy tên từ cột user_agent
    if (session.user_agent) {
      profile.name = session.user_agent;
    }

    // Lấy thông tin công ty từ cột company_hint (JSON hoặc plain text)
    if (session.company_hint) {
      try {
        const parsed = JSON.parse(session.company_hint);
        // Merge nhưng ưu tiên name từ user_agent nếu đã có
        profile = { ...parsed, ...(profile.name ? { name: profile.name } : {}) };
      } catch {
        profile.company = session.company_hint;
      }
    }

    const missingFields = REQUIRED_FIELDS.filter((f) => !profile[f]);
    const isProfileComplete = missingFields.length === 0 && !profile.hasRefusedInfo;

    return { sessionId, profile, isProfileComplete, missingFields };
  }

  /**
   * Cập nhật profile vào DB.
   * - Tên → cột `user_agent`
   * - Thông tin khác (công ty, website, verified...) → cột `company_hint` (JSON)
   */
  async updateProfile(sessionId: string, partial: Partial<HrProfile>): Promise<void> {
    const context = await this.getSessionContext(sessionId);
    const merged: HrProfile = { ...context.profile, ...partial };

    // Nếu vừa nhận được tên công ty mới và chưa verify, thực hiện verify
    if (partial.company && !merged.isCompanyVerified) {
      const searchResult = await this.searchCompanyOnline(partial.company);
      merged.isCompanyVerified = searchResult.found;
      if (searchResult.website) merged.companyWebsite = searchResult.website;
    }

    // Tách name ra lưu vào user_agent, phần còn lại lưu vào company_hint
    const { name, ...rest } = merged;

    const updateData: Record<string, unknown> = {
      company_hint: JSON.stringify(rest),
      last_seen_at: new Date(),
    };

    if (name) {
      updateData.user_agent = name;
    }

    await this.db.hr_sessions.update({
      where: { cookie_token: sessionId },
      data: updateData,
    });
  }

  // ── Extract Logic ──────────────────────────────────────────────────────────

  /**
   * Phân tích tin nhắn của HR để trích xuất thông tin profile.
   * Trả về các field mới tìm được (hoặc flag từ chối).
   */
  extractProfileFromMessage(
    message: string,
    existing: HrProfile,
  ): Partial<HrProfile> {
    const updates: Partial<HrProfile> = {};

    // 1. Kiểm tra từ chối
    if (REFUSAL_PATTERNS.some((p) => p.test(message))) {
      updates.hasRefusedInfo = true;
      return updates;
    }

    // 2. Extract tên (nếu chưa có)
    if (!existing.name) {
      const nameMatch = message.match(
        /(?:(?:tôi|mình|em|tên(?:\s+(?:tôi|mình|em))?)(?:\s+là)?\s+|là\s+)([A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝĐ][a-zA-ZÀ-ỹ]+(?:\s+[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝĐ][a-zA-ZÀ-ỹ]+){0,4})/u,
      );
      if (nameMatch) updates.name = nameMatch[1].trim();
    }

    // 3. Extract tên công ty (nếu chưa có)
    if (!existing.company) {
      const companyMatch = message.match(
        /(?:(?:từ|bên|ở|tại|thuộc|của)\s+(?:công\s*ty\s+)?|công\s*ty\s+)([A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝĐ0-9][A-Za-zÀ-ỹ0-9\s&.,\-]{1,50}?)(?=\s*[,\.!?\n]|$)/u,
      );
      if (companyMatch) updates.company = companyMatch[1].trim();
    }

    // 4. Extract website
    const websiteMatch = message.match(
      /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]{2,}\.[a-z]{2,}(?:\/[^\s]*)?\b/i,
    );
    if (websiteMatch && !existing.companyWebsite) {
      updates.companyWebsite = websiteMatch[0].startsWith('http')
        ? websiteMatch[0]
        : `https://${websiteMatch[0]}`;
    }

    // 5. Extract địa chỉ
    const addressMatch = message.match(
      /(?:địa\s*chỉ|văn\s*phòng|ở\s+số|đường|tầng)\s+([^\n.!?]{5,120})/i,
    );
    if (addressMatch && !existing.companyAddress) {
      updates.companyAddress = addressMatch[1].trim();
    }

    return updates;
  }

  // ── Greeting Detection ─────────────────────────────────────────────────────

  /**
   * Kiểm tra xem tin nhắn có phải chỉ là lời chào hỏi thuần túy không.
   * Nếu true → bot nên chào lại tự nhiên trước, hỏi tên nhẹ nhàng sau,
   * thay vì hỏi thẳng "bạn tên gì, công ty nào".
   */
  isGreetingOnly(message: string): boolean {
    const trimmed = message.trim();
    // Bỏ emoji ở đầu/cuối rồi mới check
    const stripped = trimmed.replace(/^[\p{Emoji}\s]+|[\p{Emoji}\s]+$/gu, '').trim();
    return GREETING_PATTERNS.some((p) => p.test(stripped) || p.test(trimmed));
  }

  // ── Prompt Builder ─────────────────────────────────────────────────────────

  /**
   * Tạo khối hướng dẫn (instruction block) đưa vào system prompt của Gemini
   * dựa trên trạng thái hiện tại của HR session.
   */
  buildHrSystemBlock(ctx: HrSessionContext, isGreeting = false): string {
    const { profile, isProfileComplete, missingFields } = ctx;
    const firstName = profile.name?.split(' ').pop() ?? 'bạn';

    // ── Trường hợp chào hỏi thuần tuý (chưa biết tên/công ty) ───────────────
    if (isGreeting && !isProfileComplete && !profile.hasRefusedInfo) {
      const alreadyHasName = !!profile.name;
      return `
          ## TRẠNG THÁI HR: LỜI CHÀO MỞ ĐẦU

          HR vừa gửi một lời chào hỏi đơn giản, chưa cung cấp thông tin.

          HƯỚNG DẪN — **BẮT BUỘC TUÂN THỦ**:
          - Giới thiệu bản thân là "Neko" (KHÔNG phải "Mẫn").
          - Chào lại thật tự nhiên, ấm áp.
          - **CHỈ hỏi tên HR** — TUYỆT ĐỐI KHÔNG hỏi công ty ở tin nhắn đầu tiên này.
          - Hỏi công ty là bước tiếp theo, sau khi đã biết tên.
          ${
            alreadyHasName
              ? `- Mình đã biết tên HR là ${profile.name}. Chào bằng tên, rồi hỏi nhẹ về công ty.`
              : `- Ví dụ câu trả lời: "Chào bạn! Mình là Neko 😊 Rất vui được gặp bạn. Cho mình hỏi bạn tên gì để mình tiện xưng hô nhé?"`
          }
          - Câu ngắn, thân thiện, KHÔNG formal, KHÔNG hỏi nhiều thứ cùng lúc.
        `.trim();
    }

    // ── Trường hợp từ chối ───────────────────────────────────────────────────
    if (profile.hasRefusedInfo) {
      return `
        ## TRẠNG THÁI HR: TỪ CHỐI CUNG CẤP THÔNG TIN

        HR đã từ chối cung cấp tên và/hoặc tên công ty.

        HƯỚNG DẪN:
        - Xưng "mình", gọi HR là "bạn" (dù chưa biết tên).
        - Nhắc khéo léo một lần nữa rằng trao đổi sẽ chuyên nghiệp hơn nếu mình biết đối phương là ai.
        - Gợi ý HR có thể gửi thông tin và JD đến email cá nhân: ${CONTACT_EMAIL}
        - Ví dụ: "Mình hiểu nếu bạn chưa tiện chia sẻ. Nếu muốn, bạn có thể gửi JD và thông tin liên hệ về ${CONTACT_EMAIL} — mình sẽ phản hồi chi tiết hơn qua đó nhé!"
        - Vẫn trả lời ngắn gọn câu hỏi kỹ thuật nếu HR hỏi, nhưng không đi sâu vào thoả thuận.
      `.trim();
    }

    // ── Trường hợp thiếu thông tin ───────────────────────────────────────────
    if (!isProfileComplete) {
      const missingLabels = missingFields.map((f) => (f === 'name' ? 'tên' : 'tên công ty'));
      return `
        ## TRẠNG THÁI HR: ĐANG THU THẬP THÔNG TIN

        Thông tin còn thiếu: ${missingLabels.join(', ')}.

        HƯỚNG DẪN:
        - Xưng "mình", gọi HR là "bạn".
        - Trước khi trả lời bất kỳ câu hỏi chuyên môn nào, hãy hỏi thông tin còn thiếu một cách tự nhiên, thân thiện.
        - Ví dụ (thiếu cả hai): "Chào bạn! Trước khi mình chia sẻ thêm, cho mình hỏi bạn tên gì và đang công tác tại công ty nào nhỉ? 😊"
        - Ví dụ (đã có tên, thiếu công ty): "Cảm ơn ${firstName}! Bạn đang công tác tại công ty nào vậy?"
        - Nếu HR né tránh 2 lần liên tiếp, gợi ý gửi thông tin qua email: ${CONTACT_EMAIL}
      `.trim();
    }

    // ── Trường hợp đã đủ thông tin ───────────────────────────────────────────
    let verificationNote = '';
    if (profile.isCompanyVerified) {
      verificationNote = `Công ty "${profile.company}" có tồn tại và mình đã xác thực. Hãy mở đầu bằng một lời khen ngắn, chân thành về uy tín hoặc lĩnh vực của họ (không hoa mỹ quá mức). Ví dụ: "Mình có biết ${profile.company}, công ty đang hoạt động khá nổi ở mảng [lĩnh vực]!"`;
      if (profile.companyWebsite) {
        verificationNote += ` Website: ${profile.companyWebsite}.`;
      }
    } else if (profile.companyAddress || profile.companyWebsite) {
      verificationNote = `HR đã cung cấp thêm thông tin (${profile.companyAddress ?? profile.companyWebsite}). Xác nhận và tiếp tục trao đổi bình thường.`;
    } else {
      verificationNote = `Mình chưa tìm thấy thông tin công ty "${profile.company}" trên internet. Hãy nhắc khéo: "Mình tìm sơ qua nhưng chưa gặp thông tin về ${profile.company}. Nếu được, bạn cho mình xin website hoặc địa chỉ công ty để mình tham khảo thêm nhé!"`;
    }

    return `
      ## TRẠNG THÁI HR: ĐÃ CÓ ĐỦ THÔNG TIN

      - Tên HR: ${profile.name} (gọi là ${firstName})
      - Công ty: ${profile.company}
      - Xác thực công ty: ${verificationNote}

      HƯỚNG DẪN:
      - Xưng "Sếp của mình", gọi HR là "${firstName}"
      - Đi thẳng vào nội dung câu hỏi, tự nhiên như người đang trò chuyện bình thường.
      - Tiếp tục trao đổi về cơ hội công việc, JD, yêu cầu vị trí.
      - Nếu HR hỏi về lương, thời gian bắt đầu, hoặc muốn gửi JD chi tiết: gợi ý gửi về ${CONTACT_EMAIL}.
      - Ví dụ gợi ý JD: "${firstName} có thể gửi JD chi tiết về vị trí này đến email ${CONTACT_EMAIL} — Sếp của mình sẽ xem kỹ và phản hồi sớm nhé!"
    `.trim();
  }
  // - Xưng "Sếp của mình", gọi HR là "${firstName}" khi cần thiết (hỏi lại, xác nhận) — KHÔNG bắt đầu mỗi câu trả lời bằng "Chào ${firstName}" hay "Lan ơi..." vì sẽ rất giả tạo và lặp lại.


  // ── Internet Search ────────────────────────────────────────────────────────
  /**
   * Tìm kiếm thông tin công ty qua Brave Search hoặc fallback sang SERPER (Google Search API)).
   * Cần set env: BRAVE_SEARCH_API_KEY hoặc SERPER_API_KEY
   */
  async searchCompanyOnline(companyName: string): Promise<CompanySearchResult> {
    if (!companyName || companyName.trim().length < 2) return { found: false };

    try {
      // Ưu tiên Brave Search nếu có API key ( thằng này tốn tiền - nhưng lưu lại để sau này có cái mà dùng =)))
      if (process.env.BRAVE_SEARCH_API_KEY) {
        return await this.searchViaBrave(companyName);
      }

      // Serper (Google Search API)
      if (process.env.SERPER_API_KEY) {
        return await this.searchViaSerper(companyName);
      }

      // Không có API key — trả về not found để bot hỏi thêm
      return { found: false };
    } catch {
      return { found: false };
    }
  }

  private async searchViaBrave(companyName: string): Promise<CompanySearchResult> {
    const query = encodeURIComponent(`${companyName} company Vietnam`);
    const res = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${query}&count=3`, {
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': process.env.BRAVE_SEARCH_API_KEY,
      },
    });

    if (!res.ok) return { found: false };

    const data = await res.json();
    const results = data?.web?.results ?? [];

    if (results.length === 0) return { found: false };

    const first = results[0];
    return {
      found: true,
      website: first.url,
      description: first.description,
    };
  }

  private async searchViaSerper(companyName: string): Promise<CompanySearchResult> {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: `${companyName} công ty`, num: 3 }),
    });

    if (!res.ok) return { found: false };

    const data = await res.json();
    const organic = data?.organic ?? [];

    if (organic.length === 0) return { found: false };

    return {
      found: true,
      website: organic[0]?.link,
      description: organic[0]?.snippet,
    };
  }
}