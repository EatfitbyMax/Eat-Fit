
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
            useNativeDriver: false,
          }).start();
        }, index * animationDelay);
      });
    };

    animateLines();
  }, []);

  // Calculer les dimensions adaptatives pour iPhone
  const crownWidth = Math.min(screenWidth * 0.6, 200);
  const crownHeight = crownWidth * 0.8;
  const scale = crownWidth / 200;

  return (
    <View style={{ 
      width: crownWidth, 
      height: crownHeight, 
      alignItems: 'center', 
      justifyContent: 'center',
      alignSelf: 'center'
    }}>
      {/* Ligne 1 - Base verticale gauche */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 60 * scale,
          height: 3,
          left: 25 * scale,
          top: 80 * scale,
          backgroundColor: 'white',
          transform: [{ rotate: '-95deg' }],
          opacity: line1Opacity,
          shadowColor: 'rgba(255, 255, 255, 0.3)',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 4,
          elevation: 5,
        }}
      />

      {/* Ligne 2 - Base diagonale gauche */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 120 * scale,
          height: 3,
          left: 20 * scale,
          top: 45 * scale,
          backgroundColor: 'white',
          transform: [{ rotate: '22deg' }],
          opacity: line2Opacity,
          shadowColor: 'rgba(255, 255, 255, 0.3)',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 4,
          elevation: 5,
        }}
      />

      {/* Ligne 3 - Base verticale droite */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 60 * scale,
          height: 3,
          left: 115 * scale,
          top: 45 * scale,
          backgroundColor: 'white',
          transform: [{ rotate: '95deg' }],
          opacity: line3Opacity,
          shadowColor: 'rgba(255, 255, 255, 0.3)',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 4,
          elevation: 5,
        }}
      />

      {/* Ligne 4 - Base diagonale droite */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 120 * scale,
          height: 3,
          left: 115 * scale,
          top: 45 * scale,
          backgroundColor: 'white',
          transform: [{ rotate: '157deg' }],
          opacity: line4Opacity,
          shadowColor: 'rgba(255, 255, 255, 0.3)',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 4,
          elevation: 5,
        }}
      />

      {/* Ligne 5 - Pic gauche */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 100 * scale,
          height: 3,
          left: 25 * scale,
          top: 80 * scale,
          backgroundColor: 'white',
          transform: [{ rotate: '-56deg' }],
          opacity: line5Opacity,
          shadowColor: 'rgba(255, 255, 255, 0.3)',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 4,
          elevation: 5,
        }}
      />

      {/* Ligne 6 - Pic central */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 100 * scale,
          height: 3,
          left: 115 * scale,
          top: 10 * scale,
          backgroundColor: 'white',
          transform: [{ rotate: '56deg' }],
          opacity: line6Opacity,
          shadowColor: 'rgba(255, 255, 255, 0.3)',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 4,
          elevation: 5,
        }}
      />

      {/* Ligne 7 - Base horizontale droite */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 130 * scale,
          height: 3,
          left: 115 * scale,
          top: 80 * scale,
          backgroundColor: 'white',
          transform: [{ rotate: '180deg' }],
          opacity: line7Opacity,
          shadowColor: 'rgba(255, 255, 255, 0.3)',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 4,
          elevation: 5,
        }}
      />

      {/* Ligne 8 - Support gauche */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 25 * scale,
          height: 3,
          left: 25 * scale,
          top: 80 * scale,
          backgroundColor: 'white',
          transform: [{ rotate: '90deg' }],
          opacity: line8Opacity,
          shadowColor: 'rgba(255, 255, 255, 0.3)',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 4,
          elevation: 5,
        }}
      />

      {/* Ligne 9 - Base horizontale */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 130 * scale,
          height: 3,
          left: 25 * scale,
          top: 85 * scale,
          backgroundColor: 'white',
          opacity: line9Opacity,
          shadowColor: 'rgba(255, 255, 255, 0.3)',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 4,
          elevation: 5,
        }}
      />

      {/* Ligne 10 - Support droit */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 25 * scale,
          height: 3,
          left: 115 * scale,
          top: 80 * scale,
          backgroundColor: 'white',
          transform: [{ rotate: '90deg' }],
          opacity: line10Opacity,
          shadowColor: 'rgba(255, 255, 255, 0.3)',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 4,
          elevation: 5,
        }}
      />

      {/* Ligne 11 - Base inférieure */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 130 * scale,
          height: 3,
          left: 115 * scale,
          top: 105 * scale,
          backgroundColor: 'white',
          transform: [{ rotate: '180deg' }],
          opacity: line11Opacity,
          shadowColor: 'rgba(255, 255, 255, 0.3)',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 4,
          elevation: 5,
        }}
      />
    </View>
  );
}
