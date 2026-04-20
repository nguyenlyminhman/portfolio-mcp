import type { Message, Session } from "./repository.js";

/**
 * Format conversation history thành plain text cho Claude dễ đọc.
 * Claude sẽ dùng đây làm context khi trả lời HR.
 */
export function formatConversation(messages: Message[]): string {
  if (messages.length === 0) {
    return "Chưa có tin nhắn nào trong session này.";
  }

  const lines = messages.map((m) => {
    const time = new Date(m.created_at).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const speaker = m.role === "hr" ? "HR" : "Bot";
    return `[${time}] ${speaker}: ${m.content}`;
  });

  return `=== Lịch sử conversation (${messages.length} tin nhắn) ===\n${lines.join("\n")}`;
}

/**
 * Format danh sách sessions cho Admin panel.
 * Trả về JSON để Next.js admin có thể parse và render table.
 */
export function formatSessionList(
  sessions: Session[],
  total: number,
  page: number,
  page_size: number
): string {
  const totalPages = Math.ceil(total / page_size);

  const formatted = sessions.map((s) => ({
    session_id: s.session_id,
    company: s.hr_company ?? "Không rõ",
    message_count: s.message_count,
    first_seen: formatRelativeTime(s.first_message_at),
    last_seen: formatRelativeTime(s.last_message_at),
    is_interesting: Boolean(s.is_interesting),
    interesting_note: s.interesting_note,
  }));

  return JSON.stringify(
    {
      sessions: formatted,
      pagination: { total, page, page_size, total_pages: totalPages },
    },
    null,
    2
  );
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 1) return "vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngày trước`;
}
