-- DawnBreaker Schema

-- Profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  streak_days INTEGER DEFAULT 0,
  strength_level INTEGER DEFAULT 1,
  squad_id UUID,
  last_check_in TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Squads table
CREATE TABLE IF NOT EXISTS squads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  join_code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key from profiles to squads
ALTER TABLE profiles ADD CONSTRAINT fk_profiles_squad
  FOREIGN KEY (squad_id) REFERENCES squads(id) ON DELETE SET NULL;

-- Squad members table
CREATE TABLE IF NOT EXISTS squad_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- 'leader' or 'member'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(squad_id, user_id)
);

-- Messages table (squad chat)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'message', -- 'message' or 'sos'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Check-ins table
CREATE TABLE IF NOT EXISTS check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  note TEXT
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Squads policies
CREATE POLICY "Anyone can view squads" ON squads FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create squads" ON squads FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Squad members policies
CREATE POLICY "Anyone can view squad members" ON squad_members FOR SELECT USING (true);
CREATE POLICY "Users can join squads" ON squad_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave squads" ON squad_members FOR DELETE USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Squad members can view messages" ON messages FOR SELECT
  USING (squad_id IN (SELECT squad_id FROM squad_members WHERE user_id = auth.uid()));
CREATE POLICY "Squad members can send messages" ON messages FOR INSERT
  WITH CHECK (squad_id IN (SELECT squad_id FROM squad_members WHERE user_id = auth.uid()));

-- Check-ins policies
CREATE POLICY "Users can view own check-ins" ON check_ins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own check-ins" ON check_ins FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
