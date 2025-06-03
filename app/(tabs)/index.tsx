
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function LaunchScreen() {
  const router = useRouter();
  const [showButtons, setShowButtons] = useState(false);
  
  // Animation values
  const crownOpacity = useSharedValue(0);
  const crownScale = useSharedValue(0.5);
  const titleOpacity = useSharedValue(0);
  const buttonsOpacity = useSharedValue(0);

  useEffect(() => {
    // Crown animation
    crownOpacity.value = withTiming(1, { duration: 1000 });
    crownScale.value = withSequence(
      withTiming(1.2, { duration: 800 }),
      withTiming(1, { duration: 200 })
    );
    
    // Title animation
    titleOpacity.value = withDelay(1200, withTiming(1, { duration: 800 }));
    
    // Show buttons after 3 seconds
    setTimeout(() => {
      setShowButtons(true);
      buttonsOpacity.value = withTiming(1, { duration: 600 });
    }, 3000);
  }, []);

  const crownAnimatedStyle = useAnimatedStyle(() => ({
    opacity: crownOpacity.value,
    transform: [{ scale: crownScale.value }],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const buttonsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Animated Crown Logo */}
      <Animated.View style={[styles.logoContainer, crownAnimatedStyle]}>
        <Text style={styles.crownLogo}>👑</Text>
        <Text style={styles.appName}>Eat Fit</Text>
      </Animated.View>

      {/* Animated Title */}
      <Animated.View style={[styles.titleContainer, titleAnimatedStyle]}>
        <Text style={styles.subtitle}>
          Soit la meilleure version de toi jour après jour !
        </Text>
      </Animated.View>

      {/* Buttons */}
      {showButtons && (
        <Animated.View style={[styles.buttonsContainer, buttonsAnimatedStyle]}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.primaryButtonText}>Se connecter</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => router.push('/auth/register')}
          >
            <Text style={styles.secondaryButtonText}>S'inscrire</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <Text style={styles.version}>Version 1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  crownLogo: {
    fontSize: 80,
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  titleContainer: {
    marginBottom: 80,
  },
  subtitle: {
    fontSize: 18,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonsContainer: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#F5A623',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#333333',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
  },
  version: {
    position: 'absolute',
    bottom: 40,
    color: '#666666',
    fontSize: 14,
  },
});
