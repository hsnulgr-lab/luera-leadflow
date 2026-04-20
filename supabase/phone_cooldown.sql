-- Phone Cooldown Table
-- Aynı telefon numarasına tekrar mesaj gönderilmesini engelleyen blacklist/cooldown sistemi

CREATE TABLE IF NOT EXISTS phone_cooldown (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    contacted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    cooldown_until TIMESTAMPTZ NOT NULL,
    lead_names TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Her kullanıcı-telefon çifti unique olmalı
    UNIQUE(user_id, phone)
);

-- Performans için index
CREATE INDEX IF NOT EXISTS idx_phone_cooldown_user_phone 
    ON phone_cooldown(user_id, phone);

CREATE INDEX IF NOT EXISTS idx_phone_cooldown_until 
    ON phone_cooldown(cooldown_until);

-- RLS (Row Level Security)
ALTER TABLE phone_cooldown ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi kayıtlarını görebilir
CREATE POLICY "Users can view own cooldowns" 
    ON phone_cooldown FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cooldowns" 
    ON phone_cooldown FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cooldowns" 
    ON phone_cooldown FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cooldowns" 
    ON phone_cooldown FOR DELETE 
    USING (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_phone_cooldown_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_phone_cooldown_timestamp
    BEFORE UPDATE ON phone_cooldown
    FOR EACH ROW
    EXECUTE FUNCTION update_phone_cooldown_updated_at();
