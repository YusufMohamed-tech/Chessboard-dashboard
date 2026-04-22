CREATE TABLE IF NOT EXISTS public.admins (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password text NOT NULL,
  role text NOT NULL,
  assigned_brands text[] DEFAULT '{}'::text[],
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.shoppers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password text NOT NULL,
  phone text,
  city text,
  avatar text,
  points integer DEFAULT 0,
  level text DEFAULT 'مبتدئ',
  is_active boolean DEFAULT true,
  last_active timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.locations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  city text NOT NULL,
  brand text NOT NULL,
  address text,
  latitude double precision,
  longitude double precision,
  type text DEFAULT 'branch',
  manager_name text,
  manager_phone text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.visits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  shopper_id uuid REFERENCES public.shoppers(id),
  location_id uuid REFERENCES public.locations(id),
  brand text NOT NULL,
  city text NOT NULL,
  location_name text NOT NULL,
  date timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'معلقة',
  score integer,
  issues_count integer DEFAULT 0,
  notes text,
  audio_url text,
  audio_file_id text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.issues (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id uuid REFERENCES public.visits(id) ON DELETE CASCADE,
  category text NOT NULL,
  description text NOT NULL,
  severity text NOT NULL,
  status text NOT NULL DEFAULT 'مفتوحة',
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid, -- Can be shopper or admin depending on role
  user_role text,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
