
import React from 'react';
import { View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

export default function AnimatedCrown() {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withTiming(1, { duration: 2000 });
  }, []);

  // Base rectangulaire de la couronne
  const baseAnimatedProps = useAnimatedProps(() => ({
    strokeDasharray: progress.value * 200,
    strokeDashoffset: (1 - progress.value) * 200,
  }));

  // Lignes principales de la couronne
  const lines = [
    // Triangle central (pic du milieu)
    { x1: 50, y1: 20, x2: 35, y2: 50, delay: 200 },
    { x1: 50, y1: 20, x2: 65, y2: 50, delay: 300 },
    
    // Triangle gauche
    { x1: 35, y1: 50, x2: 20, y2: 35, delay: 400 },
    { x1: 20, y1: 35, x2: 10, y2: 50, delay: 500 },
    { x1: 10, y1: 50, x2: 35, y2: 50, delay: 600 },
    
    // Triangle droit
    { x1: 65, y1: 50, x2: 80, y2: 35, delay: 700 },
    { x1: 80, y1: 35, x2: 90, y2: 50, delay: 800 },
    { x1: 90, y1: 50, x2: 65, y2: 50, delay: 900 },
    
    // Lignes croisées internes
    { x1: 35, y1: 50, x2: 65, y2: 50, delay: 1000 },
    { x1: 20, y1: 35, x2: 50, y2: 40, delay: 1100 },
    { x1: 50, y1: 40, x2: 80, y2: 35, delay: 1200 },
    { x1: 10, y1: 50, x2: 50, y2: 40, delay: 1300 },
    { x1: 50, y1: 40, x2: 90, y2: 50, delay: 1400 },
  ];

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width="120" height="80" viewBox="0 0 100 70">
        {/* Base rectangulaire */}
        <AnimatedRect
          x="10"
          y="50"
          width="80"
          height="8"
          fill="none"
          stroke="white"
          strokeWidth="2"
          animatedProps={baseAnimatedProps}
        />
        
        {/* Lignes de la couronne avec animation séquentielle */}
        {lines.map((line, index) => {
          const lineAnimatedProps = useAnimatedProps(() => {
            const delayedProgress = Math.max(0, Math.min(1, (progress.value * 2000 - line.delay) / 300));
            return {
              strokeDasharray: delayedProgress * 100,
              strokeDashoffset: (1 - delayedProgress) * 100,
            };
          });

          return (
            <AnimatedLine
              key={index}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              animatedProps={lineAnimatedProps}
            />
          );
        })}
      </Svg>
    </View>
  );
}
