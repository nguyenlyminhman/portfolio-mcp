-- Đảm bảo extension uuid-ossp đã được kích hoạt để dùng uuid_generate_v4()
-- Extension uuid

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. users
-- ============================================================
CREATE TABLE users (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           TEXT        NOT NULL UNIQUE,
  password_hash   TEXT        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at   TIMESTAMPTZ
);

-- ============================================================
-- 2. my_cv  (master data — độc lập)
-- ============================================================
CREATE TABLE my_cv (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT        NOT NULL,
  cv_content  JSONB       NOT NULL DEFAULT '{}',
  is_delete   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by  TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  TEXT
);

-- Index: chatbot chỉ đọc CV active
CREATE INDEX idx_my_cv_active ON my_cv (is_delete) WHERE is_delete = FALSE;

-- ============================================================
-- 3. hr_sessions
-- ============================================================
CREATE TABLE hr_sessions (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  cookie_token    TEXT        NOT NULL UNIQUE,   -- giá trị lưu trong cookie HR
  ip_address      TEXT,
  user_agent      TEXT,
  company_hint    TEXT,                          -- bạn tự ghi chú công ty HR
  is_interesting  BOOLEAN     NOT NULL DEFAULT FALSE,
  first_seen_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index: lookup nhanh khi HR gửi cookie lên
CREATE INDEX idx_hr_sessions_cookie ON hr_sessions (cookie_token);
-- Index: admin sort theo lần cuối ghé
CREATE INDEX idx_hr_sessions_last_seen ON hr_sessions (last_seen_at DESC);

-- ============================================================
-- 4. conversations
-- ============================================================
CREATE TABLE conversations (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      UUID        NOT NULL REFERENCES hr_sessions (id) ON DELETE CASCADE,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  message_count   INT         NOT NULL DEFAULT 0
);

-- Index: lấy conversation mới nhất của 1 session
CREATE INDEX idx_conversations_session ON conversations (session_id, last_message_at DESC);

-- ============================================================
-- 5. messages
-- ============================================================
CREATE TYPE message_role AS ENUM ('hr', 'bot');

CREATE TABLE messages (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID         NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
  role            message_role NOT NULL,
  content         TEXT         NOT NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  is_deleted      BOOLEAN      NOT NULL DEFAULT FALSE
);

-- Index: load messages theo ngày (Admin scroll, chatbot lấy history)
CREATE INDEX idx_messages_conversation_date ON messages (conversation_id, created_at DESC);

-- ============================================================
-- 6. Function: tự động cập nhật updated_at cho my_cv
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_my_cv_updated_at
  BEFORE UPDATE ON my_cv
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 7. Function: sync last_message_at + message_count lên conversations
--    Tự động chạy mỗi khi INSERT 1 message mới
-- ============================================================
CREATE OR REPLACE FUNCTION sync_conversation_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET
    last_message_at = NEW.created_at,
    message_count   = message_count + 1
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_conversation_stats
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION sync_conversation_stats();

-- ============================================================
-- 8. Function: sync last_seen_at lên hr_sessions
--    Tự động chạy mỗi khi có conversation mới
-- ============================================================
CREATE OR REPLACE FUNCTION sync_session_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE hr_sessions
  SET last_seen_at = NEW.started_at
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_session_last_seen
  AFTER INSERT ON conversations
  FOR EACH ROW EXECUTE FUNCTION sync_session_last_seen();

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repo_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    tech_stack TEXT[] NOT NULL,
    highlights TEXT NOT NULL,
    markdown TEXT NOT NULL,
    github_url VARCHAR(255),
    live_url VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tạo Index để AI query "những dự án tiêu biểu" nhanh hơn
CREATE INDEX idx_projects_feature_order ON projects(sort_order DESC);

