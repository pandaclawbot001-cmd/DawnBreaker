import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../lib/supabase';

interface Profile {
  username: string;
  streak_days: number;
  strength_level: number;
  last_check_in: string | null;
}

export default function HomeScreen({ navigation }: any) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [worldRebuildPercent, setWorldRebuildPercent] = useState(0);
  const [totalStreakDays, setTotalStreakDays] = useState(0);

  const WORLD_GOAL = 10000; // global streak-days target

  useEffect(() => {
    loadAll();
  }, []);

  // Refresh when screen comes into focus (e.g. after returning from SOS)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadAll);
    return unsubscribe;
  }, [navigation]);

  async function loadAll() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await Promise.all([
      loadProfile(user.id),
      loadWorldRebuild(),
    ]);
  }

  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('username, streak_days, strength_level, last_check_in')
      .eq('id', userId)
      .single();

    if (!data) return;

    // ── Streak break detection ───────────────────────────────────────────────
    if (data.streak_days > 0 && data.last_check_in) {
      const lastCheckIn = new Date(data.last_check_in);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const checkedInToday = lastCheckIn.toDateString() === today.toDateString();
      const checkedInYesterday = lastCheckIn.toDateString() === yesterday.toDateString();

      if (!checkedInToday && !checkedInYesterday) {
        // Missed at least one full day — break the streak
        await supabase
          .from('profiles')
          .update({ streak_days: 0, strength_level: 1 })
          .eq('id', userId);

        data.streak_days = 0;
        data.strength_level = 1;

        Alert.alert(
          'STREAK BROKEN',
          'YOUR STREAK HAS BEEN BROKEN.\n\nThe darkness reclaimed what you abandoned. Rise again.',
          [{ text: 'I WILL NOT FAIL AGAIN', style: 'default' }]
        );
      }

      setCheckedInToday(checkedInToday);
    } else if (data.last_check_in) {
      const lastCheckIn = new Date(data.last_check_in);
      const today = new Date();
      setCheckedInToday(lastCheckIn.toDateString() === today.toDateString());
    }

    setProfile(data);
  }

  async function loadWorldRebuild() {
    const { data } = await supabase
      .from('profiles')
      .select('streak_days');

    if (data) {
      const total = data.reduce((sum: number, row: any) => sum + (row.streak_days ?? 0), 0);
      setTotalStreakDays(total);
      setWorldRebuildPercent(Math.min((total / WORLD_GOAL) * 100, 100));
    }
  }

  async function handleCheckIn() {
    if (checkedInToday) {
      Alert.alert('ALREADY CHECKED IN', 'You have already reported in today, soldier.');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: ciError } = await supabase.from('check_ins').insert({
      user_id: user.id,
    });

    if (ciError) {
      Alert.alert('ERROR', ciError.message);
      return;
    }

    const newStreak = (profile?.streak_days ?? 0) + 1;
    const newLevel = Math.floor(newStreak / 7) + 1;

    await supabase.from('profiles').update({
      streak_days: newStreak,
      strength_level: newLevel,
      last_check_in: new Date().toISOString(),
    }).eq('id', user.id);

    setCheckedInToday(true);
    setProfile(prev => prev ? { ...prev, streak_days: newStreak, strength_level: newLevel } : prev);

    // Refresh world rebuild meter
    loadWorldRebuild();

    Alert.alert('CHECKED IN', 'You survived another day. Keep fighting.');
  }

  const streak = profile?.streak_days ?? 0;
  const level = profile?.strength_level ?? 1;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.greeting}>WELCOME BACK,</Text>
          <Text style={styles.username}>{profile?.username?.toUpperCase() ?? '---'}</Text>
        </View>

        {/* Streak Counter */}
        <View style={styles.streakCard}>
          <LinearGradient
            colors={['#1A0A00', '#2A1200']}
            style={styles.streakGradient}
          >
            <Text style={styles.streakLabel}>DAYS CLEAN</Text>
            <Text style={styles.streakNumber}>{streak}</Text>
            <View style={styles.streakDivider} />
            <Text style={styles.streakSub}>
              {streak === 0 ? 'START YOUR MISSION TODAY' :
               streak === 1 ? 'FIRST DAY. THE HARDEST.' :
               `${streak} DAYS OF VICTORY`}
            </Text>
          </LinearGradient>
        </View>

        {/* Strength Level + World Rebuild */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>STRENGTH LEVEL</Text>
            <Text style={styles.statValue}>{level}</Text>
            <View style={styles.levelBar}>
              <View style={[styles.levelFill, { width: `${((streak % 7) / 7) * 100}%` }]} />
            </View>
            <Text style={styles.statSub}>{7 - (streak % 7)} DAYS TO NEXT LEVEL</Text>
          </View>

          {/* World Rebuild Meter — now GLOBAL */}
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>WORLD REBUILD</Text>
            <Text style={styles.statValue}>{worldRebuildPercent.toFixed(1)}%</Text>
            <View style={styles.levelBar}>
              <LinearGradient
                colors={['#E85D04', '#FFB300']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.levelFill, styles.worldFill, { width: `${worldRebuildPercent}%` }]}
              />
            </View>
            <Text style={styles.statSub}>{totalStreakDays.toLocaleString()} / 10,000 DAYS</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={[styles.checkInButton, checkedInToday && styles.checkInButtonDone]}
          onPress={handleCheckIn}
          activeOpacity={0.85}
        >
          <Text style={styles.checkInButtonText}>
            {checkedInToday ? 'MISSION COMPLETE TODAY' : 'DAILY CHECK-IN'}
          </Text>
          {!checkedInToday && (
            <Text style={styles.checkInSub}>REPORT YOUR STATUS</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sosButton}
          onPress={() => navigation.navigate('SOS')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#DC2626', '#991B1B']}
            style={styles.sosGradient}
          >
            <Text style={styles.sosButtonText}>SOS</Text>
            <Text style={styles.sosSub}>CALL YOUR SQUAD</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={() => supabase.auth.signOut()}
        >
          <Text style={styles.signOutText}>ABANDON BASE</Text>
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
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 12,
    fontWeight: '600',
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
  streakCard: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E85D04',
  },
  streakGradient: {
    padding: 28,
    alignItems: 'center',
  },
  streakLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E85D04',
    letterSpacing: 4,
    marginBottom: 8,
  },
  streakNumber: {
    fontSize: 72,
    fontWeight: '900',
    color: '#F5F5F5',
    lineHeight: 80,
  },
  streakDivider: {
    width: 40,
    height: 1,
    backgroundColor: '#E85D04',
    marginVertical: 12,
  },
  streakSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    padding: 16,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 2,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F5F5F5',
    marginBottom: 8,
  },
  levelBar: {
    height: 4,
    backgroundColor: '#2A2A2A',
    marginBottom: 6,
  },
  levelFill: {
    height: '100%',
    backgroundColor: '#E85D04',
  },
  worldFill: {
    backgroundColor: undefined,
  },
  statSub: {
    fontSize: 9,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 1,
  },
  checkInButton: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E85D04',
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  checkInButtonDone: {
    borderColor: '#2A2A2A',
    backgroundColor: '#111',
  },
  checkInButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#F5F5F5',
    letterSpacing: 3,
  },
  checkInSub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 2,
    marginTop: 4,
  },
  sosButton: {
    marginBottom: 24,
  },
  sosGradient: {
    padding: 20,
    alignItems: 'center',
  },
  sosButtonText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F5F5F5',
    letterSpacing: 6,
  },
  sosSub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FCA5A5',
    letterSpacing: 3,
    marginTop: 2,
  },
  signOutButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  signOutText: {
    color: '#3A3A3A',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
  },
});
