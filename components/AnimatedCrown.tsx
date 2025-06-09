import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function AnimatedCrown() {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { 
      duration: 3000,
      easing: Easing.out(Easing.cubic)
    });
  }, []);

  // Chemin unique qui dessine toute la couronne d'un seul trait
  const crownPath = "M20 100 L20 90 L50 30 L100 10 L150 30 L180 90 L180 100 M20 90 L80 90 M70 90 L130 90 M120 90 L180 90 M50 30 L130 90 M150 30 L70 90 M100 10 L20 90 M100 10 L180 90";

  // Calculer la longueur approximative du chemin
  const pathLength = 1200;

  const animatedProps = useAnimatedProps(() => {
    return {
      strokeDasharray: pathLength,
      strokeDashoffset: pathLength * (1 - progress.value),
    };
  });

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width="120" height="80" viewBox="0 0 200 120">
        <AnimatedPath
          d={crownPath}
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          animatedProps={animatedProps}
        />
      </Svg>
    </View>
  );
}