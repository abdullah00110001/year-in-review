# Apply this Migration in Supabase

The Rise/Shield "unable to create group" bug + new features (custom daily fields, real community feed, server-side wake signals) require a database migration.

## How to apply

Open your Supabase project → **SQL Editor** → paste the entire SQL block below → **Run**.

(Or, if you prefer, ask Lovable to enable "Supabase migrations" tool in this chat and I'll apply it automatically.)

---

```sql
-- ============================================================================
-- Rise / Shield Production Migration
-- ============================================================================

-- 1. Recursion-safe helpers --------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_group_member(_group_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.accountability_group_members
    WHERE group_id = _group_id AND user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_group_admin(_group_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.accountability_group_members
    WHERE group_id = _group_id AND user_id = _user_id AND role = 'admin'
  )
$$;

-- Drop ALL old policies on group tables
DO $$ DECLARE r record;
BEGIN
  FOR r IN SELECT schemaname, tablename, policyname FROM pg_policies
    WHERE schemaname='public' AND tablename IN
      ('accountability_group_members','accountability_groups','group_wake_status','unlock_requests')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- accountability_groups
ALTER TABLE public.accountability_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can create groups" ON public.accountability_groups
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Members can view their groups" ON public.accountability_groups
  FOR SELECT TO authenticated USING (created_by = auth.uid() OR public.is_group_member(id, auth.uid()));
CREATE POLICY "Anyone can lookup by invite code" ON public.accountability_groups
  FOR SELECT TO authenticated USING (invite_code IS NOT NULL);
CREATE POLICY "Admins can update group" ON public.accountability_groups
  FOR UPDATE TO authenticated USING (created_by = auth.uid() OR public.is_group_admin(id, auth.uid()));
CREATE POLICY "Creators can delete group" ON public.accountability_groups
  FOR DELETE TO authenticated USING (created_by = auth.uid());

-- accountability_group_members
ALTER TABLE public.accountability_group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert themselves into a group" ON public.accountability_group_members
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Members view co-members" ON public.accountability_group_members
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_group_member(group_id, auth.uid()));
CREATE POLICY "Admins manage members" ON public.accountability_group_members
  FOR UPDATE TO authenticated USING (public.is_group_admin(group_id, auth.uid()));
CREATE POLICY "Users leave or admins remove" ON public.accountability_group_members
  FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_group_admin(group_id, auth.uid()));

-- group_wake_status
ALTER TABLE public.group_wake_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view wake statuses" ON public.group_wake_status
  FOR SELECT TO authenticated USING (public.is_group_member(group_id, auth.uid()));
CREATE POLICY "Members insert own status" ON public.group_wake_status
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.is_group_member(group_id, auth.uid()));
CREATE POLICY "Members update own status" ON public.group_wake_status
  FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_group_admin(group_id, auth.uid()));
CREATE POLICY "Admins delete statuses" ON public.group_wake_status
  FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_group_admin(group_id, auth.uid()));

-- unlock_requests (Shield) - only if exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='unlock_requests') THEN
    EXECUTE 'ALTER TABLE public.unlock_requests ENABLE ROW LEVEL SECURITY';
    EXECUTE $p$CREATE POLICY "Members view unlock requests" ON public.unlock_requests FOR SELECT TO authenticated USING (user_id = auth.uid() OR (group_id IS NOT NULL AND public.is_group_member(group_id, auth.uid())))$p$;
    EXECUTE $p$CREATE POLICY "Users create own unlock requests" ON public.unlock_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())$p$;
    EXECUTE $p$CREATE POLICY "Users or admins update unlock" ON public.unlock_requests FOR UPDATE TO authenticated USING (user_id = auth.uid() OR (group_id IS NOT NULL AND public.is_group_admin(group_id, auth.uid())))$p$;
  END IF;
END $$;

-- 2. Daily custom fields -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.daily_custom_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_key text NOT NULL,
  label text NOT NULL,
  field_type text NOT NULL CHECK (field_type IN ('number','boolean','text','minutes')),
  unit text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, field_key)
);
ALTER TABLE public.daily_custom_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own custom fields" ON public.daily_custom_fields
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.daily_custom_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES public.daily_custom_fields(id) ON DELETE CASCADE,
  date date NOT NULL,
  value_number numeric,
  value_text text,
  value_bool boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, field_id, date)
);
ALTER TABLE public.daily_custom_values ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own custom values" ON public.daily_custom_values
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 3. Community wake feed -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_locations (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  city text, country text,
  opted_in boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users upsert own location" ON public.user_locations
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Anyone reads opted-in locations" ON public.user_locations
  FOR SELECT TO authenticated USING (opted_in = true);

CREATE TABLE IF NOT EXISTS public.community_wake_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wake_time timestamptz NOT NULL DEFAULT now(),
  city text,
  event_type text NOT NULL DEFAULT 'fajr' CHECK (event_type IN ('fajr','tahajjud','early')),
  anonymous boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.community_wake_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own wake event" ON public.community_wake_events
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Anyone reads wake events" ON public.community_wake_events
  FOR SELECT TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_community_wake_events_time ON public.community_wake_events(wake_time DESC);

-- 4. Rise user profile + wake signals ----------------------------------------
CREATE TABLE IF NOT EXISTS public.rise_user_profile (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  bio text DEFAULT '',
  dnd_enabled boolean NOT NULL DEFAULT false,
  dnd_reason text DEFAULT '',
  blocked_users uuid[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.rise_user_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own rise profile" ON public.rise_user_profile
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Authenticated read rise profiles" ON public.rise_user_profile
  FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.wake_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.accountability_groups(id) ON DELETE SET NULL,
  signal_type text NOT NULL CHECK (signal_type IN ('gentle','urgent','sos')),
  sent_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.wake_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sender inserts wake signal" ON public.wake_signals
  FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Sender or target reads wake signals" ON public.wake_signals
  FOR SELECT TO authenticated USING (sender_id = auth.uid() OR target_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_wake_signals_target_recent ON public.wake_signals(target_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_wake_signals_pair ON public.wake_signals(sender_id, target_id, sent_at DESC);
```

After running, the "Unable to create group" error in **both Rise and Shield** will be fixed.
