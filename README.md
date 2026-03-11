# 🌅 DawnBreaker

A post-apocalyptic accountability app. Survivors fight together against the darkness.

---

## ⚡ Quick Start

### 1. Apply the Database Schema (ONE TIME — DO THIS FIRST)

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/aowhykghdxtsdcoeauga
2. Click **SQL Editor** in the left sidebar
3. Click **New query**
4. Open the file `supabase/schema.sql` from this repo and paste the entire contents
5. Click **Run** (or press Cmd+Enter)
6. You should see: "Success. No rows returned"

That's it — database is ready.

### 2. Install Dependencies

```bash
cd ~/DawnBreaker
npm install
```

### 3. Run the App

```bash
npx expo start
```

This will show a QR code in your terminal.

- **iPhone**: Open Camera app → scan QR code → opens in Expo Go
- **Android**: Open Expo Go app → scan QR code
- **Web browser**: Press `w` in the terminal

---

## 📱 App Structure

```
src/
  screens/
    auth/
      WelcomeScreen.tsx     — Landing screen
      LoginScreen.tsx       — Login form
      SignUpScreen.tsx      — Registration form
    main/
      HomeScreen.tsx        — Streak counter, check-in, SOS button
      SquadScreen.tsx       — Squad roster + comms button
      ProfileScreen.tsx     — Badges, rank, stats
      LeaderboardScreen.tsx — Top 20 global leaderboard
    squad/
      SquadChatScreen.tsx   — Real-time squad messaging
      SOSScreen.tsx         — Emergency distress signal
      CreateSquadScreen.tsx — Create a new squad
      JoinSquadScreen.tsx   — Join via squad code
```

---

## 🎮 Features

- **Streak Tracking** — Daily check-in keeps your streak alive
- **Survivor Squads** — Groups of 3–8 for real accountability
- **Real-time Squad Chat** — Live messaging with Supabase Realtime
- **🚨 SOS Emergency** — Instant alert to your entire squad
- **Badges** — Earn ranks from Recruit to Immortal
- **World Rebuild Meter** — Collective progress of all survivors
- **Leaderboards** — Global top 20 by streak days

---

## 🏗️ Tech Stack

- **React Native + Expo** — iOS, Android, Web from one codebase
- **Supabase** — Auth, PostgreSQL, Real-time
- **TypeScript** — Full type safety

---

## 🚀 Deploying to App Stores

### iOS (App Store)
```bash
npx expo build:ios
# or with EAS Build:
npx eas build --platform ios
```
Requires: Apple Developer account ($99/year), Xcode on Mac

### Android (Play Store)
```bash
npx expo build:android
# or with EAS Build:
npx eas build --platform android
```
Requires: Google Play Developer account ($25 one-time)

### Web
```bash
npx expo export --platform web
# Deploy the dist/ folder to Vercel, Netlify, etc.
```

---

## 📊 Database Schema

| Table | Purpose |
|---|---|
| profiles | User profiles, streaks, levels |
| squads | Squad groups with join codes |
| squad_members | Squad membership + roles |
| messages | Real-time squad chat + SOS |
| check_ins | Daily check-in log |

---

## 🔑 Environment Variables

The `.env` file is already configured. Do not commit it to public repos.

---

*Built with 🐼 by Panda*
