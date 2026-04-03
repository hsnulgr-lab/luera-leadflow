-- ============================================================
-- Multi-Tenant Migration
-- Her kullanıcı kendi datasına sahip olur (RLS ile izolasyon)
-- ============================================================

-- 1. PROFILES tablosu
-- Supabase auth.users ile 1-1 ilişki, kullanıcı adı tutar
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_own" ON profiles
    FOR ALL TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Yeni kullanıcı kaydolunca otomatik profil oluştur
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

-- ============================================================
-- 2. USER_SETTINGS tablosu
-- Her kullanıcının kendi n8n, Gemini, Evolution ayarları
-- ============================================================
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    n8n_webhook_url TEXT,
    gemini_api_key TEXT,
    evolution_instance_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_settings_own" ON user_settings
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 3. LEADS tablosuna user_id ekle (tablo zaten varsa)
-- ============================================================
ALTER TABLE leads ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Mevcut leads için RLS politikalarını güncelle
DROP POLICY IF EXISTS "Allow authenticated access" ON leads;
DROP POLICY IF EXISTS "Allow anon access" ON leads;

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads_own" ON leads
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- user_id index
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);

-- ============================================================
-- 4. WHATSAPP_SENT_LOG tablosuna user_id ekle
-- ============================================================
ALTER TABLE whatsapp_sent_log ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- lead_id UNIQUE kısıtını kaldır (farklı kullanıcılar aynı lead_id'ye sahip olabilir)
ALTER TABLE whatsapp_sent_log DROP CONSTRAINT IF EXISTS whatsapp_sent_log_lead_id_key;

-- user_id + lead_id kombinasyonu unique olmalı
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'whatsapp_sent_log_user_lead_unique'
    ) THEN
        ALTER TABLE whatsapp_sent_log
            ADD CONSTRAINT whatsapp_sent_log_user_lead_unique UNIQUE (user_id, lead_id);
    END IF;
END $$;

-- Eski RLS politikalarını kaldır
DROP POLICY IF EXISTS "Allow authenticated access" ON whatsapp_sent_log;
DROP POLICY IF EXISTS "Allow anon access" ON whatsapp_sent_log;

CREATE POLICY "sent_log_own" ON whatsapp_sent_log
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_whatsapp_sent_log_user_id ON whatsapp_sent_log(user_id);
