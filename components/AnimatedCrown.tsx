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

  useEffect(() => {
    const animateLines = () => {
      const animationDelay = 200;

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

  // Calculer les dimensions adaptatives
  const containerWidth = Math.min(screenWidth * 0.65, 240);
  const containerHeight = containerWidth * 0.7;
  const scale = containerWidth / 240;

  // Points clés de la couronne (coordonnées relatives)
  const baseWidth = 160 * scale;
  const baseHeight = 20 * scale;
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;

  // Points de base
  const baseY = centerY + 20 * scale;
  const baseLeft = centerX - baseWidth / 2;
  const baseRight = centerX + baseWidth / 2;

  // Points des pics
  const peakTop = centerY - 40 * scale;
  const peakLeft = centerX - 60 * scale;
  const peakRight = centerX + 60 * scale;

  return (
    <View style={{ 
      width: containerWidth, 
      height: containerHeight, 
      alignItems: 'center', 
      justifyContent: 'center',
      alignSelf: 'center'
    }}>

      {/* 1. Pic central (sommet) */}
      <Animated.View
        style={{
          position: 'absolute',
          width: Math.sqrt(Math.pow(60 * scale, 2) + Math.pow(60 * scale, 2)),
          height: 2,
          left: centerX,
          top: peakTop,
          backgroundColor: 'white',
          transformOrigin: 'left center',
          transform: [{ rotate: '45deg' }],
          opacity: line1Opacity,
        }}
      />

      {/* 2. Pic central (côté droit) */}
      <Animated.View
        style={{
          position: 'absolute',
          width: Math.sqrt(Math.pow(60 * scale, 2) + Math.pow(60 * scale, 2)),
          height: 2,
          left: centerX,
          top: peakTop,
          backgroundColor: 'white',
          transformOrigin: 'left center',
          transform: [{ rotate: '135deg' }],
          opacity: line2Opacity,
        }}
      />

      {/* 3. Côté gauche du pic gauche */}
      <Animated.View
        style={{
          position: 'absolute',
          width: Math.sqrt(Math.pow(60 * scale, 2) + Math.pow(40 * scale, 2)),
          height: 2,
          left: peakLeft,
          top: centerY - 20 * scale,
          backgroundColor: 'white',
          transformOrigin: 'left center',
          transform: [{ rotate: '-33.7deg' }],
          opacity: line3Opacity,
        }}
      />

      {/* 4. Côté droit du pic droit */}
      <Animated.View
        style={{
          position: 'absolute',
          width: Math.sqrt(Math.pow(60 * scale, 2) + Math.pow(40 * scale, 2)),
          height: 2,
          left: peakRight,
          top: centerY - 20 * scale,
          backgroundColor: 'white',
          transformOrigin: 'left center',
          transform: [{ rotate: '146.3deg' }],
          opacity: line4Opacity,
        }}
      />

      {/* 5. Diagonale intérieure gauche */}
      <Animated.View
        style={{
          position: 'absolute',
          width: Math.sqrt(Math.pow(60 * scale, 2) + Math.pow(60 * scale, 2)),
          height: 2,
          left: baseLeft,
          top: baseY,
          backgroundColor: 'white',
          transformOrigin: 'left center',
          transform: [{ rotate: '-45deg' }],
          opacity: line5Opacity,
        }}
      />

      {/* 6. Diagonale intérieure droite */}
      <Animated.View
        style={{
          position: 'absolute',
          width: Math.sqrt(Math.pow(60 * scale, 2) + Math.pow(60 * scale, 2)),
          height: 2,
          left: centerX,
          top: centerY - 20 * scale,
          backgroundColor: 'white',
          transformOrigin: 'left center',
          transform: [{ rotate: '45deg' }],
          opacity: line6Opacity,
        }}
      />

      {/* 7. Base supérieure */}
      <Animated.View
        style={{
          position: 'absolute',
          width: baseWidth,
          height: 2,
          left: baseLeft,
          top: baseY,
          backgroundColor: 'white',
          opacity: line7Opacity,
        }}
      />

      {/* 8. Base principale */}
      <Animated.View
        style={{
          position: 'absolute',
          width: baseWidth,
          height: 2,
          left: baseLeft,
          top: baseY + baseHeight,
          backgroundColor: 'white',
          opacity: line8Opacity,
        }}
      />

      {/* 9. Côtés verticaux de la base */}
      <Animated.View
        style={{
          position: 'absolute',
          width: baseHeight,
          height: 2,
          left: baseLeft,
          top: baseY,
          backgroundColor: 'white',
          transformOrigin: 'left center',
          transform: [{ rotate: '90deg' }],
          opacity: line9Opacity,
        }}
      />

      <Animated.View
        style={{
          position: 'absolute',
          width: baseHeight,
          height: 2,
          left: baseRight,
          top: baseY,
          backgroundColor: 'white',
          transformOrigin: 'left center',
          transform: [{ rotate: '90deg' }],
          opacity: line9Opacity,
        }}
      />
    </View>
  );
}