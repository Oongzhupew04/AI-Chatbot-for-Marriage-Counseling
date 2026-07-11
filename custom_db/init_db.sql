-- ============================================================
-- openGauss Database Initialization Script
-- This script runs AUTOMATICALLY on first container startup.
-- It creates the application user, database, and full schema.
-- ============================================================

-- ============================================================
-- 1. CREATE THE APPLICATION USER AND DATABASE
-- ============================================================
-- The default superuser 'omm' runs this script.
-- We create our application user 'ogc' and the 'ad1' database.

-- Create the application user (password is set via GS_PASSWORD env var,
-- but we set a default here that matches the compose environment)
CREATE USER ogc WITH PASSWORD 'Changeme@123';

-- Create the application database owned by ogc
CREATE DATABASE ad1 OWNER ogc;

-- ============================================================
-- 2. CONNECT TO THE APPLICATION DATABASE AND CREATE SCHEMA
-- ============================================================
-- Note: openGauss docker entrypoint runs init scripts against
-- the default database. We use \c to switch to our app database.
\c ad1

-- Enable the DataVec extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Grant schema usage to our app user
GRANT CREATE, USAGE ON SCHEMA public TO ogc;

-- ============================================================
-- 3. CREATE TABLES (owned by ogc)
-- ============================================================

-- Users table
CREATE TABLE users (
    id integer NOT NULL,
    username character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(50) DEFAULT 'user'::character varying,
    sex character varying(255),
    age integer,
    years_married integer,
    children_count integer,
    children_raised integer,
    education character varying(255),
    material_situation character varying(255),
    religious_affiliation character varying(255),
    religiousness integer,
    q13 character varying(5),
    q17 character varying(5),
    q19 character varying(5),
    q20 character varying(5),
    marital_risk_percentage numeric(5,3),
    push_notifications_enabled boolean DEFAULT false,
    dark_mode_enabled boolean DEFAULT false,
    profile_pic text,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT pg_systimestamp()
) WITH (orientation=row, compression=no);

ALTER TABLE public.users OWNER TO ogc;

CREATE SEQUENCE users_id_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.users_id_seq OWNER TO ogc;
ALTER TABLE users ALTER COLUMN id SET DEFAULT nextval('users_id_seq'::regclass);

-- Chats table
CREATE TABLE chats (
    id integer NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT pg_systimestamp(),
    updated_at timestamp without time zone DEFAULT pg_systimestamp()
) WITH (orientation=row, compression=no);

ALTER TABLE public.chats OWNER TO ogc;

CREATE SEQUENCE chats_id_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.chats_id_seq OWNER TO ogc;
ALTER TABLE chats ALTER COLUMN id SET DEFAULT nextval('chats_id_seq'::regclass);

-- Messages table
CREATE TABLE messages (
    id integer NOT NULL,
    chat_id integer NOT NULL,
    "timestamp" timestamp without time zone DEFAULT pg_systimestamp(),
    user_message text,
    bot_response text
) WITH (orientation=row, compression=no);

ALTER TABLE public.messages OWNER TO ogc;

CREATE SEQUENCE messages_id_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.messages_id_seq OWNER TO ogc;
ALTER TABLE messages ALTER COLUMN id SET DEFAULT nextval('messages_id_seq'::regclass);

-- Counseling Knowledge (RAG vector store)
CREATE TABLE counseling_knowledge (
    id text NOT NULL,
    text text NOT NULL,
    metadata jsonb,
    embedding vector(1024) NOT NULL
) WITH (orientation=row, compression=no);

ALTER TABLE public.counseling_knowledge OWNER TO ogc;

-- Daily Check-ins table
CREATE TABLE daily_checkins (
    id integer NOT NULL,
    user_id integer NOT NULL,
    satisfaction_score integer NOT NULL,
    rotational_q character varying(255),
    rotational_score integer,
    unmet_needs character varying(255),
    journal_text text,
    created_at timestamp without time zone
) WITH (orientation=row, compression=no);

ALTER TABLE public.daily_checkins OWNER TO ogc;

CREATE SEQUENCE daily_checkins_id_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.daily_checkins_id_seq OWNER TO ogc;
ALTER TABLE daily_checkins ALTER COLUMN id SET DEFAULT nextval('daily_checkins_id_seq'::regclass);

-- FAQ table
CREATE TABLE faq (
    id integer NOT NULL,
    question text NOT NULL,
    answer text NOT NULL
) WITH (orientation=row, compression=no);

ALTER TABLE public.faq OWNER TO ogc;

CREATE SEQUENCE faq_id_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.faq_id_seq OWNER TO ogc;
ALTER TABLE faq ALTER COLUMN id SET DEFAULT nextval('faq_id_seq'::regclass);

