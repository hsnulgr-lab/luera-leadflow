-- TimeFlow entegrasyon key'i için user_settings'e sütun ekle
ALTER TABLE user_settings
    ADD COLUMN IF NOT EXISTS timeflow_api_key TEXT;
