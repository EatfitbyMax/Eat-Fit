import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export default function AnimatedCrown() {
  // Valeurs d'animation pour chaque ligne
  const lineAnimations = useRef(
    Array.from({ length: 12 }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const animateLines = () => {
      const animationDelay = 150;

      lineAnimations.forEach((animation, index) => {
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
  const containerHeight = containerWidth * 0.8;

  return (
    <View style={{ 
      width: containerWidth, 
      height: containerHeight, 
      alignItems: 'center', 
      justifyContent: 'center',
      alignSelf: 'center'
    }}>
      {/* Base de la couronne */}
      <Animated.View
        style={{
          position: 'absolute',
          width: containerWidth * 0.8,
          height: 2,
          bottom: containerHeight * 0.1,
          backgroundColor: 'white',
          opacity: lineAnimations[0],
        }}
      />

      {/* Base supérieure */}
      <Animated.View
        style={{
          position: 'absolute',
          width: containerWidth * 0.8,
          height: 2,
          bottom: containerHeight * 0.25,
          backgroundColor: 'white',
          opacity: lineAnimations[1],
        }}
      />

      {/* Côté gauche */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 2,
          height: containerHeight * 0.15,
          left: containerWidth * 0.1,
          bottom: containerHeight * 0.1,
          backgroundColor: 'white',
          opacity: lineAnimations[2],
        }}
      />

      {/* Côté droit */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 2,
          height: containerHeight * 0.15,
          right: containerWidth * 0.1,
          bottom: containerHeight * 0.1,
          backgroundColor: 'white',
          opacity: lineAnimations[3],
        }}
      />

      {/* Pic central */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 2,
          height: containerHeight * 0.4,
          alignSelf: 'center',
          bottom: containerHeight * 0.25,
          backgroundColor: 'white',
          opacity: lineAnimations[4],
        }}
      />

      {/* Diagonale gauche vers pic central */}
      <Animated.View
        style={{
          position: 'absolute',
          width: containerWidth * 0.3,
          height: 2,
          left: containerWidth * 0.1,
          bottom: containerHeight * 0.25,
          backgroundColor: 'white',
          transform: [{ rotate: '45deg' }],
          transformOrigin: 'left center',
          opacity: lineAnimations[5],
        }}
      />

      {/* Diagonale droite vers pic central */}
      <Animated.View
        style={{
          position: 'absolute',
          width: containerWidth * 0.3,
          height: 2,
          right: containerWidth * 0.1,
          bottom: containerHeight * 0.25,
          backgroundColor: 'white',
          transform: [{ rotate: '-45deg' }],
          transformOrigin: 'right center',
          opacity: lineAnimations[6],
        }}
      />

      {/* Pic gauche */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 2,
          height: containerHeight * 0.25,
          left: containerWidth * 0.25,
          bottom: containerHeight * 0.25,
          backgroundColor: 'white',
          opacity: lineAnimations[7],
        }}
      />

      {/* Pic droit */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 2,
          height: containerHeight * 0.25,
          right: containerWidth * 0.25,
          bottom: containerHeight * 0.25,
          backgroundColor: 'white',
          opacity: lineAnimations[8],
        }}
      />

      {/* Diagonale intérieure gauche */}
      <Animated.View
        style={{
          position: 'absolute',
          width: containerWidth * 0.2,
          height: 2,
          left: containerWidth * 0.25,
          bottom: containerHeight * 0.35,
          backgroundColor: 'white',
          transform: [{ rotate: '30deg' }],
          transformOrigin: 'left center',
          opacity: lineAnimations[9],
        }}
      />

      {/* Diagonale intérieure droite */}
      <Animated.View
        style={{
          position: 'absolute',
          width: containerWidth * 0.2,
          height: 2,
          right: containerWidth * 0.25,
          bottom: containerHeight * 0.35,
          backgroundColor: 'white',
          transform: [{ rotate: '-30deg' }],
          transformOrigin: 'right center',
          opacity: lineAnimations[10],
        }}
      />

      {/* Connexion base vers pics latéraux */}
      <Animated.View
        style={{
          position: 'absolute',
          width: containerWidth * 0.15,
          height: 2,
          left: containerWidth * 0.1,
          bottom: containerHeight * 0.3,
          backgroundColor: 'white',
          transform: [{ rotate: '60deg' }],
          transformOrigin: 'left center',
          opacity: lineAnimations[11],
        }}
      />
    </View>
  );
}