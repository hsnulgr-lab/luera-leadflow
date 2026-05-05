-- ============================================================
-- LeadFlow — Tüm Migration'ları Tek Seferde Çalıştır
-- Supabase SQL Editor'a bu dosyanın içeriğini yapıştır
-- ============================================================

-- 1. Multi-tenant (profiles, user_settings, leads RLS)
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_own" ON profiles;
CREATE POLICY "profiles_own" ON profiles
    FOR ALL TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'name')
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. USER_SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    n8n_webhook_url TEXT,
    gemini_api_key TEXT,
    evolution_instance_name TEXT,
    business_name TEXT,
    business_sector TEXT,
    business_offer TEXT,
    sender_name TEXT,
    business_website TEXT,
    business_instagram TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_settings_own" ON user_settings;
CREATE POLICY "user_settings_own" ON user_settings
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Business settings columns (idempotent)
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS business_sector TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS business_offer TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS sender_name TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS business_website TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS business_instagram TEXT;

-- 3. LEADS
-- ============================================================
CREATE TABLE IF NOT EXISTS leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    company TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    status TEXT DEFAULT 'new',
    priority TEXT,
    score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leads_own" ON leads;
CREATE POLICY "leads_own" ON leads
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- 4. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type        TEXT NOT NULL DEFAULT 'success'
                CHECK (type IN ('success', 'error', 'warning', 'info', 'automation')),
    title       TEXT NOT NULL,
    message     TEXT,
    lead_id     TEXT,
    read        BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id    ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_view_own_notifications" ON public.notifications;
CREATE POLICY "users_view_own_notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_insert_own_notifications" ON public.notifications;
CREATE POLICY "users_insert_own_notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_update_own_notifications" ON public.notifications;
CREATE POLICY "users_update_own_notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_delete_own_notifications" ON public.notifications;
CREATE POLICY "users_delete_own_notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

-- 5. SEARCH_USAGE (rate limiting)
-- ============================================================
CREATE TABLE IF NOT EXISTS search_usage (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date        DATE NOT NULL DEFAULT CURRENT_DATE,
    count       INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

ALTER TABLE search_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "search_usage_own_select" ON search_usage;
CREATE POLICY "search_usage_own_select"
    ON search_usage FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "search_usage_own_all" ON search_usage;
CREATE POLICY "search_usage_own_all"
    ON search_usage FOR ALL
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_search_usage_user_date ON search_usage(user_id, date);

-- 6. WHATSAPP_SENT_LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS whatsapp_sent_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id TEXT NOT NULL UNIQUE,
    lead_name TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_sent_log_lead_id ON whatsapp_sent_log(lead_id);

ALTER TABLE whatsapp_sent_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "whatsapp_log_authenticated" ON whatsapp_sent_log;
CREATE POLICY "whatsapp_log_authenticated" ON whatsapp_sent_log
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Schema cache reload
NOTIFY pgrst, 'reload schema';
