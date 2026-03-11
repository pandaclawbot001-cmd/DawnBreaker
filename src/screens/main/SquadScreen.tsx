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

interface SquadMember {
  user_id: string;
  role: string;
  profiles: {
    username: string;
    streak_days: number;
    strength_level: number;
  };
}

interface Squad {
  id: string;
  name: string;
  join_code: string;
}

export default function SquadScreen({ navigation }: any) {
  const [squad, setSquad] = useState<Squad | null>(null);
  const [members, setMembers] = useState<SquadMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSquad();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadSquad);
    return unsubscribe;
  }, [navigation]);

  async function loadSquad() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: profile } = await supabase
      .from('profiles')
      .select('squad_id')
      .eq('id', user.id)
      .single();

    if (!profile?.squad_id) {
      setSquad(null);
      setLoading(false);
      return;
    }

    const { data: squadData } = await supabase
      .from('squads')
      .select('id, name, join_code')
      .eq('id', profile.squad_id)
      .single();

    setSquad(squadData);

    const { data: membersData } = await supabase
      .from('squad_members')
      .select('user_id, role, profiles(username, streak_days, strength_level)')
      .eq('squad_id', profile.squad_id);

    setMembers((membersData as any) ?? []);
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

  if (!squad) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.noSquadScroll}>
          <View style={styles.noSquadHeader}>
            <Text style={styles.noSquadTitle}>NO SQUAD</Text>
            <Text style={styles.noSquadSub}>
              YOU FIGHT ALONE.{'\n'}THAT ENDS TODAY.
            </Text>
          </View>

          <View style={styles.noSquadDivider} />

          <Text style={styles.noSquadDesc}>
            Find your brothers and sisters in arms. Create a squad or join an existing one.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('CreateSquad')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>CREATE A SQUAD</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('JoinSquad')}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryButtonText}>JOIN WITH CODE</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.squadHeader}>
          <Text style={styles.squadLabel}>SQUAD</Text>
          <Text style={styles.squadName}>{squad.name.toUpperCase()}</Text>
          <Text style={styles.squadCode}>CODE: {squad.join_code}</Text>
        </View>

        <TouchableOpacity
          style={styles.commsButton}
          onPress={() => navigation.navigate('SquadChat', { squadId: squad.id, squadName: squad.name })}
          activeOpacity={0.85}
        >
          <Text style={styles.commsButtonText}>ENTER COMMS</Text>
          <Text style={styles.commsSub}>SQUAD COMMUNICATION</Text>
        </TouchableOpacity>

        <Text style={styles.membersLabel}>SQUAD ROSTER — {members.length} SOLDIERS</Text>

        {members.map((member) => (
          <View key={member.user_id} style={styles.memberCard}>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>
                {member.profiles?.username?.toUpperCase() ?? 'UNKNOWN'}
              </Text>
              {member.role === 'leader' && (
                <View style={styles.leaderBadge}>
                  <Text style={styles.leaderBadgeText}>LEADER</Text>
                </View>
              )}
            </View>
            <View style={styles.memberStats}>
              <View style={styles.memberStat}>
                <Text style={styles.memberStatNum}>{member.profiles?.streak_days ?? 0}</Text>
                <Text style={styles.memberStatLabel}>DAYS</Text>
              </View>
              <View style={styles.memberStat}>
                <Text style={styles.memberStatNum}>LVL {member.profiles?.strength_level ?? 1}</Text>
                <Text style={styles.memberStatLabel}>STRENGTH</Text>
              </View>
            </View>
          </View>
        ))}
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
  noSquadScroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  noSquadHeader: {
    marginBottom: 32,
  },
  noSquadTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: '#F5F5F5',
    letterSpacing: 6,
  },
  noSquadSub: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E85D04',
    letterSpacing: 3,
    marginTop: 8,
    lineHeight: 22,
  },
  noSquadDivider: {
    width: 60,
    height: 2,
    backgroundColor: '#E85D04',
    marginBottom: 24,
  },
  noSquadDesc: {
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 40,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#E85D04',
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#F5F5F5',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 3,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingVertical: 18,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 3,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  squadHeader: {
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#E85D04',
    paddingLeft: 16,
  },
  squadLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 4,
  },
  squadName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F5F5F5',
    letterSpacing: 3,
    marginTop: 4,
  },
  squadCode: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E85D04',
    letterSpacing: 2,
    marginTop: 4,
  },
  commsButton: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E85D04',
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  commsButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F5F5F5',
    letterSpacing: 3,
  },
  commsSub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 2,
    marginTop: 4,
  },
  membersLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 3,
    marginBottom: 12,
  },
  memberCard: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F5F5F5',
    letterSpacing: 1,
  },
  leaderBadge: {
    backgroundColor: '#E85D04',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  leaderBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#F5F5F5',
    letterSpacing: 1,
  },
  memberStats: {
    flexDirection: 'row',
    gap: 16,
  },
  memberStat: {
    alignItems: 'center',
  },
  memberStatNum: {
    fontSize: 14,
    fontWeight: '900',
    color: '#E85D04',
  },
  memberStatLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 1,
  },
});
