import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../../lib/supabase';

interface LeaderboardEntry {
  id: string;
  username: string;
  streak_days: number;
  strength_level: number;
}

const RANK_COLORS: Record<number, string> = {
  1: '#FFD700',
  2: '#C0C0C0',
  3: '#CD7F32',
};

export default function LeaderboardScreen() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  async function loadLeaderboard() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);

    const { data } = await supabase
      .from('profiles')
      .select('id, username, streak_days, strength_level')
      .order('streak_days', { ascending: false })
      .limit(20);

    if (data) setEntries(data as LeaderboardEntry[]);
    setLoading(false);
  }

  function renderRow({ item, index }: { item: LeaderboardEntry; index: number }) {
    const rank = index + 1;
    const isOwn = item.id === currentUserId;
    const rankColor = RANK_COLORS[rank] ?? '#F5F5F5';

    return (
      <View style={[styles.row, isOwn && styles.rowOwn]}>
        {isOwn && <View style={styles.ownIndicator} />}
        <Text style={[styles.rankNum, { color: rankColor }]}>
          {rank < 10 ? `0${rank}` : `${rank}`}
        </Text>
        <View style={styles.rowInfo}>
          <Text style={[styles.rowUsername, isOwn && styles.rowUsernameOwn]}>
            {item.username?.toUpperCase() ?? 'UNKNOWN'}
          </Text>
          <Text style={styles.rowLevel}>LVL {item.strength_level}</Text>
        </View>
        <View style={styles.rowStreak}>
          <Text style={[styles.rowStreakNum, { color: rankColor }]}>{item.streak_days}</Text>
          <Text style={styles.rowStreakLabel}>DAYS</Text>
        </View>
      </View>
    );
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>HALL OF GLORY</Text>
        <Text style={styles.headerTitle}>TOP SURVIVORS</Text>
      </View>

      <FlatList
        data={entries}
        renderItem={renderRow}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>NO DATA</Text>
          </View>
        }
      />
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F5F5F5',
    letterSpacing: 4,
    marginTop: 4,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    padding: 14,
    marginBottom: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  rowOwn: {
    borderColor: '#2A2A2A',
  },
  ownIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#E85D04',
  },
  rankNum: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
    width: 36,
    marginLeft: 6,
  },
  rowInfo: {
    flex: 1,
    paddingLeft: 12,
  },
  rowUsername: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F5F5F5',
    letterSpacing: 1,
  },
  rowUsernameOwn: {
    color: '#E85D04',
  },
  rowLevel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 2,
    marginTop: 2,
  },
  rowStreak: {
    alignItems: 'center',
  },
  rowStreakNum: {
    fontSize: 22,
    fontWeight: '900',
  },
  rowStreakLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 2,
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2A2A2A',
    letterSpacing: 4,
  },
});
