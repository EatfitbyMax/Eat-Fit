
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
      duration: 2500,
      easing: Easing.out(Easing.cubic)
    });
  }, []);

  // Reproduction exacte de votre logo : couronne géométrique en forme de diamant
  // Tracé continu qui dessine toute la couronne d'un seul trait
  const crownPath = `
    M 40 80 
    L 40 70 
    L 60 40 
    L 80 20 
    L 100 10 
    L 120 20 
    L 140 40 
    L 160 70 
    L 160 80 
    M 40 70 
    L 80 50 
    L 120 20 
    M 60 40 
    L 100 60 
    L 140 40 
    M 80 20 
    L 80 50 
    L 100 60 
    L 120 50 
    L 120 20 
    M 80 50 
    L 60 70 
    M 120 50 
    L 140 70 
    M 100 60 
    L 100 80
  `;

  // Longueur approximative du chemin pour l'animation
  const pathLength = 800;

  const animatedProps = useAnimatedProps(() => {
    return {
      strokeDasharray: pathLength,
      strokeDashoffset: pathLength * (1 - progress.value),
    };
  });

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width="120" height="70" viewBox="0 0 200 90">
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
