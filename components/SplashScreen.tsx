import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import AnimatedCrown from './AnimatedCrown';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreenComponent({ onFinish }: SplashScreenProps) {
  const [animationComplete, setAnimationComplete] = useState(false);

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    // Animation d'entrée
    opacity.value = withTiming(1, {
      duration: 1000,
      easing: Easing.out(Easing.quad),
    });

    scale.value = withSequence(
      withTiming(1.2, {
        duration: 800,
        easing: Easing.out(Easing.back(1.7)),
      }),
      withTiming(1, {
        duration: 300,
        easing: Easing.inOut(Easing.quad),
      })
    );

    // Terminer l'animation après 2.5 secondes
    const timer = setTimeout(() => {
      setAnimationComplete(true);
      onFinish();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a1a', '#000000']}
        style={styles.gradient}
      >
        <Animated.View style={[styles.logoContainer, animatedStyle]}>
          <AnimatedCrown size={120} />
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SplashScreenComponent;