-- ============================================================
-- DawnBreaker: Push Notifications Schema
-- Run this in Supabase SQL Editor after game-schema.sql
-- ============================================================

-- Push tokens table — stores Expo push tokens per user per device
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  device_id TEXT NOT NULL DEFAULT 'unknown',
  platform TEXT NOT NULL DEFAULT 'unknown', -- 'ios' | 'android'
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);

-- RLS
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Users can manage their own tokens
CREATE POLICY "Users manage own push tokens" ON push_tokens
  USING (auth.uid() = user_id);

-- Squad members can read each other's tokens (needed for SOS)
CREATE POLICY "Squad members can read squad push tokens" ON push_tokens
  FOR SELECT USING (
    user_id IN (
      SELECT sm2.user_id
      FROM squad_members sm1
      JOIN squad_members sm2 ON sm1.squad_id = sm2.squad_id
      WHERE sm1.user_id = auth.uid()
    )
  );

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);
