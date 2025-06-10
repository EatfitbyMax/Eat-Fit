import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export default function AnimatedCrown() {
  // Valeurs d'animation pour chaque ligne
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

  // Dimensions adaptatives
  const crownWidth = Math.min(screenWidth * 0.4, 160);
  const crownHeight = crownWidth * 0.75;

  return (
    <View style={{ 
      width: crownWidth, 
      height: crownHeight, 
      alignItems: 'center', 
      justifyContent: 'center',
      alignSelf: 'center'
    }}>

      {/* Base horizontale (ligne du bas) */}
      <Animated.View
        style={{
          position: 'absolute',
          width: crownWidth,
          height: 2,
          left: 0,
          bottom: 0,
          backgroundColor: 'white',
          opacity: line1Opacity,
        }}
      />

      {/* Ligne horizontale du milieu */}
      <Animated.View
        style={{
          position: 'absolute',
          width: crownWidth,
          height: 2,
          left: 0,
          bottom: crownHeight * 0.2,
          backgroundColor: 'white',
          opacity: line2Opacity,
        }}
      />

      {/* Côté gauche vertical */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 2,
          height: crownHeight * 0.2,
          left: 0,
          bottom: 0,
          backgroundColor: 'white',
          opacity: line3Opacity,
        }}
      />

      {/* Côté droit vertical */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 2,
          height: crownHeight * 0.2,
          right: 0,
          bottom: 0,
          backgroundColor: 'white',
          opacity: line4Opacity,
        }}
      />

      {/* Pic central - côté gauche */}
      <Animated.View
        style={{
          position: 'absolute',
          width: crownWidth * 0.35,
          height: 2,
          left: crownWidth * 0.325,
          bottom: crownHeight * 0.2,
          backgroundColor: 'white',
          transformOrigin: 'left center',
          transform: [{ rotate: '70deg' }],
          opacity: line5Opacity,
        }}
      />

      {/* Pic central - côté droit */}
      <Animated.View
        style={{
          position: 'absolute',
          width: crownWidth * 0.35,
          height: 2,
          right: crownWidth * 0.325,
          bottom: crownHeight * 0.2,
          backgroundColor: 'white',
          transformOrigin: 'right center',
          transform: [{ rotate: '-70deg' }],
          opacity: line6Opacity,
        }}
      />

      {/* Pic gauche */}
      <Animated.View
        style={{
          position: 'absolute',
          width: crownWidth * 0.25,
          height: 2,
          left: 0,
          bottom: crownHeight * 0.2,
          backgroundColor: 'white',
          transformOrigin: 'left center',
          transform: [{ rotate: '45deg' }],
          opacity: line7Opacity,
        }}
      />

      {/* Pic droit */}
      <Animated.View
        style={{
          position: 'absolute',
          width: crownWidth * 0.25,
          height: 2,
          right: 0,
          bottom: crownHeight * 0.2,
          backgroundColor: 'white',
          transformOrigin: 'right center',
          transform: [{ rotate: '-45deg' }],
          opacity: line8Opacity,
        }}
      />

      {/* Lignes croisées intérieures */}
      <Animated.View
        style={{
          position: 'absolute',
          width: crownWidth * 0.6,
          height: 2,
          left: crownWidth * 0.2,
          bottom: crownHeight * 0.1,
          backgroundColor: 'white',
          transformOrigin: 'center',
          transform: [{ rotate: '20deg' }],
          opacity: line9Opacity,
        }}
      />

    </View>
  );
}