
import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export default function AnimatedCrown() {
  // Valeurs d'animation pour chaque ligne de la couronne
  const line1Opacity = useRef(new Animated.Value(0)).current;
  const line2Opacity = useRef(new Animated.Value(0)).current;
  const line3Opacity = useRef(new Animated.Value(0)).current;
  const line4Opacity = useRef(new Animated.Value(0)).current;
  const line5Opacity = useRef(new Animated.Value(0)).current;
  const line6Opacity = useRef(new Animated.Value(0)).current;
  const line7Opacity = useRef(new Animated.Value(0)).current;
  const line8Opacity = useRef(new Animated.Value(0)).current;
  const line9Opacity = useRef(new Animated.Value(0)).current;
  const line10Opacity = useRef(new Animated.Value(0)).current;
  const line11Opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateLines = () => {
      const animationDelay = 200; // Délai entre chaque ligne

      // Animation séquentielle de chaque ligne
      const animations = [
        line1Opacity,
        line2Opacity,
        line3Opacity,
        line4Opacity,
        line5Opacity,
        line6Opacity,
        line7Opacity,
        line8Opacity,
        line9Opacity,
        line10Opacity,
        line11Opacity,
      ];

      animations.forEach((animation, index) => {
        setTimeout(() => {
          Animated.timing(animation, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }, index * animationDelay);
      });
    };

    animateLines();
  }, []);

  return (
    <View style={{ width: 250, height: 200, alignItems: 'center', justifyContent: 'center' }}>
      {/* Ligne 1 - Étape 2 */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 85.55,
          height: 2,
          left: 82,
          top: 140,
          backgroundColor: 'white',
          transform: [{ rotate: '-95deg' }],
          opacity: line1Opacity,
          shadowColor: 'rgba(0, 0, 0, 0.25)',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 1,
          shadowRadius: 4,
        }}
      />

      {/* Ligne 2 - Étape 3 */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 220.27,
          height: 2,
          left: 73,
          top: 55,
          backgroundColor: 'white',
          transform: [{ rotate: '22deg' }],
          opacity: line2Opacity,
          shadowColor: 'rgba(0, 0, 0, 0.25)',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 1,
          shadowRadius: 4,
        }}
      />

      {/* Ligne 3 - Étape 4 */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 86.03,
          height: 2,
          left: 183,
          top: 55,
          backgroundColor: 'white',
          transform: [{ rotate: '95deg' }],
          opacity: line3Opacity,
        }}
      />

      {/* Ligne 4 - Étape 5 */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 220.17,
          height: 2,
          left: 184,
          top: 55,
          backgroundColor: 'white',
          transform: [{ rotate: '157deg' }],
          opacity: line4Opacity,
        }}
      />

      {/* Ligne 5 - Étape 6 */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 176.30,
          height: 2,
          left: 81,
          top: 140,
          backgroundColor: 'white',
          transform: [{ rotate: '-56deg' }],
          opacity: line5Opacity,
        }}
      />

      {/* Ligne 6 - Étape 7 */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 175.73,
          height: 2,
          left: 178,
          top: -6,
          backgroundColor: 'white',
          transform: [{ rotate: '56deg' }],
          opacity: line6Opacity,
        }}
      />

      {/* Ligne 7 - Étape 8 */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 195,
          height: 2,
          left: 176,
          top: 140,
          backgroundColor: 'white',
          transform: [{ rotate: '180deg' }],
          opacity: line7Opacity,
        }}
      />

      {/* Ligne 8 - Étape 8 (petite ligne verticale) */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 2,
          height: 2,
          left: 80,
          top: 140,
          backgroundColor: 'white',
          transform: [{ rotate: '90deg' }],
          opacity: line8Opacity,
        }}
      />

      {/* Ligne 9 - Étape 9 */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 195,
          height: 2,
          left: 81,
          top: 145,
          backgroundColor: 'white',
          opacity: line9Opacity,
        }}
      />

      {/* Ligne 10 - Étape 10 */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 36,
          height: 2,
          left: 176,
          top: 140,
          backgroundColor: 'white',
          transform: [{ rotate: '90deg' }],
          opacity: line10Opacity,
        }}
      />

      {/* Ligne 11 - Étape 11 */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 195,
          height: 2,
          left: 176,
          top: 174,
          backgroundColor: 'white',
          transform: [{ rotate: '180deg' }],
          opacity: line11Opacity,
        }}
      />

      {/* Ligne 12 - Étape 12 */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 36,
          height: 2,
          left: 81,
          top: 176,
          backgroundColor: 'white',
          transform: [{ rotate: '-90deg' }],
          opacity: line11Opacity,
        }}
      />
    </View>
  );
}
