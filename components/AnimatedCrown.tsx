
import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export default function AnimatedCrown() {
  // Valeurs d'animation pour chaque étape
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
  const line12Opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateLines = () => {
      const animationDelay = 150; // Délai entre chaque ligne

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
        line12Opacity,
      ];

      animations.forEach((animation, index) => {
        setTimeout(() => {
          Animated.timing(animation, {
            toValue: 1,
            duration: 250,
            useNativeDriver: false,
          }).start();
        }, index * animationDelay);
      });
    };

    animateLines();
  }, []);

  // Calculer les dimensions adaptatives pour iPhone
  const containerWidth = Math.min(screenWidth * 0.7, 250);
  const containerHeight = containerWidth * 1.1;
  const scale = containerWidth / 393; // Basé sur la largeur de référence

  return (
    <View style={{ 
      width: containerWidth, 
      height: containerHeight, 
      alignItems: 'center', 
      justifyContent: 'center',
      alignSelf: 'center'
    }}>
      {/* Ligne 1 - Étape 2 */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 80 * scale,
          height: 2,
          left: 99.05 * scale,
          top: 363.49 * scale,
          backgroundColor: 'white',
          transform: [{ rotate: '-95.06deg' }],
          transformOrigin: 'top left',
          opacity: line1Opacity,
          shadowColor: 'rgba(0, 0, 0, 0.25)',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 1,
          shadowRadius: 4,
          elevation: 5,
        }}
      />

      {/* Ligne 2 - Étape 3 */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 224 * scale,
          height: 2,
          left: 90 * scale,
          top: 278.98 * scale,
          backgroundColor: 'white',
          transform: [{ rotate: '22.36deg' }],
          transformOrigin: 'top left',
          opacity: line2Opacity,
          shadowColor: 'rgba(0, 0, 0, 0.25)',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 1,
          shadowRadius: 4,
          elevation: 5,
        }}
      />

      {/* Ligne 3 - Étape 4 */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 80 * scale,
          height: 2,
          left: 301.25 * scale,
          top: 278.27 * scale,
          backgroundColor: 'white',
          transform: [{ rotate: '94.83deg' }],
          transformOrigin: 'top left',
          opacity: line3Opacity,
        }}
      />

      {/* Ligne 4 - Étape 5 */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 224 * scale,
          height: 2,
          left: 302 * scale,
          top: 278.27 * scale,
          backgroundColor: 'white',
          transform: [{ rotate: '157.39deg' }],
          transformOrigin: 'top left',
          opacity: line4Opacity,
        }}
      />

      {/* Ligne 5 - Étape 6 */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 176 * scale,
          height: 2,
          left: 98.96 * scale,
          top: 363.44 * scale,
          backgroundColor: 'white',
          transform: [{ rotate: '-56.16deg' }],
          transformOrigin: 'top left',
          opacity: line5Opacity,
        }}
      />

      {/* Ligne 6 - Étape 7 */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 176 * scale,
          height: 2,
          left: 195.52 * scale,
          top: 217.06 * scale,
          backgroundColor: 'white',
          transform: [{ rotate: '56.20deg' }],
          transformOrigin: 'top left',
          opacity: line6Opacity,
        }}
      />

      {/* Ligne 7 - Étape 8 */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 192 * scale,
          height: 2,
          left: 294 * scale,
          top: 363 * scale,
          backgroundColor: 'white',
          transform: [{ rotate: '180deg' }],
          transformOrigin: 'top left',
          opacity: line7Opacity,
        }}
      />

      {/* Ligne 8 - Étape 8 */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 2 * scale,
          height: 2,
          left: 98 * scale,
          top: 363 * scale,
          backgroundColor: 'white',
          transform: [{ rotate: '90deg' }],
          transformOrigin: 'top left',
          opacity: line8Opacity,
        }}
      />

      {/* Ligne 9 - Étape 9 */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 192 * scale,
          height: 2,
          left: 99 * scale,
          top: 368 * scale,
          backgroundColor: 'white',
          opacity: line9Opacity,
        }}
      />

      {/* Ligne 10 - Étape 10 */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 36 * scale,
          height: 2,
          left: 294 * scale,
          top: 363 * scale,
          backgroundColor: 'white',
          transform: [{ rotate: '90deg' }],
          transformOrigin: 'top left',
          opacity: line10Opacity,
        }}
      />

      {/* Ligne 11 - Étape 11 */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 192 * scale,
          height: 2,
          left: 294 * scale,
          top: 397 * scale,
          backgroundColor: 'white',
          transform: [{ rotate: '180deg' }],
          transformOrigin: 'top left',
          opacity: line11Opacity,
        }}
      />

      {/* Ligne 12 - Étape 12 */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 36 * scale,
          height: 2,
          left: 99 * scale,
          top: 399 * scale,
          backgroundColor: 'white',
          transform: [{ rotate: '-90deg' }],
          transformOrigin: 'top left',
          opacity: line12Opacity,
        }}
      />
    </View>
  );
}
