-- ============================================================
-- Chessboard Dashboard — Production Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Drop old tables if they exist (clean start)
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.issues CASCADE;
DROP TABLE IF EXISTS public.visits CASCADE;
DROP TABLE IF EXISTS public.locations CASCADE;
DROP TABLE IF EXISTS public.shoppers CASCADE;
DROP TABLE IF EXISTS public.admins CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ─── PROFILES (single table for all user types) ─────────────
CREATE TABLE public.profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  personal_email text DEFAULT '',
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('superadmin', 'admin', 'ops', 'shopper')),
  city text DEFAULT '',
  primary_phone text DEFAULT '',
  whatsapp_phone text DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  assigned_brands text[] DEFAULT '{}',
  assigned_admin_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  visits_completed integer DEFAULT 0,
  points integer DEFAULT 0,
  is_root boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- ─── VISITS ─────────────────────────────────────────────────
CREATE TABLE public.visits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  office_name text NOT NULL,
  city text NOT NULL,
  type text DEFAULT 'تقييم شامل',
  brand text DEFAULT '',
  status text NOT NULL DEFAULT 'معلقة',
  scenario text DEFAULT '',
  membership_id text DEFAULT '',
  shopper_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  visit_date timestamptz NOT NULL,
  scores jsonb DEFAULT '{}',
  notes text DEFAULT '',
  points_earned integer DEFAULT 0,
  file_urls text[] DEFAULT '{}',
  audio_url text,
  audio_file_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_visits_shopper ON public.visits(shopper_id);
CREATE INDEX idx_visits_status ON public.visits(status);
CREATE INDEX idx_visits_brand ON public.visits(brand);

-- ─── ISSUES ─────────────────────────────────────────────────
CREATE TABLE public.issues (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id uuid REFERENCES public.visits(id) ON DELETE CASCADE,
  severity text NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_issues_visit ON public.issues(visit_id);

-- ─── NOTIFICATIONS ──────────────────────────────────────────
CREATE TABLE public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_role text NOT NULL,
  recipient_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_email text DEFAULT '',
  title text NOT NULL,
  description text DEFAULT '',
  event_type text DEFAULT '',
  visit_id uuid REFERENCES public.visits(id) ON DELETE SET NULL,
  payload jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_notifications_role ON public.notifications(recipient_role);
CREATE INDEX idx_notifications_user ON public.notifications(recipient_user_id);

-- ─── Disable RLS (all access through server-side service role key) ──
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON public.visits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON public.issues FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
