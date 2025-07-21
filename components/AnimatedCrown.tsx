import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Image } from 'expo-image';

interface AnimatedCrownProps {
  size?: number;
  color?: string;
}

export default function AnimatedCrown({ size = 80, color = '#FFD700' }: AnimatedCrownProps) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Animation d'apparition
    opacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.quad),
    });

    // Animation de rotation continue
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 8000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // Animation de pulsation
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, {
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(1, {
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
        })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.crownContainer, animatedStyle]}>
        <Image
          source={require('../assets/images/crown-logo.png')}
          style={[
            {
              width: size,
              height: size,
            },
            color && { tintColor: color }
          ]}
          contentFit="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  crownContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});