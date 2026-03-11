import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../../lib/supabase';

interface Profile {
  username: string;
  streak_days: number;
  strength_level: number;
}

interface Badge {
  name: string;
  days: number;
  emoji: string;
}

const BADGES: Badge[] = [
  { name: 'FIRST BLOOD', days: 1, emoji: '🩸' },
  { name: 'SURVIVOR', days: 7, emoji: '⚔️' },
  { name: 'IRON WILL', days: 14, emoji: '🛡️' },
  { name: 'WARRIOR', days: 30, emoji: '🔥' },
  { name: 'VETERAN', days: 60, emoji: '💀' },
  { name: 'CHAMPION', days: 90, emoji: '👑' },
  { name: 'LEGEND', days: 180, emoji: '🌟' },
  { name: 'IMMORTAL', days: 365, emoji: '⚡' },
];

function getRankTitle(streakDays: number): string {
  if (streakDays >= 365) return 'IMMORTAL';
  if (streakDays >= 180) return 'LEGEND';
  if (streakDays >= 90) return 'CHAMPION';
  if (streakDays >= 30) return 'WARRIOR';
  if (streakDays >= 7) return 'SURVIVOR';
  return 'RECRUIT';
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from('profiles')
      .select('username, streak_days, strength_level')
      .eq('id', user.id)
      .single();

    if (data) setProfile(data);
    setLoading(false);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#E85D04" />
        </View>
      </SafeAreaView>
    );
  }

  const streak = profile?.streak_days ?? 0;
  const rank = getRankTitle(streak);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.usernameLabel}>SOLDIER</Text>
          <Text style={styles.username}>{profile?.username?.toUpperCase() ?? '---'}</Text>
          <View style={styles.rankRow}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>{rank}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>DAYS CLEAN</Text>
            <Text style={styles.statValue}>{streak}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>STRENGTH</Text>
            <Text style={styles.statValue}>LVL {profile?.strength_level ?? 1}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>COMMENDATIONS</Text>
        <View style={styles.badgesGrid}>
          {BADGES.map((badge) => {
            const unlocked = streak >= badge.days;
            return (
              <View key={badge.name} style={[styles.badgeCard, !unlocked && styles.badgeCardLocked]}>
                <Text style={styles.badgeEmoji}>{unlocked ? badge.emoji : '🔒'}</Text>
                <Text style={[styles.badgeName, !unlocked && styles.badgeNameLocked]}>{badge.name}</Text>
                <Text style={[styles.badgeDays, !unlocked && styles.badgeDaysLocked]}>{badge.days}D</Text>
              </View>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={() => supabase.auth.signOut()}
          activeOpacity={0.85}
        >
          <Text style={styles.signOutText}>ABANDON POST</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: '#E85D04',
    paddingLeft: 16,
  },
  usernameLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 4,
  },
  username: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F5F5F5',
    letterSpacing: 3,
    marginTop: 4,
  },
  rankRow: {
    marginTop: 8,
  },
  rankBadge: {
    backgroundColor: '#E85D04',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  rankText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#F5F5F5',
    letterSpacing: 3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    padding: 16,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 2,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F5F5F5',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 3,
    marginBottom: 12,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 40,
  },
  badgeCard: {
    width: '22%',
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    padding: 12,
    alignItems: 'center',
  },
  badgeCardLocked: {
    opacity: 0.3,
  },
  badgeEmoji: {
    fontSize: 22,
    marginBottom: 6,
  },
  badgeName: {
    fontSize: 7,
    fontWeight: '700',
    color: '#F5F5F5',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 2,
  },
  badgeNameLocked: {
    color: '#6B7280',
  },
  badgeDays: {
    fontSize: 8,
    fontWeight: '600',
    color: '#E85D04',
    letterSpacing: 1,
  },
  badgeDaysLocked: {
    color: '#6B7280',
  },
  signOutButton: {
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingVertical: 16,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    letterSpacing: 3,
  },
});
