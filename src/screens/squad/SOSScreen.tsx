import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../lib/supabase';

export default function SOSScreen({ navigation }: any) {
  async function handleSendSOS() {
    Alert.alert(
      'CONFIRM DISTRESS SIGNAL',
      'Your squad will be alerted immediately. Only send if you need backup.',
      [
        { text: 'ABORT', style: 'cancel' },
        {
          text: 'SEND SOS',
          style: 'destructive',
          onPress: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
              .from('profiles')
              .select('squad_id')
              .eq('id', user.id)
              .single();

            if (!profile?.squad_id) {
              Alert.alert('NO SQUAD', 'You are not in a squad. No one to call for backup.');
              return;
            }

            const { error } = await supabase.from('messages').insert({
              squad_id: profile.squad_id,
              user_id: user.id,
              content: 'SOS - SOLDIER NEEDS BACKUP',
              type: 'sos',
            });

            if (error) {
              Alert.alert('SIGNAL FAILED', error.message);
              return;
            }

            Alert.alert('SIGNAL SENT', 'Your squad has been alerted. Hold your position.', [
              { text: 'COPY', onPress: () => navigation.goBack() },
            ]);
          },
        },
      ]
    );
  }

  return (
    <LinearGradient colors={['#7F1D1D', '#450A0A']} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.sosText}>SOS</Text>
        <View style={styles.divider} />
        <Text style={styles.attackText}>UNDER ATTACK</Text>
        <Text style={styles.answerText}>YOUR SQUAD WILL ANSWER</Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.distressButton}
          onPress={handleSendSOS}
          activeOpacity={0.85}
        >
          <Text style={styles.distressButtonText}>SEND DISTRESS SIGNAL</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.standDownButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <Text style={styles.standDownButtonText}>STAND DOWN</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosText: {
    fontSize: 80,
    fontWeight: '900',
    color: '#F5F5F5',
    letterSpacing: 20,
    lineHeight: 90,
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: '#F5F5F5',
    marginVertical: 24,
    opacity: 0.4,
  },
  attackText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F5F5F5',
    letterSpacing: 8,
    marginBottom: 8,
  },
  answerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FCA5A5',
    letterSpacing: 4,
    textAlign: 'center',
  },
  buttons: {
    gap: 12,
  },
  distressButton: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 20,
    alignItems: 'center',
  },
  distressButtonText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#7F1D1D',
    letterSpacing: 3,
  },
  standDownButton: {
    borderWidth: 1,
    borderColor: 'rgba(245,245,245,0.3)',
    paddingVertical: 18,
    alignItems: 'center',
  },
  standDownButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(245,245,245,0.6)',
    letterSpacing: 4,
  },
});
