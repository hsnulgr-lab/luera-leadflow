-- QR Codes table for storing WhatsApp QR codes from Evolution API
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS qr_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    instance_name TEXT UNIQUE NOT NULL,
    qr_base64 TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read QR codes (for frontend)
CREATE POLICY "Allow public read" ON qr_codes
    FOR SELECT USING (true);

-- Allow anyone to insert/update (for N8N webhook)
CREATE POLICY "Allow public insert" ON qr_codes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON qr_codes
    FOR UPDATE USING (true);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_qr_codes_instance ON qr_codes(instance_name);
