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

export default function SignUpScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert('MISSING DATA', 'All fields are required, soldier.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('WEAK PASSWORD', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create auth user
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      // Supabase returns a fake user with empty identities if the email is already registered
      if (data.user && data.user.identities?.length === 0) {
        throw new Error('An account with this email already exists. Try logging in instead.');
      }

      // Step 2: Create profile record
      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          username: username.trim(),
        });
        // Ignore duplicate profile errors (user may have been created before)
        if (profileError && !profileError.message.includes('duplicate')) {
          throw profileError;
        }
      }

      // Step 3: If no session yet (email confirmation required), sign in immediately
      if (!data.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

        if (signInError) {
          // Email confirmation is enabled — can't auto sign-in
          Alert.alert(
            'ALMOST THERE',
            'Check your email and confirm your account, then come back and log in.',
            [{ text: 'COPY THAT', onPress: () => navigation.navigate('Login') }]
          );
          return;
        }
        // signIn success — onAuthStateChange in App.tsx will handle navigation
      }
      // If data.session exists, onAuthStateChange fires automatically
    } catch (err: any) {
      Alert.alert('RECRUITMENT FAILED', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>ENLIST NOW</Text>
          <Text style={styles.subtitle}>FORGE YOUR IDENTITY</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>SURVIVOR NAME</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Your callsign..."
              placeholderTextColor="#3A3A3A"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor="#3A3A3A"
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 6 characters"
              placeholderTextColor="#3A3A3A"
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#F5F5F5" />
            ) : (
              <Text style={styles.buttonText}>ENLIST</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.linkText}>ALREADY ENLISTED? LOG IN</Text>
          </TouchableOpacity>
        </View>
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
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 48,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#F5F5F5',
    letterSpacing: 6,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E85D04',
    letterSpacing: 4,
    marginTop: 8,
  },
  form: {
    flex: 1,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 3,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: '#F5F5F5',
    fontSize: 15,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#E85D04',
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#7A2E00',
  },
  buttonText: {
    color: '#F5F5F5',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 4,
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  linkText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
  },
});
