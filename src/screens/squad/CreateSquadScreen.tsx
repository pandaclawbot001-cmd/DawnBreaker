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

function generateJoinCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function CreateSquadScreen({ navigation }: any) {
  const [squadName, setSquadName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreateSquad() {
    if (!squadName.trim()) {
      Alert.alert('MISSING INFO', 'Enter a unit designation, soldier.');
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const joinCode = generateJoinCode();

    const { data: squad, error: squadError } = await supabase
      .from('squads')
      .insert({ name: squadName.trim(), join_code: joinCode, created_by: user.id })
      .select('id')
      .single();

    if (squadError || !squad) {
      Alert.alert('MISSION FAILED', squadError?.message ?? 'Could not create squad.');
      setLoading(false);
      return;
    }

    const { error: memberError } = await supabase
      .from('squad_members')
      .insert({ squad_id: squad.id, user_id: user.id, role: 'leader' });

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
    Alert.alert('SQUAD DEPLOYED', `Your unit is operational.\nJoin code: ${joinCode}`, [
      { text: 'ROGER THAT', onPress: () => navigation.goBack() },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>ESTABLISH BASE CAMP</Text>
          <View style={styles.divider} />
          <Text style={styles.subtitle}>FORGE YOUR UNIT. LEAD THE CHARGE.</Text>
        </View>

        <Text style={styles.label}>UNIT DESIGNATION</Text>
        <TextInput
          style={styles.input}
          value={squadName}
          onChangeText={setSquadName}
          placeholder="ENTER SQUAD NAME"
          placeholderTextColor="#3A3A3A"
          autoCapitalize="characters"
          maxLength={30}
        />

        <TouchableOpacity
          style={[styles.deployButton, loading && styles.deployButtonDisabled]}
          onPress={handleCreateSquad}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#F5F5F5" />
          ) : (
            <Text style={styles.deployButtonText}>DEPLOY SQUAD</Text>
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
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 32,
  },
  deployButton: {
    backgroundColor: '#E85D04',
    paddingVertical: 20,
    alignItems: 'center',
  },
  deployButtonDisabled: {
    backgroundColor: '#6B7280',
  },
  deployButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#F5F5F5',
    letterSpacing: 4,
  },
});
