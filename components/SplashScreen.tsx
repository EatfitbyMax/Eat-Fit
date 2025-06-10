
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
} from 'react-native-reanimated';
import AnimatedCrown from './AnimatedCrown';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const crownOpacity = useSharedValue(0);
  const crownScale = useSharedValue(0.8);
  const titleOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);

  useEffect(() => {
    const startAnimation = () => {
      // 1. Animation de la couronne
      crownOpacity.value = withTiming(1, { duration: 800 });
      crownScale.value = withSequence(
        withTiming(1.1, { duration: 800 }),
        withTiming(1, { duration: 200 })
      );
      
      // 2. Titre apparaît après l'animation de la couronne (3 secondes)
      titleOpacity.value = withDelay(3000, withTiming(1, { duration: 800 }));
      
      // 3. Sous-titre apparaît après le titre
      subtitleOpacity.value = withDelay(3800, withTiming(1, { duration: 800 }));
      
      // 4. Terminer le splash screen après toutes les animations
      setTimeout(() => {
        onFinish();
      }, 6000);
    };

    startAnimation();
  }, [onFinish]);

  const crownAnimatedStyle = useAnimatedStyle(() => ({
    opacity: crownOpacity.value,
    transform: [{ scale: crownScale.value }]
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

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Couronne animée */}
        <Animated.View style={[styles.crownContainer, crownAnimatedStyle]}>
          <AnimatedCrown />
        </Animated.View>
        
        {/* Titre principal */}
        <Animated.View style={[styles.titleContainer, titleAnimatedStyle]}>
          <Text style={styles.appTitle}>Eat Fit</Text>
          <Text style={styles.byMax}>BY MAX</Text>
        </Animated.View>

        {/* Sous-titre motivationnel */}
        <Animated.View style={[styles.subtitleContainer, subtitleAnimatedStyle]}>
          <Text style={styles.motto}>
            Soit la meilleure version de toi jour après jour !
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  crownContainer: {
    marginBottom: 60,
    alignItems: 'center',
    width: '100%',
  },
  titleContainer: {
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
  },
  appTitle: {
    fontSize: Math.min(width * 0.15, 60),
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'System',
    letterSpacing: 2,
  },
  byMax: {
    fontSize: Math.min(width * 0.04, 16),
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'System',
    letterSpacing: 4,
  },
  subtitleContainer: {
    paddingHorizontal: 30,
    alignItems: 'center',
    width: '100%',
  },
  motto: {
    fontSize: Math.min(width * 0.045, 18),
    fontWeight: '500',
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: Math.min(width * 0.065, 26),
    fontStyle: 'italic',
    opacity: 0.9,
  },
});
