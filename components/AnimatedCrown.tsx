
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

  // Calculer les dimensions adaptatives pour iPhone avec padding pour éviter les débordements
  const containerWidth = Math.min(screenWidth * 0.8, 280);
  const containerHeight = containerWidth * 0.8;
  const scale = containerWidth / 393; // Basé sur la largeur de référence
  const padding = 20; // Padding pour éviter les débordements

  return (
    <View style={{ 
      width: containerWidth, 
      height: containerHeight, 
      alignItems: 'center', 
      justifyContent: 'center',
      alignSelf: 'center',
      overflow: 'hidden' // Éviter les débordements
    }}>
      {/* Ligne 1 - Côté gauche vertical */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 80 * scale,
          height: 2,
          left: (99.05 * scale) + padding,
          top: (320 * scale) + padding,
          backgroundColor: 'white',
          transform: [{ rotate: '-90deg' }],
          transformOrigin: 'center',
          opacity: line1Opacity,
          shadowColor: 'rgba(0, 0, 0, 0.25)',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 1,
          shadowRadius: 4,
          elevation: 5,
        }}
      />

      {/* Ligne 2 - Diagonale gauche montante */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 140 * scale,
          height: 2,
          left: (120 * scale) + padding,
          top: (250 * scale) + padding,
          backgroundColor: 'white',
          transform: [{ rotate: '35deg' }],
          transformOrigin: 'center',
          opacity: line2Opacity,
          shadowColor: 'rgba(0, 0, 0, 0.25)',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 1,
          shadowRadius: 4,
          elevation: 5,
        }}
      />

      {/* Ligne 3 - Côté droit vertical */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 80 * scale,
          height: 2,
          left: (280 * scale) + padding,
          top: (320 * scale) + padding,
          backgroundColor: 'white',
          transform: [{ rotate: '90deg' }],
          transformOrigin: 'center',
          opacity: line3Opacity,
        }}
      />

      {/* Ligne 4 - Diagonale droite montante */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 140 * scale,
          height: 2,
          left: (230 * scale) + padding,
          top: (250 * scale) + padding,
          backgroundColor: 'white',
          transform: [{ rotate: '-35deg' }],
          transformOrigin: 'center',
          opacity: line4Opacity,
        }}
      />

      {/* Ligne 5 - Diagonale gauche interne */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 120 * scale,
          height: 2,
          left: (140 * scale) + padding,
          top: (280 * scale) + padding,
          backgroundColor: 'white',
          transform: [{ rotate: '-45deg' }],
          transformOrigin: 'center',
          opacity: line5Opacity,
        }}
      />

      {/* Ligne 6 - Pic central */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 100 * scale,
          height: 2,
          left: (196 * scale) + padding,
          top: (200 * scale) + padding,
          backgroundColor: 'white',
          transform: [{ rotate: '90deg' }],
          transformOrigin: 'center',
          opacity: line6Opacity,
        }}
      />

      {/* Ligne 7 - Base droite horizontale */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 140 * scale,
          height: 2,
          left: (220 * scale) + padding,
          top: (350 * scale) + padding,
          backgroundColor: 'white',
          opacity: line7Opacity,
        }}
      />

      {/* Ligne 8 - Connexion base */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 2,
          height: 2,
          left: (140 * scale) + padding,
          top: (350 * scale) + padding,
          backgroundColor: 'white',
          opacity: line8Opacity,
        }}
      />

      {/* Ligne 9 - Base principale horizontale */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 140 * scale,
          height: 2,
          left: (140 * scale) + padding,
          top: (350 * scale) + padding,
          backgroundColor: 'white',
          opacity: line9Opacity,
        }}
      />

      {/* Ligne 10 - Côté droit base */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 30 * scale,
          height: 2,
          left: (280 * scale) + padding,
          top: (350 * scale) + padding,
          backgroundColor: 'white',
          transform: [{ rotate: '90deg' }],
          transformOrigin: 'center',
          opacity: line10Opacity,
        }}
      />

      {/* Ligne 11 - Base inférieure droite */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 140 * scale,
          height: 2,
          left: (220 * scale) + padding,
          top: (370 * scale) + padding,
          backgroundColor: 'white',
          transform: [{ rotate: '180deg' }],
          transformOrigin: 'center',
          opacity: line11Opacity,
        }}
      />

      {/* Ligne 12 - Côté gauche base */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 30 * scale,
          height: 2,
          left: (140 * scale) + padding,
          top: (370 * scale) + padding,
          backgroundColor: 'white',
          transform: [{ rotate: '-90deg' }],
          transformOrigin: 'center',
          opacity: line12Opacity,
        }}
      />
    </View>
  );
}
