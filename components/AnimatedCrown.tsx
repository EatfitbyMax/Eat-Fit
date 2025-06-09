
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function AnimatedCrown() {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSequence(
      withTiming(0, { duration: 300 }),
      withTiming(1, { 
        duration: 2200,
        easing: Easing.out(Easing.cubic)
      })
    );
  }, []);

  // Chemins SVG pour reproduire exactement votre logo EatFit
  const paths = [
    // Base rectangulaire de la couronne
    {
      d: "M30 85 L170 85 L170 95 L30 95 Z",
      length: 300,
      delay: 0
    },
    
    // Triangle central (pic du milieu) - le plus grand
    {
      d: "M100 20 L80 75 L120 75 Z",
      length: 180,
      delay: 300
    },
    
    // Triangle gauche
    {
      d: "M60 40 L45 75 L75 75 Z", 
      length: 140,
      delay: 600
    },
    
    // Triangle droit
    {
      d: "M140 40 L125 75 L155 75 Z",
      length: 140,
      delay: 900
    },
    
    // Lignes de croisement internes - première diagonale
    {
      d: "M45 75 L120 75",
      length: 75,
      delay: 1200
    },
    
    // Lignes de croisement internes - deuxième diagonale
    {
      d: "M80 75 L155 75",
      length: 75,
      delay: 1400
    },
    
    // Croisement central gauche
    {
      d: "M60 40 L100 60",
      length: 50,
      delay: 1600
    },
    
    // Croisement central droit
    {
      d: "M140 40 L100 60",
      length: 50,
      delay: 1800
    },
    
    // Dernière ligne de finition - croisement vertical
    {
      d: "M100 20 L100 75",
      length: 55,
      delay: 2000
    }
  ];

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width="120" height="80" viewBox="0 0 200 120">
        {paths.map((path, index) => {
          const animatedProps = useAnimatedProps(() => {
            const adjustedProgress = Math.max(0, Math.min(1, 
              (progress.value * 2200 - path.delay) / 400
            ));
            
            return {
              strokeDasharray: path.length,
              strokeDashoffset: path.length * (1 - adjustedProgress),
            };
          });

          return (
            <AnimatedPath
              key={index}
              d={path.d}
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              animatedProps={animatedProps}
            />
          );
        })}
      </Svg>
    </View>
  );
}
