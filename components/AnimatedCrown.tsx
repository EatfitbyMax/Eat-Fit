
import React from 'react';
import { View } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
} from 'react-native-reanimated';

const AnimatedLine = Animated.createAnimatedComponent(Line);

const CrownLines = [
  // Base gauche -> Pic gauche
  { x1: 10, y1: 80, x2: 30, y2: 30 },
  { x1: 30, y1: 30, x2: 50, y2: 10 },
  { x1: 50, y1: 10, x2: 70, y2: 30 },
  { x1: 70, y1: 30, x2: 90, y2: 80 },
  { x1: 90, y1: 80, x2: 10, y2: 80 },
  // Lignes internes croisées
  { x1: 10, y1: 80, x2: 50, y2: 45 },
  { x1: 50, y1: 45, x2: 90, y2: 80 },
  { x1: 30, y1: 30, x2: 70, y2: 30 },
];

export default function AnimatedCrown() {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withTiming(1, { duration: 2500 });
  }, []);

  return (
    <View>
      <Svg width="200" height="200" viewBox="0 0 100 100">
        {CrownLines.map((line, index) => {
          const animatedProps = useAnimatedProps(() => {
            const p = progress.value;
            const interpolate = (a, b) => a + (b - a) * p;

            return {
              x1: interpolate(line.x1, line.x1),
              y1: interpolate(line.y1, line.y1),
              x2: interpolate(line.x1, line.x2),
              y2: interpolate(line.y1, line.y2),
            };
          });

          return (
            <AnimatedLine
              key={index}
              animatedProps={animatedProps}
              stroke="white"
              strokeWidth="2"
            />
          );
        })}
      </Svg>
    </View>
  );
}
