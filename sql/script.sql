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
	CONSTRAINT newtable_pk PRIMARY KEY (id),
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
-- 5. messages
-- ============================================================
CREATE TYPE message_role AS ENUM ('hr', 'bot');

CREATE TABLE messages (
	id uuid NOT NULL,
	conversation_id uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	created_at timestamp NOT null,
	used_token int4 NULL,
	CONSTRAINT messages_pk PRIMARY KEY (id)
);
CREATE INDEX idx_messages_conversation_date ON public.messages USING btree (conversation_id, created_at DESC);


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
	is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT projects_pk PRIMARY KEY (id)
);

-- Tạo Index để AI query "những dự án tiêu biểu" nhanh hơn
CREATE INDEX idx_projects_feature_order ON projects(sort_order DESC);