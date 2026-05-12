-- ============================================================
-- 1. users
-- ============================================================
CREATE TABLE public.users (
	id uuid NOT NULL,
	nickname text NULL,
	"password" text NOT NULL,
	email text NOT NULL,
	fullname text NULL,
	created_at timestamp NULL,
	created_by text NULL,
	updated_at timestamp NULL,
	updated_by text NULL,
	CONSTRAINT users_pk PRIMARY KEY (id),
	CONSTRAINT users_unique UNIQUE (email)
);


-- ============================================================
-- 2. my_cv  (master data — độc lập)
-- ============================================================
CREATE TABLE public.my_cv (
	id uuid NOT NULL,
	"name" text NOT NULL,
	cv_content JSONB NOT NULL DEFAULT '{}',
	created_at timestamp NULL,
	created_by text NULL,
	updated_at timestamp NULL,
	updated_by text NULL,
	is_active BOOLEAN DEFAULT TRUE,
	CONSTRAINT my_cv_pk PRIMARY KEY (id)
);

-- ============================================================
-- 3. hr_sessions
-- ============================================================
CREATE TABLE public.hr_sessions (
	id uuid NOT NULL,
	cookie_token text NOT NULL,
	ip_address text NOT NULL,
	user_agent text NULL,
	company_hint text NULL,
	is_interesting bool NULL,
	first_seen_at timestamp NULL,
	last_seen_at timestamp NULL,
	CONSTRAINT hr_sessions_pk PRIMARY KEY (id),
	CONSTRAINT hr_sessions_unique UNIQUE (cookie_token)
);

-- Index: lookup nhanh khi HR gửi cookie lên
CREATE INDEX idx_hr_sessions_cookie ON hr_sessions (cookie_token);
-- Index: admin sort theo lần cuối ghé
CREATE INDEX idx_hr_sessions_last_seen ON hr_sessions (last_seen_at DESC);

-- ============================================================
-- 4. conversations
-- ============================================================
CREATE TABLE public.conversations (
	id uuid NOT NULL,
	session_id uuid NOT NULL,
	started_at timestamp NOT NULL,
	last_message_at timestamp NOT NULL,
	message_count int4 DEFAULT 0 NOT NULL,
	token_count int4 DEFAULT 0 NOT NULL,
	CONSTRAINT conversations_pk PRIMARY KEY (id)
);


-- Index: lấy conversation mới nhất của 1 session
CREATE INDEX idx_conversations_session ON conversations (session_id, last_message_at DESC);

-- ============================================================
-- 5. messages
-- ============================================================
CREATE TYPE message_role AS ENUM ('hr', 'bot');

CREATE TABLE public.messages (
	id uuid NOT NULL,
	conversation_id uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	 created_at timestamp NOT null,
	 used_token  int4 DEFAULT 0 NOT NULL,
	CONSTRAINT messages_pk PRIMARY KEY (id)
)
-- Index: load messages theo ngày (Admin scroll, chatbot lấy history)
CREATE INDEX idx_messages_conversation_date ON messages (conversation_id, created_at DESC);

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
    id  uuid NOT NULL,
    repo_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    tech_stack TEXT[] NOT NULL,
    highlights TEXT NOT NULL,
    markdown TEXT NOT NULL,
    github_url VARCHAR(255),
    live_url VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
	created_by text NULL,
	updated_by text NULL,
	is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT projects_pk PRIMARY KEY (id)
);

-- Tạo Index để AI query "những dự án tiêu biểu" nhanh hơn
CREATE INDEX idx_projects_feature_order ON projects(sort_order DESC);

