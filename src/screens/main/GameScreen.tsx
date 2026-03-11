import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import Svg, { Rect, Circle, Path, G, Line } from 'react-native-svg';
import { supabase } from '../../../lib/supabase';

const SCREEN_WIDTH = Dimensions.get('window').width;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Profile {
  id: string;
  username: string;
  streak_days: number;
  character_status: 'idle' | 'on_mission' | 'injured' | 'weakened';
  credits: number;
  health: number;
}

interface Inventory {
  food: number;
  medicine: number;
  scrap: number;
  energy: number;
}

interface MissionTemplate {
  id: string;
  name: string;
  description: string;
  flavor_text: string;
  duration_hours: number;
  risk_level: 'low' | 'medium' | 'high' | 'extreme';
  min_streak_recommended: number;
  reward_credits_min: number;
  reward_credits_max: number;
  reward_food: number;
  reward_medicine: number;
  reward_scrap: number;
}

interface CharacterMission {
  id: string;
  template_id: string | null;
  mission_name: string;
  started_at: string;
  ends_at: string;
  status: 'active' | 'completed' | 'failed';
}

interface FieldReport {
  id: string;
  message: string;
  created_at: string;
}

interface MissionHistoryEntry {
  id: string;
  mission_name: string;
  status: 'completed' | 'failed';
  outcome_credits: number | null;
  outcome_notes: string | null;
  started_at: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FIELD_REPORTS = {
  scavenge: [
    'Found canned goods under the rubble. Still good.',
    'A child drew on the wall here. Before.',
    'Rain coming in. Taking shelter in the old library.',
    'Heard something in the east wing. Moving on.',
  ],
  scout: [
    "Movement spotted at grid 7. Reporting back at dawn.",
    "Three of them. Armed. They didn't see me.",
    'The bridge is still intact. Mark it on the map.',
  ],
  raid: [
    'Breach successful. Heavy resistance. Holding position.',
    'Cache secured. More than expected.',
    'Lost my radio. Using flares.',
  ],
  fight: [
    'Wave incoming. Fifty, maybe more.',
    'They broke through the south wall. Falling back.',
    'We held. Cost us everything. Worth it.',
  ],
  default: [
    'All clear for now.',
    'Moving through sector 4.',
    'Supplies running low but spirits hold.',
    'Night falls. Keeping watch.',
  ],
} as const;

type MissionType = keyof typeof FIELD_REPORTS;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calculateOutcome(
  streakDays: number,
  riskLevel: string
): 'success' | 'partial' | 'fail' {
  const baseChance: Record<string, number> = {
    low: 90,
    medium: 70,
    high: 50,
    extreme: 30,
  };
  const streakBonus = Math.min(streakDays * 0.5, 40);
  const roll = Math.random() * 100;
  const successChance = (baseChance[riskLevel] || 70) + streakBonus;
  if (roll < successChance) return 'success';
  if (roll < successChance + 20) return 'partial';
  return 'fail';
}

function getMissionType(missionName: string): MissionType {
  const name = missionName.toLowerCase();
  if (name.includes('scavenge')) return 'scavenge';
  if (name.includes('scout')) return 'scout';
  if (name.includes('raid')) return 'raid';
  if (name.includes('fight') || name.includes('horde')) return 'fight';
  return 'default';
}

function getRandomReport(missionName: string): string {
  const type = getMissionType(missionName);
  const pool = FIELD_REPORTS[type] as readonly string[];
  return pool[Math.floor(Math.random() * pool.length)];
}

function formatCountdown(endsAt: string): string {
  const remaining = new Date(endsAt).getTime() - Date.now();
  if (remaining <= 0) return 'COMPLETE';
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  return `${hours}H ${minutes}M`;
}

function formatRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'JUST NOW';
  if (minutes < 60) return `${minutes}M AGO`;
  if (hours < 24) return `${hours}H AGO`;
  return `${days}D AGO`;
}

function getRiskColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'low': return '#16A34A';
    case 'medium': return '#F59E0B';
    case 'high': return '#DC2626';
    case 'extreme': return '#7F1D1D';
    default: return '#6B7280';
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'idle': return '#16A34A';
    case 'on_mission': return '#E85D04';
    case 'injured': return '#DC2626';
    case 'weakened': return '#6B7280';
    default: return '#6B7280';
  }
}