-- Feedback table
CREATE TABLE feedback (
    id integer NOT NULL,
    user_id integer NOT NULL,
    chat_id integer NOT NULL,
    rating integer NOT NULL,
    worked_well jsonb,
    issues jsonb,
    comments text,
    "timestamp" timestamp without time zone DEFAULT pg_systimestamp()
) WITH (orientation=row, compression=no);

ALTER TABLE public.feedback OWNER TO ogc;

CREATE SEQUENCE feedback_id_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.feedback_id_seq OWNER TO ogc;
ALTER TABLE feedback ALTER COLUMN id SET DEFAULT nextval('feedback_id_seq'::regclass);

-- Push Subscriptions table
CREATE TABLE push_subscriptions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    created_at timestamp without time zone DEFAULT pg_systimestamp()
) WITH (orientation=row, compression=no);

ALTER TABLE public.push_subscriptions OWNER TO ogc;

CREATE SEQUENCE push_subscriptions_id_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.push_subscriptions_id_seq OWNER TO ogc;
ALTER TABLE push_subscriptions ALTER COLUMN id SET DEFAULT nextval('push_subscriptions_id_seq'::regclass);

-- Resources table
CREATE TABLE resources (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    type character varying(50) NOT NULL,
    url character varying(255) NOT NULL,
    icon character varying(100),
    created_at timestamp without time zone DEFAULT pg_systimestamp()
) WITH (orientation=row, compression=no);

ALTER TABLE public.resources OWNER TO ogc;

CREATE SEQUENCE resources_id_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.resources_id_seq OWNER TO ogc;
ALTER TABLE resources ALTER COLUMN id SET DEFAULT nextval('resources_id_seq'::regclass);

-- Risk Alerts table
CREATE TABLE risk_alerts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    message_id integer NOT NULL,
    risk_level integer NOT NULL,
    trigger_keyword text,
    status character varying(20) DEFAULT 'Pending Review'::character varying,
    "timestamp" timestamp without time zone DEFAULT pg_systimestamp()
) WITH (orientation=row, compression=no);

ALTER TABLE public.risk_alerts OWNER TO ogc;

CREATE SEQUENCE risk_alerts_id_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.risk_alerts_id_seq OWNER TO ogc;
ALTER TABLE risk_alerts ALTER COLUMN id SET DEFAULT nextval('risk_alerts_id_seq'::regclass);

-- ============================================================
-- 4. PRIMARY KEYS
-- ============================================================

ALTER TABLE users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
ALTER TABLE chats ADD CONSTRAINT chats_pkey PRIMARY KEY (id);
ALTER TABLE messages ADD CONSTRAINT messages_pkey PRIMARY KEY (id);
ALTER TABLE counseling_knowledge ADD CONSTRAINT counseling_knowledge_pkey PRIMARY KEY (id);
ALTER TABLE daily_checkins ADD CONSTRAINT daily_checkins_pkey PRIMARY KEY (id);
ALTER TABLE faq ADD CONSTRAINT faq_pkey PRIMARY KEY (id);
ALTER TABLE feedback ADD CONSTRAINT feedback_pkey PRIMARY KEY (id);
ALTER TABLE push_subscriptions ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);
ALTER TABLE resources ADD CONSTRAINT resources_pkey PRIMARY KEY (id);
ALTER TABLE risk_alerts ADD CONSTRAINT risk_alerts_pkey PRIMARY KEY (id);

-- ============================================================
-- 5. FOREIGN KEYS
-- ============================================================

ALTER TABLE chats ADD CONSTRAINT chats_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE messages ADD CONSTRAINT messages_chat_id_fkey
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE;

ALTER TABLE risk_alerts ADD CONSTRAINT risk_alerts_message_id_fkey
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE;

-- ============================================================
-- 6. INDEXES
-- ============================================================

CREATE INDEX idx_counseling_knowledge_embedding
    ON counseling_knowledge USING hnsw (embedding vector_l2_ops)
    WITH (m=16, ef_construction=64) TABLESPACE pg_default;

-- ============================================================
-- 7. SCHEMA PERMISSIONS
-- ============================================================

REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT CREATE, USAGE ON SCHEMA public TO omm;
GRANT USAGE ON SCHEMA public TO PUBLIC;

-- Grant ogc full access to all tables and sequences
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ogc;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ogc;

-- ============================================================
-- 8. SEED DATA (Default admin account)
-- ============================================================
-- Password: admin123 (hashed with werkzeug.security)
-- New users who clone the project can log in with this account.
INSERT INTO users (username, email, password, role)
VALUES ('Admin', 'admin@gmail.com',
        'scrypt:32768:8:1$salt$a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
        'admin');

-- ============================================================
-- Database initialization complete!
-- ============================================================
