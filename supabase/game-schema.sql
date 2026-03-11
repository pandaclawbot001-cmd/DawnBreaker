-- ============================================================
-- DawnBreaker: Survival Game Schema
-- Run this in Supabase SQL Editor after the base schema.sql
-- ============================================================

-- Add game columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS health INTEGER DEFAULT 100;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS character_status TEXT DEFAULT 'idle'; -- 'idle', 'on_mission', 'injured', 'weakened'

-- Inventory table (resources per user)
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  food INTEGER DEFAULT 10,
  medicine INTEGER DEFAULT 5,
  scrap INTEGER DEFAULT 20,
  energy INTEGER DEFAULT 15,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mission templates
CREATE TABLE IF NOT EXISTS mission_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  flavor_text TEXT, -- post-apoc atmosphere text
  duration_hours INTEGER NOT NULL,
  risk_level TEXT NOT NULL, -- 'low', 'medium', 'high', 'extreme'
  min_streak_recommended INTEGER DEFAULT 0,
  reward_credits_min INTEGER DEFAULT 5,
  reward_credits_max INTEGER DEFAULT 15,
  reward_food INTEGER DEFAULT 0,
  reward_medicine INTEGER DEFAULT 0,
  reward_scrap INTEGER DEFAULT 0
);

-- Active/completed missions per user
CREATE TABLE IF NOT EXISTS character_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES mission_templates(id),
  mission_name TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'failed'
  outcome_credits INTEGER,
  outcome_food INTEGER DEFAULT 0,
  outcome_medicine INTEGER DEFAULT 0,
  outcome_scrap INTEGER DEFAULT 0,
  outcome_notes TEXT -- what happened (field report on return)
);

-- Field reports (messages while on mission)
CREATE TABLE IF NOT EXISTS field_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mission_id UUID REFERENCES character_missions(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed mission templates
INSERT INTO mission_templates (name, description, flavor_text, duration_hours, risk_level, min_streak_recommended, reward_credits_min, reward_credits_max, reward_food, reward_medicine, reward_scrap) VALUES
('SCAVENGE RUINS', 'Search collapsed buildings for supplies', 'The old district. Quiet now. Used to be a school.', 2, 'low', 0, 5, 15, 3, 1, 5),
('SCOUT PERIMETER', 'Map enemy movement around the base', 'Stay low. Stay quiet. Come back.', 4, 'medium', 7, 15, 30, 1, 0, 2),
('RAID SUPPLY DEPOT', 'Hit the enemy cache before they move it', 'One shot. No second chances.', 6, 'high', 30, 30, 60, 5, 3, 10),
('FIGHT THE HORDE', 'Stand against the incoming wave', 'They come every night. We hold every night.', 8, 'extreme', 90, 60, 100, 0, 5, 15),
('HELP A SURVIVOR', 'Rescue a stranded survivor outside the wall', 'A signal fire. Someone out there.', 3, 'medium', 14, 10, 25, 2, 2, 3),
('FORTIFY BASE', 'Reinforce the camp defenses', 'Nails. Boards. Hope.', 4, 'low', 0, 8, 18, 0, 0, 15),
('SEEK MEDICINE', 'Find antibiotics in the hospital ruins', 'The smell of rot. But somewhere in there — life.', 5, 'high', 21, 20, 40, 0, 8, 2),
('LONG PATROL', 'Extended mission into deep territory', 'Days out there. Alone. Only the strong return.', 12, 'extreme', 60, 80, 150, 8, 5, 20)
ON CONFLICT DO NOTHING;

-- RLS
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own inventory" ON inventory USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view mission templates" ON mission_templates FOR SELECT USING (true);
CREATE POLICY "Users manage own missions" ON character_missions USING (auth.uid() = user_id);
CREATE POLICY "Users view own field reports" ON field_reports USING (auth.uid() = user_id);
