import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function WelcomeScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#0D0D0D', '#1A0A00', '#0D0D0D']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topSection}>
          <View style={styles.emblemContainer}>
            <View style={styles.emblem}>
              <Text style={styles.emblemSymbol}>⚔</Text>
            </View>
          </View>

          <Text style={styles.title}>DAWNBREAKER</Text>
          <View style={styles.divider} />
          <Text style={styles.tagline}>SURVIVE TOGETHER.{'\n'}REBUILD THE WORLD.</Text>
        </View>

        <View style={styles.bottomSection}>
          <Text style={styles.warningText}>
            THE DARKNESS IS REAL. BUT SO IS YOUR SQUAD.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('SignUp')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#E85D04', '#C44D00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButtonGradient}
            >
              <Text style={styles.primaryButtonText}>JOIN THE RESISTANCE</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryButtonText}>ALREADY A SURVIVOR</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  topSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  emblemContainer: {
    marginBottom: 32,
  },
  emblem: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderColor: '#E85D04',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '45deg' }],
  },
  emblemSymbol: {
    fontSize: 28,
    transform: [{ rotate: '-45deg' }],
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#F5F5F5',
    letterSpacing: 8,
    textAlign: 'center',
  },
  divider: {
    width: 80,
    height: 2,
    backgroundColor: '#E85D04',
    marginVertical: 16,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 3,
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomSection: {
    paddingBottom: 40,
  },
  warningText: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 32,
  },
  primaryButton: {
    marginBottom: 12,
    borderWidth: 0,
  },
  primaryButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#F5F5F5',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 3,
  },
  secondaryButton: {
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 3,
  },
});
