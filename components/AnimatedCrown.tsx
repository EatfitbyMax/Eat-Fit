
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
      const animationDelay = 180; // Délai légèrement augmenté pour un effet plus fluide

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
            duration: 300,
            useNativeDriver: false,
          }).start();
        }, index * animationDelay);
      });
    };

    animateLines();
  }, []);

  // Calculer les dimensions adaptatives pour iPhone avec meilleure précision
  const containerWidth = Math.min(screenWidth * 0.65, 240);
  const containerHeight = containerWidth * 1.0;
  const scale = containerWidth / 393;

  return (
    <View style={{ 
      width: containerWidth, 
      height: containerHeight, 
      alignItems: 'center', 
      justifyContent: 'center',
      alignSelf: 'center'
    }}>
      {/* Ligne 1 - Côté gauche */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 88 * scale,
          height: 2,
          left: 98 * scale,
          top: 368 * scale,
          backgroundColor: 'white',
          transform: [{ rotate: '-95deg' }],
          transformOrigin: 'top left',
          opacity: line1Opacity,
          shadowColor: 'rgba(0, 0, 0, 0.3)',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 3,
          elevation: 4,
        }}
      />

      {/* Ligne 2 - Ligne diagonale gauche vers haut */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 218 * scale,
          height: 2,
          left: 91 * scale,
          top: 278 * scale,
          backgroundColor: 'white',
          transform: [{ rotate: '21.5deg' }],
          transformOrigin: 'top left',
          opacity: line2Opacity,
          shadowColor: 'rgba(0, 0, 0, 0.3)',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 3,
          elevation: 4,
        }}
      />

      {/* Ligne 3 - Côté droit */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 88 * scale,
          height: 2,
          left: 302 * scale,
          top: 276 * scale,
          backgroundColor: 'white',
          transform: [{ rotate: '95deg' }],
          transformOrigin: 'top left',
          opacity: line3Opacity,
        }}
      />

      {/* Ligne 4 - Ligne diagonale droite vers haut */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 220 * scale,
          height: 2,
          left: 302 * scale,
          top: 278 * scale,
          backgroundColor: 'white',
          transform: [{ rotate: '157.5deg' }],
          transformOrigin: 'top left',
          opacity: line4Opacity,
        }}
      />

      {/* Ligne 5 - Diagonale intérieure gauche */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 175 * scale,
          height: 2,
          left: 98 * scale,
          top: 362 * scale,
          backgroundColor: 'white',
          transform: [{ rotate: '-56deg' }],
          transformOrigin: 'top left',
          opacity: line5Opacity,
        }}
      />

      {/* Ligne 6 - Diagonale intérieure droite */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 174 * scale,
          height: 2,
          left: 197.8 * scale,
          top: 215 * scale,
          backgroundColor: 'white',
          transform: [{ rotate: '56deg' }],
          transformOrigin: 'top left',
          opacity: line6Opacity,
        }}
      />

      {/* Ligne 7 - Base supérieure */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 194 * scale,
          height: 2,
          left: 295 * scale,
          top: 362 * scale,
          backgroundColor: 'white',
          transform: [{ rotate: '180deg' }],
          transformOrigin: 'top left',
          opacity: line7Opacity,
        }}
      />

      {/* Ligne 8 - Côté gauche vertical court */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 1 * scale,
          height: 2,
          left: 102 * scale,
          top: 362 * scale,
          backgroundColor: 'white',
          transform: [{ rotate: '90deg' }],
          transformOrigin: 'top left',
          opacity: line8Opacity,
        }}
      />

      {/* Ligne 9 - Base principale */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 194 * scale,
          height: 2,
          left: 98 * scale,
          top: 367 * scale,
          backgroundColor: 'white',
          opacity: line9Opacity,
        }}
      />

      {/* Ligne 10 - Côté droit vertical */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 38 * scale,
          height: 2,
          left: 295 * scale,
          top: 362 * scale,
          backgroundColor: 'white',
          transform: [{ rotate: '90deg' }],
          transformOrigin: 'top left',
          opacity: line10Opacity,
        }}
      />

      {/* Ligne 11 - Base inférieure */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 194 * scale,
          height: 2,
          left: 295 * scale,
          top: 400 * scale,
          backgroundColor: 'white',
          transform: [{ rotate: '180deg' }],
          transformOrigin: 'top left',
          opacity: line11Opacity,
        }}
      />

      {/* Ligne 12 - Côté gauche vertical bas */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 38 * scale,
          height: 2,
          left: 98 * scale,
          top: 400 * scale,
          backgroundColor: 'white',
          transform: [{ rotate: '-90deg' }],
          transformOrigin: 'top left',
          opacity: line12Opacity,
        }}
      />
    </View>
  );
}
