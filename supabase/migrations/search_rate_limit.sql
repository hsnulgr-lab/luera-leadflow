-- ============================================================
-- Search Rate Limiting
-- Kullanıcı başına günlük arama kotası takibi
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

-- RLS
ALTER TABLE search_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kullanıcı kendi usage'ını okuyabilir"
    ON search_usage FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcı kendi usage'ını güncelleyebilir"
    ON search_usage FOR ALL
    USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_search_usage_user_date ON search_usage(user_id, date);