// ─── Base Camp Scene ──────────────────────────────────────────────────────────

function BaseCampScene({ isOnMission }: { isOnMission: boolean }) {
  const flickerAnim = useRef(new Animated.Value(0)).current;
  const breathAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Campfire flicker
    Animated.loop(
      Animated.sequence([
        Animated.timing(flickerAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(flickerAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Character breathing (only when idle)
    if (!isOnMission) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(breathAnim, {
            toValue: 1.03,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(breathAnim, {
            toValue: 1.0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isOnMission]);

  const flickerOpacity = flickerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 1.0],
  });

  const flickerScale = flickerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.88, 1.12],
  });

  const W = SCREEN_WIDTH;
  const campX = Math.floor(W / 2) - 25;
  const campY = 148;
  const charLeft = campX + 32;

  return (
    <View style={sceneStyles.container}>
      {/* Static SVG background */}
      <Svg width={W} height={200}>
        {/* Sky */}
        <Rect x="0" y="0" width={W} height="200" fill="#0A0A12" />

        {/* Stars */}
        <Circle cx="28" cy="14" r="1" fill="#FFFFFF" opacity="0.7" />
        <Circle cx="75" cy="22" r="1" fill="#FFFFFF" opacity="0.5" />
        <Circle cx="142" cy="9" r="1.2" fill="#FFFFFF" opacity="0.8" />
        <Circle cx="195" cy="32" r="0.8" fill="#FFFFFF" opacity="0.6" />
        <Circle cx="255" cy="16" r="1" fill="#FFFFFF" opacity="0.65" />
        <Circle cx={W - 28} cy="11" r="1" fill="#FFFFFF" opacity="0.7" />
        <Circle cx={W - 72} cy="19" r="1.2" fill="#FFFFFF" opacity="0.5" />
        <Circle cx={W - 135} cy="7" r="0.8" fill="#FFFFFF" opacity="0.9" />
        <Circle cx={W - 190} cy="27" r="1" fill="#FFFFFF" opacity="0.6" />

        {/* Moon */}
        <Circle cx={W - 48} cy="26" r="13" fill="#D4CF90" opacity="0.9" />
        <Circle cx={W - 42} cy="22" r="9" fill="#0A0A12" opacity="0.25" />

        {/* Left ruined building */}
        <Rect x="12" y="82" width="28" height="78" fill="#101010" />
        <Rect x="40" y="98" width="22" height="62" fill="#0D0D0D" />
        <Rect x="22" y="68" width="14" height="22" fill="#101010" />
        {/* windows */}
        <Rect x="17" y="92" width="7" height="9" fill="#1A1A1A" />
        <Rect x="43" y="112" width="6" height="8" fill="#1A1A1A" />

        {/* Right ruined building */}
        <Rect x={W - 92} y="93" width="32" height="67" fill="#101010" />
        <Rect x={W - 60} y="106" width="44" height="54" fill="#0D0D0D" />
        <Rect x={W - 82} y="78" width="16" height="22" fill="#101010" />
        {/* windows */}
        <Rect x={W - 80} y="99" width="6" height="8" fill="#1A1A1A" />
        <Rect x={W - 55} y="115" width="7" height="9" fill="#1A1A1A" />

        {/* Ground */}
        <Rect x="0" y="160" width={W} height="40" fill="#151515" />
        <Rect x="0" y="160" width={W} height="1" fill="#2A2A2A" />

        {/* Ground rubble details */}
        <Rect x="70" y="158" width="18" height="5" fill="#1E1E1E" />
        <Rect x="92" y="156" width="8" height="4" fill="#1E1E1E" />
        <Rect x={W - 105} y="156" width="22" height="6" fill="#1E1E1E" />

        {/* Campfire logs */}
        <Rect x={campX - 11} y={campY - 1} width="30" height="5" fill="#5A3520" />
        <Rect x={campX + 1} y={campY - 13} width="7" height="14" fill="#3A2010" />
        <Rect x={campX + 3} y={campY - 16} width="3" height="5" fill="#2A1408" />
      </Svg>

      {/* Animated campfire flames */}
      <Animated.View
        style={[
          sceneStyles.campfire,
          {
            left: campX - 10,
            top: campY - 32,
            opacity: flickerOpacity,
            transform: [{ scale: flickerScale }],
          },
        ]}
      >
        <Svg width="36" height="34">
          {/* Glow */}
          <Circle cx="18" cy="22" r="14" fill="#E85D04" opacity="0.2" />
          {/* Outer flame */}
          <Path d="M18 2 L25 18 L18 24 L11 18 Z" fill="#FF5500" />
          {/* Mid flame */}
          <Path d="M18 7 L23 18 L18 22 L13 18 Z" fill="#FF8C00" />
          {/* Inner hot */}
          <Circle cx="18" cy="18" r="5" fill="#FFD060" opacity="0.85" />
        </Svg>
      </Animated.View>

      {/* Character (idle) or Away text (on mission) */}
      {isOnMission ? (
        <View style={sceneStyles.awayOverlay}>
          <Text style={sceneStyles.awayText}>AWAY ON MISSION</Text>
        </View>
      ) : (
        <Animated.View
          style={[
            sceneStyles.character,
            {
              left: charLeft,
              top: 112,
              transform: [{ scaleY: breathAnim }],
            },
          ]}
        >
          <Svg width="22" height="46">
            {/* Head */}
            <Circle cx="11" cy="5" r="5" fill="#E85D04" />
            {/* Body */}
            <Rect x="6" y="11" width="10" height="16" fill="#E85D04" />
            {/* Arms */}
            <Line
              x1="6" y1="14" x2="0" y2="25"
              stroke="#E85D04" strokeWidth="2.5" strokeLinecap="round"
            />
            <Line
              x1="16" y1="14" x2="22" y2="25"
              stroke="#E85D04" strokeWidth="2.5" strokeLinecap="round"
            />
            {/* Legs */}
            <Line
              x1="8" y1="27" x2="5" y2="45"
              stroke="#E85D04" strokeWidth="2.5" strokeLinecap="round"
            />
            <Line
              x1="14" y1="27" x2="17" y2="45"
              stroke="#E85D04" strokeWidth="2.5" strokeLinecap="round"
            />
          </Svg>
        </Animated.View>
      )}
    </View>
  );
}

const sceneStyles = StyleSheet.create({
  container: {
    height: 200,
    overflow: 'hidden',
  },
  campfire: {
    position: 'absolute',
  },
  character: {
    position: 'absolute',
  },
  awayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  awayText: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 4,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function GameScreen() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [missions, setMissions] = useState<MissionTemplate[]>([]);
  const [activeMission, setActiveMission] = useState<CharacterMission | null>(null);
  const [fieldReports, setFieldReports] = useState<FieldReport[]>([]);
  const [countdown, setCountdown] = useState('');
  const [latestReport, setLatestReport] = useState<FieldReport | null>(null);
  const [missionHistory, setMissionHistory] = useState<MissionHistoryEntry[]>([]);

  const isOnMission = profile?.character_status === 'on_mission';

  // ── Data loading ────────────────────────────────────────────────────────────

  useEffect(() => {
    loadAll();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!activeMission) return;
    setCountdown(formatCountdown(activeMission.ends_at));
    const interval = setInterval(() => {
      setCountdown(formatCountdown(activeMission.ends_at));
    }, 60000);
    return () => clearInterval(interval);
  }, [activeMission]);

  async function loadAll() {
    setLoading(true);
    try {
      await loadProfileAndMission();
      await Promise.all([loadInventory(), loadMissions(), loadFieldReports(), loadMissionHistory()]);
    } finally {
      setLoading(false);
    }
  }

  async function loadProfileAndMission() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('id, username, streak_days, character_status, credits, health')
      .eq('id', user.id)
      .single();

    if (!data) return;

    // Check if a completed mission is waiting to be resolved
    await checkMissionCompletion(user.id, data);

    // Re-fetch profile in case status changed
    const { data: fresh } = await supabase
      .from('profiles')
      .select('id, username, streak_days, character_status, credits, health')
      .eq('id', user.id)
      .single();

    if (fresh) setProfile(fresh as Profile);

    if (fresh?.character_status === 'on_mission') {
      await loadActiveMission(user.id);
    } else {
      setActiveMission(null);
    }
  }

  async function loadActiveMission(userId: string) {
    const { data } = await supabase
      .from('character_missions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (data) {
      setActiveMission(data as CharacterMission);
      const { data: reports } = await supabase
        .from('field_reports')
        .select('*')
        .eq('mission_id', data.id)
        .order('created_at', { ascending: false })
        .limit(1);
      if (reports && reports.length > 0) {
        setLatestReport(reports[0] as FieldReport);
      }
    }
  }

  async function loadInventory() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('inventory')
      .select('food, medicine, scrap, energy')
      .eq('user_id', user.id)
      .single();
    if (data) setInventory(data as Inventory);
  }

  async function loadMissions() {
    const { data } = await supabase
      .from('mission_templates')
      .select('*')
      .order('duration_hours', { ascending: true });
    if (data) setMissions(data as MissionTemplate[]);
  }

  async function loadMissionHistory() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('character_missions')
      .select('id, mission_name, status, outcome_credits, outcome_notes, started_at')
      .eq('user_id', user.id)
      .in('status', ['completed', 'failed'])
      .order('started_at', { ascending: false })
      .limit(5);
    if (data) setMissionHistory(data as MissionHistoryEntry[]);
  }

  async function loadFieldReports() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('field_reports')
      .select('id, message, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    if (data) setFieldReports(data as FieldReport[]);
  }

  // ── Mission completion ──────────────────────────────────────────────────────

  async function checkMissionCompletion(userId: string, profileData: any) {
    if (profileData.character_status !== 'on_mission') return;

    const { data: mission } = await supabase
      .from('character_missions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!mission) return;
    if (new Date(mission.ends_at) > new Date()) return; // not done yet

    // Get template for rewards and risk
    let template: MissionTemplate | null = null;
    if (mission.template_id) {
      const { data: tpl } = await supabase
        .from('mission_templates')
        .select('*')
        .eq('id', mission.template_id)
        .single();
      template = tpl as MissionTemplate;
    }

    const riskLevel = template?.risk_level || 'medium';
    const outcome = calculateOutcome(profileData.streak_days ?? 0, riskLevel);

    let creditsEarned = 0;
    let foodEarned = 0;
    let medicineEarned = 0;
    let scrapEarned = 0;
    let outcomeNotes = '';

    if (outcome === 'success') {
      creditsEarned = template
        ? Math.floor(
            Math.random() *
              (template.reward_credits_max - template.reward_credits_min + 1)
          ) + template.reward_credits_min
        : 10;
      foodEarned = template?.reward_food ?? 0;
      medicineEarned = template?.reward_medicine ?? 0;
      scrapEarned = template?.reward_scrap ?? 0;
      outcomeNotes = 'MISSION SUCCESS. All objectives secured. Returning to base.';
    } else if (outcome === 'partial') {
      creditsEarned = Math.floor((template?.reward_credits_min ?? 5) * 0.6);
      foodEarned = Math.floor((template?.reward_food ?? 0) * 0.5);
      medicineEarned = Math.floor((template?.reward_medicine ?? 0) * 0.5);
      scrapEarned = Math.floor((template?.reward_scrap ?? 0) * 0.5);
      outcomeNotes = 'PARTIAL COMPLETION. Ran into trouble but made it back.';
    } else {
      outcomeNotes = 'MISSION FAILED. Barely escaped. No supplies recovered.';
    }

    // Update mission record
    await supabase
      .from('character_missions')
      .update({
        status: outcome === 'fail' ? 'failed' : 'completed',
        outcome_credits: creditsEarned,
        outcome_food: foodEarned,
        outcome_medicine: medicineEarned,
        outcome_scrap: scrapEarned,
        outcome_notes: outcomeNotes,
      })
      .eq('id', mission.id);

    // Reset character status, add credits
    await supabase
      .from('profiles')
      .update({
        character_status: 'idle',
        credits: (profileData.credits ?? 0) + creditsEarned,
      })
      .eq('id', userId);

    // Update inventory
    if (foodEarned > 0 || medicineEarned > 0 || scrapEarned > 0) {
      const { data: inv } = await supabase
        .from('inventory')
        .select('food, medicine, scrap')
        .eq('user_id', userId)
        .single();
      if (inv) {
        await supabase
          .from('inventory')
          .update({
            food: (inv.food ?? 0) + foodEarned,
            medicine: (inv.medicine ?? 0) + medicineEarned,
            scrap: (inv.scrap ?? 0) + scrapEarned,
          })
          .eq('user_id', userId);
      }
    }

    // Insert return field report
    await supabase.from('field_reports').insert({
      user_id: userId,
      mission_id: mission.id,
      message: outcomeNotes,
    });

    const title =
      outcome === 'success'
        ? 'MISSION COMPLETE'
        : outcome === 'partial'
        ? 'PARTIAL SUCCESS'
        : 'MISSION FAILED';

    const body =
      outcome === 'fail'
        ? 'Your survivor returned empty-handed. Strengthen your streak for better odds next time.'
        : `Earned: ${creditsEarned} credits · ${foodEarned} food · ${medicineEarned} medicine · ${scrapEarned} scrap`;

    Alert.alert(title, `${outcomeNotes}\n\n${body}`);
  }

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function assignMission(template: MissionTemplate) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !profile) return;

    const isRisky = profile.streak_days < template.min_streak_recommended;

    Alert.alert(
      `MISSION: ${template.name}`,
      `${template.description}\n\n"${template.flavor_text}"\n\nDURATION: ${template.duration_hours}H\nRISK: ${template.risk_level.toUpperCase()}\nREWARD: ${template.reward_credits_min}–${template.reward_credits_max} CREDITS${
        isRisky
          ? '\n\n⚠ WARNING: YOUR STREAK IS BELOW RECOMMENDED. HIGH FAILURE RISK.'
          : ''
      }`,
      [
        { text: 'STAND DOWN', style: 'cancel' },
        {
          text: 'DEPLOY',
          onPress: async () => {
            const endsAt = new Date(
              Date.now() + template.duration_hours * 3600000
            ).toISOString();

            const { data: missionData, error } = await supabase
              .from('character_missions')
              .insert({
                user_id: user.id,
                template_id: template.id,
                mission_name: template.name,
                ends_at: endsAt,
              })
              .select()
              .single();

            if (error) {
              Alert.alert('ERROR', error.message);
              return;
            }

            await supabase
              .from('profiles')
              .update({ character_status: 'on_mission' })
              .eq('id', user.id);

            // Initial field report on deploy
            await supabase.from('field_reports').insert({
              user_id: user.id,
              mission_id: missionData.id,
              message: `Deployed on ${template.name}. ${template.flavor_text}`,
            });

            await loadAll();
          },
        },
      ]
    );
  }

  async function handleCheckIn() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !activeMission) return;

    const message = getRandomReport(activeMission.mission_name);

    const { error } = await supabase.from('field_reports').insert({
      user_id: user.id,
      mission_id: activeMission.id,
      message,
    });

    if (error) {
      Alert.alert('ERROR', error.message);
      return;
    }

    const newReport: FieldReport = {
      id: Date.now().toString(),
      message,
      created_at: new Date().toISOString(),
    };
    setLatestReport(newReport);
    setFieldReports((prev) => [newReport, ...prev.slice(0, 4)]);
    Alert.alert('FIELD REPORT RECEIVED', `"${message}"`);
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E85D04" />
          <Text style={styles.loadingText}>LOADING BASE CAMP...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const streak = profile?.streak_days ?? 0;
  const status = profile?.character_status ?? 'idle';
  const statusColor = getStatusColor(status);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerLabel}>BASE CAMP</Text>
          <Text style={styles.headerTitle}>
            {profile?.username?.toUpperCase() ?? '---'}
          </Text>
        </View>

        {/* Character Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusTopRow}>
            <View>
              <Text style={styles.smallLabel}>COMBAT STRENGTH</Text>
              <Text style={styles.combatStrength}>{streak} DAYS</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: statusColor + '22',
                  borderColor: statusColor,
                },
              ]}
            >
              <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                {status.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.miniStatsRow}>
            <View style={styles.miniStat}>
              <Text style={styles.smallLabel}>CREDITS</Text>
              <Text style={styles.miniStatValue}>{profile?.credits ?? 0}</Text>
            </View>
            <View style={styles.miniStatDivider} />
            <View style={styles.miniStat}>
              <Text style={styles.smallLabel}>HEALTH</Text>
              <Text style={styles.miniStatValue}>{profile?.health ?? 100}</Text>
            </View>
          </View>
        </View>

        {/* Base Camp Scene */}
        <View style={styles.sceneWrapper}>
          <BaseCampScene isOnMission={isOnMission} />
        </View>

        {/* Inventory Row */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>INVENTORY</Text>
        </View>
        <View style={styles.inventoryRow}>
          {[
            { icon: '🥫', label: 'FOOD', value: inventory?.food ?? 0 },
            { icon: '💊', label: 'MEDS', value: inventory?.medicine ?? 0 },
            { icon: '🔧', label: 'SCRAP', value: inventory?.scrap ?? 0 },
            { icon: '⚡', label: 'ENERGY', value: inventory?.energy ?? 0 },
          ].map((item) => (
            <View key={item.label} style={styles.inventoryCard}>
              <Text style={styles.inventoryIcon}>{item.icon}</Text>
              <Text style={styles.inventoryValue}>{item.value}</Text>
              <Text style={styles.inventoryLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Mission Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {isOnMission ? 'ACTIVE MISSION' : 'ASSIGN MISSION'}
          </Text>
        </View>

        {isOnMission && activeMission ? (
          /* ── Active mission card ── */
          <View style={styles.activeMissionCard}>
            <Text style={styles.activeMissionName}>
              {activeMission.mission_name}
            </Text>

            <Text style={styles.smallLabel}>RETURNS IN</Text>
            <Text style={styles.countdown}>{countdown}</Text>

            {/* Progress bar */}
            {(() => {
              const total =
                new Date(activeMission.ends_at).getTime() -
                new Date(activeMission.started_at).getTime();
              const elapsed =
                Date.now() - new Date(activeMission.started_at).getTime();
              const progress = Math.min(elapsed / total, 1);
              return (
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.round(progress * 100)}%` },
                    ]}
                  />
                </View>
              );
            })()}

            {latestReport && (
              <View style={styles.latestReportBox}>
                <Text style={styles.smallLabel}>LATEST REPORT</Text>
                <Text style={styles.latestReportText}>
                  "{latestReport.message}"
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.checkInBtn}
              onPress={handleCheckIn}
              activeOpacity={0.8}
            >
              <Text style={styles.checkInBtnText}>CHECK IN</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ── Mission picker ── */
          missions.map((template) => {
            const isRisky =
              streak < template.min_streak_recommended;
            const riskColor = getRiskColor(template.risk_level);
            return (
              <TouchableOpacity
                key={template.id}
                style={styles.missionCard}
                onPress={() => assignMission(template)}
                activeOpacity={0.8}
              >
                <View style={styles.missionCardTop}>
                  <Text style={styles.missionName}>{template.name}</Text>
                  <View
                    style={[
                      styles.riskBadge,
                      { borderColor: riskColor },
                    ]}
                  >
                    <Text style={[styles.riskText, { color: riskColor }]}>
                      {template.risk_level.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.missionCardBottom}>
                  <Text style={styles.missionDuration}>
                    {template.duration_hours} HRS
                  </Text>
                  <Text style={styles.missionReward}>
                    {template.reward_credits_min}–{template.reward_credits_max}{' '}
                    CREDITS
                  </Text>
                  {isRisky && (
                    <Text style={styles.riskyWarning}>⚠ RISKY</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* Field Reports */}
        {fieldReports.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 8 }]}>
              <Text style={styles.sectionTitle}>FIELD LOG</Text>
            </View>
            {fieldReports.map((report) => (
              <View key={report.id} style={styles.fieldReport}>
                <Text style={styles.fieldReportTime}>
                  {formatRelativeTime(report.created_at)}
                </Text>
                <Text style={styles.fieldReportText}>"{report.message}"</Text>
              </View>
            ))}
          </>
        )}

        {/* Mission History */}
        {missionHistory.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 8 }]}>
              <Text style={styles.sectionTitle}>MISSION HISTORY</Text>
            </View>
            {missionHistory.map((entry) => {
              const isComplete = entry.status === 'completed';
              const statusColor = isComplete ? '#16A34A' : '#DC2626';
              return (
                <View key={entry.id} style={styles.historyCard}>
                  <View style={styles.historyCardTop}>
                    <Text style={styles.historyMissionName}>{entry.mission_name}</Text>
                    <View style={[styles.historyStatusBadge, { borderColor: statusColor }]}>
                      <Text style={[styles.historyStatusText, { color: statusColor }]}>
                        {isComplete ? 'COMPLETE' : 'FAILED'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.historyCardBottom}>
                    <Text style={styles.historyTime}>{formatRelativeTime(entry.started_at)}</Text>
                    {entry.outcome_credits != null && entry.outcome_credits > 0 && (
                      <Text style={styles.historyCredits}>+{entry.outcome_credits} CREDITS</Text>
                    )}
                  </View>
                  {entry.outcome_notes && (
                    <Text style={styles.historyNotes}>"{entry.outcome_notes}"</Text>
                  )}
                </View>
              );
            })}
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  scroll: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#6B7280',
    marginTop: 16,
    letterSpacing: 3,
    fontSize: 11,
    fontWeight: '700',
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#F5F5F5',
    letterSpacing: 3,
    marginTop: 4,
  },

  // Status card
  statusCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    padding: 16,
  },
  statusTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  smallLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 2,
    marginBottom: 4,
  },
  combatStrength: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F5F5F5',
    letterSpacing: 2,
  },
  statusBadge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },
  miniStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniStat: {},
  miniStatDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#2A2A2A',
    marginHorizontal: 16,
  },
  miniStatValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F5F5F5',
  },

  // Scene
  sceneWrapper: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#2A2A2A',
    marginBottom: 16,
  },

  // Inventory
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E85D04',
    letterSpacing: 3,
  },
  inventoryRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 20,
  },
  inventoryCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingVertical: 12,
    alignItems: 'center',
  },
  inventoryIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  inventoryValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F5F5F5',
  },
  inventoryLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 1,
    marginTop: 2,
  },

  // Mission cards (picker)
  missionCard: {
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    padding: 14,
  },
  missionCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  missionName: {
    fontSize: 13,
    fontWeight: '900',
    color: '#F5F5F5',
    letterSpacing: 2,
    flex: 1,
  },
  riskBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  riskText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  missionCardBottom: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  missionDuration: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 1,
  },
  missionReward: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E85D04',
    letterSpacing: 1,
  },
  riskyWarning: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
    letterSpacing: 1,
  },

  // Active mission card
  activeMissionCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E85D04',
    padding: 20,
  },
  activeMissionName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F5F5F5',
    letterSpacing: 2,
    marginBottom: 14,
  },
  countdown: {
    fontSize: 36,
    fontWeight: '900',
    color: '#E85D04',
    letterSpacing: 4,
    marginBottom: 14,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#2A2A2A',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E85D04',
  },
  latestReportBox: {
    marginBottom: 16,
  },
  latestReportText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#9CA3AF',
    lineHeight: 18,
  },
  checkInBtn: {
    borderWidth: 1,
    borderColor: '#E85D04',
    padding: 12,
    alignItems: 'center',
  },
  checkInBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#E85D04',
    letterSpacing: 3,
  },

  // Mission history
  historyCard: {
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    padding: 14,
  },
  historyCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  historyMissionName: {
    fontSize: 12,
    fontWeight: '900',
    color: '#F5F5F5',
    letterSpacing: 1,
    flex: 1,
  },
  historyStatusBadge: {
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  historyStatusText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  historyCardBottom: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 4,
  },
  historyTime: {
    fontSize: 9,
    fontWeight: '700',
    color: '#3A3A3A',
    letterSpacing: 2,
  },
  historyCredits: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E85D04',
    letterSpacing: 1,
  },
  historyNotes: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#6B7280',
    lineHeight: 16,
  },

  // Field log
  fieldReport: {
    marginHorizontal: 20,
    marginBottom: 10,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#2A2A2A',
  },
  fieldReportTime: {
    fontSize: 9,
    fontWeight: '700',
    color: '#3A3A3A',
    letterSpacing: 2,
    marginBottom: 4,
  },
  fieldReportText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#6B7280',
    lineHeight: 18,
  },
});
