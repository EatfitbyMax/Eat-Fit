
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
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

  // Reproduction exacte de votre logo EatFit
  const paths = [
    // 1. Base rectangulaire (la barre du bas)
    {
      d: "M20 90 L180 90 L180 100 L20 100 Z",
      length: 340,
      delay: 0
    },
    
    // 2. Triangle gauche (contour)
    {
      d: "M50 30 L20 90 L80 90 Z",
      length: 180,
      delay: 300
    },
    
    // 3. Triangle central (le plus haut)
    {
      d: "M100 10 L70 90 L130 90 Z", 
      length: 200,
      delay: 600
    },
    
    // 4. Triangle droit (contour)
    {
      d: "M150 30 L120 90 L180 90 Z",
      length: 180,
      delay: 900
    },
    
    // 5. Ligne de croisement gauche (du sommet gauche vers le centre)
    {
      d: "M50 30 L130 90",
      length: 110,
      delay: 1200
    },
    
    // 6. Ligne de croisement droite (du sommet droit vers le centre)  
    {
      d: "M150 30 L70 90",
      length: 110,
      delay: 1500
    },
    
    // 7. Ligne de croisement central gauche (du sommet central vers la gauche)
    {
      d: "M100 10 L20 90",
      length: 130,
      delay: 1800
    },
    
    // 8. Ligne de croisement central droite (du sommet central vers la droite)
    {
      d: "M100 10 L180 90",
      length: 130,
      delay: 2100
    }
  ];

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width="120" height="80" viewBox="0 0 200 120">
        {paths.map((path, index) => {
          const animatedProps = useAnimatedProps(() => {
            // Calculer le progrès pour chaque ligne avec son délai
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
              strokeWidth="2"
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
