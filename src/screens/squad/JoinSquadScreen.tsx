import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../../lib/supabase';

export default function JoinSquadScreen({ navigation }: any) {
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    if (!joinCode.trim()) {
      Alert.alert('MISSING INFO', 'Enter a squad code, soldier.');
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: squad, error: squadError } = await supabase
      .from('squads')
      .select('id, name')
      .eq('join_code', joinCode.trim().toUpperCase())
      .single();

    if (squadError || !squad) {
      Alert.alert('SQUAD NOT FOUND', 'That code is invalid. Check with your unit leader.');
      setLoading(false);
      return;
    }

    const { data: existingMembers, error: countError } = await supabase
      .from('squad_members')
      .select('user_id')
      .eq('squad_id', squad.id);

    if (countError) {
      Alert.alert('ERROR', countError.message);
      setLoading(false);
      return;
    }

    if ((existingMembers?.length ?? 0) >= 8) {
      Alert.alert('SQUAD FULL', 'This unit has reached maximum capacity. Find another squad.');
      setLoading(false);
      return;
    }

    const { error: memberError } = await supabase
      .from('squad_members')
      .insert({ squad_id: squad.id, user_id: user.id, role: 'member' });

    if (memberError) {
      Alert.alert('MISSION FAILED', memberError.message);
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ squad_id: squad.id })
      .eq('id', user.id);

    if (profileError) {
      Alert.alert('MISSION FAILED', profileError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    Alert.alert('UNIT JOINED', `You are now part of ${squad.name.toUpperCase()}.`, [
      { text: 'MOVE OUT', onPress: () => navigation.goBack() },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>FIND YOUR UNIT</Text>
          <View style={styles.divider} />
          <Text style={styles.subtitle}>NO SOLDIER FIGHTS ALONE.</Text>
        </View>

        <Text style={styles.label}>SQUAD CODE</Text>
        <TextInput
          style={styles.input}
          value={joinCode}
          onChangeText={(text) => setJoinCode(text.toUpperCase())}
          placeholder="ENTER 6-CHAR CODE"
          placeholderTextColor="#3A3A3A"
          autoCapitalize="characters"
          maxLength={6}
        />

        <TouchableOpacity
          style={[styles.joinButton, loading && styles.joinButtonDisabled]}
          onPress={handleJoin}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#F5F5F5" />
          ) : (
            <Text style={styles.joinButtonText}>JOIN THE FIGHT</Text>
          )}
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
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#F5F5F5',
    letterSpacing: 4,
  },
  divider: {
    width: 48,
    height: 2,
    backgroundColor: '#E85D04',
    marginVertical: 16,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 3,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    color: '#F5F5F5',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
  joinButton: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E85D04',
    paddingVertical: 20,
    alignItems: 'center',
  },
  joinButtonDisabled: {
    borderColor: '#6B7280',
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#F5F5F5',
    letterSpacing: 4,
  },
});
