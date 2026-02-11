-- WhatsApp Sent Log: Kalıcı duplikat koruma tablosu
-- Her lead'e gönderilen mesajın kaydını tutar
-- Aynı lead'e tekrar mesaj gönderilmesini engeller

CREATE TABLE IF NOT EXISTS whatsapp_sent_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id TEXT NOT NULL UNIQUE,
    lead_name TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- lead_id üzerinden hızlı arama için index
CREATE INDEX IF NOT EXISTS idx_whatsapp_sent_log_lead_id ON whatsapp_sent_log(lead_id);

-- RLS Policy: Authenticated kullanıcılar okuyup yazabilir
ALTER TABLE whatsapp_sent_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated access" ON whatsapp_sent_log
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Anon key ile erişim (development)
CREATE POLICY "Allow anon access" ON whatsapp_sent_log
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);
