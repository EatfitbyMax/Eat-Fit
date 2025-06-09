
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function AnimatedCrown() {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSequence(
      withTiming(0, { duration: 500 }),
      withTiming(1, { 
        duration: 2500,
        easing: Easing.out(Easing.cubic)
      })
    );
  }, []);

  // Chemins SVG pour reproduire votre couronne
  const paths = [
    // Base rectangulaire
    {
      d: "M20 85 L180 85 L180 95 L20 95 Z",
      length: 320,
      delay: 0
    },
    // Triangle central (pic du milieu)
    {
      d: "M100 25 L85 75 L115 75 Z",
      length: 150,
      delay: 200
    },
    // Triangle gauche
    {
      d: "M50 45 L35 75 L65 75 Z",
      length: 120,
      delay: 400
    },
    // Triangle droit
    {
      d: "M150 45 L135 75 L165 75 Z",
      length: 120,
      delay: 600
    },
    // Lignes de croisement internes - gauche vers centre
    {
      d: "M35 75 L100 60",
      length: 80,
      delay: 800
    },
    // Lignes de croisement internes - centre vers droite
    {
      d: "M100 60 L165 75",
      length: 80,
      delay: 900
    },
    // Lignes de croisement internes - droite vers centre
    {
      d: "M165 75 L100 60",
      length: 80,
      delay: 1000
    },
    // Lignes de croisement internes - centre vers gauche
    {
      d: "M100 60 L35 75",
      length: 80,
      delay: 1100
    },
    // Ligne horizontale connectant les bases
    {
      d: "M35 75 L165 75",
      length: 130,
      delay: 1200
    }
  ];

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width="120" height="80" viewBox="0 0 200 120">
        {paths.map((path, index) => {
          const animatedProps = useAnimatedProps(() => {
            const adjustedProgress = Math.max(0, Math.min(1, 
              (progress.value * 2500 - path.delay) / 500
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
              strokeWidth="3"
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
