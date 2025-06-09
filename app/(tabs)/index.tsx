
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
import AnimatedCrown from '@/components/AnimatedCrown';

const { width, height } = Dimensions.get('window');

export default function LaunchScreen() {
  const router = useRouter();
  const [showButtons, setShowButtons] = useState(false);
  
  // Animation values
  const crownOpacity = useSharedValue(0);
  const crownScale = useSharedValue(0.8);
  const titleOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const buttonsOpacity = useSharedValue(0);

  useEffect(() => {
    // Séquence complète d'animation
    const startAnimation = () => {
      // 1. Animation de la couronne (elle s'anime déjà internement)
      crownOpacity.value = withTiming(1, { duration: 800 });
      crownScale.value = withSequence(
        withTiming(1.1, { duration: 800 }),
        withTiming(1, { duration: 200 })
      );
      
      // 2. Titre apparaît après l'animation de la couronne
      titleOpacity.value = withDelay(2000, withTiming(1, { duration: 800 }));
      
      // 3. Sous-titre apparaît
      subtitleOpacity.value = withDelay(2800, withTiming(1, { duration: 800 }));
      
      // 4. Boutons apparaissent après 4 secondes
      setTimeout(() => {
        setShowButtons(true);
        buttonsOpacity.value = withTiming(1, { duration: 600 });
      }, 4000);
    };

    startAnimation();
  }, []);

  const crownAnimatedStyle = useAnimatedStyle(() => ({
    opacity: crownOpacity.value,
    transform: [{ scale: crownScale.value }],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{
      translateY: titleOpacity.value === 0 ? 20 : 0
    }],
  }));

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{
      translateY: subtitleOpacity.value === 0 ? 20 : 0
    }],
  }));

  const buttonsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{
      translateY: buttonsOpacity.value === 0 ? 30 : 0
    }],
  }));

  return (
    <View style={styles.container}>
      {/* Couronne animée */}
      <Animated.View style={[styles.logoContainer, crownAnimatedStyle]}>
        <AnimatedCrown />
      </Animated.View>

      {/* Titre principal */}
      <Animated.View style={[styles.titleContainer, titleAnimatedStyle]}>
        <Text style={styles.appName}>Eat Fit</Text>
        <Text style={styles.byMax}>BY MAX</Text>
      </Animated.View>

      {/* Sous-titre motivationnel */}
      <Animated.View style={[styles.subtitleContainer, subtitleAnimatedStyle]}>
        <Text style={styles.subtitle}>
          Soit la meilleure version de toi jour après jour !
        </Text>
      </Animated.View>

      {/* Boutons d'action */}
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
    marginBottom: 40,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 3,
    textAlign: 'center',
  },
  byMax: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CCCCCC',
    letterSpacing: 6,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.8,
  },
  subtitleContainer: {
    marginBottom: 60,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 26,
    fontStyle: 'italic',
    opacity: 0.9,
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
    shadowColor: '#F5A623',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
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
    fontSize: 12,
    letterSpacing: 1,
  },
});
