-- ============================================================
-- Business Settings Migration
-- İşletme bilgileri — AI mesaj kişiselleştirme için
-- ============================================================

ALTER TABLE user_settings
    ADD COLUMN IF NOT EXISTS business_name     TEXT,
    ADD COLUMN IF NOT EXISTS business_sector   TEXT,
    ADD COLUMN IF NOT EXISTS business_offer    TEXT,
    ADD COLUMN IF NOT EXISTS sender_name       TEXT,
    ADD COLUMN IF NOT EXISTS business_website  TEXT,
    ADD COLUMN IF NOT EXISTS business_instagram TEXT;
