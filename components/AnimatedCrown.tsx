import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function AnimatedCrown() {
  const lineAnimations = useRef([
    new Animated.Value(0), // Premier élément
    new Animated.Value(0), // Deuxième élément
  ]).current;

  useEffect(() => {
    const animateLines = () => {
      // Animer le premier élément
      Animated.timing(lineAnimations[0], {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();

      // Animer le deuxième élément avec un délai
      setTimeout(() => {
        Animated.timing(lineAnimations[1], {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }).start();
      }, 150);
    };

    animateLines();
  }, []);

  // Dimensions du container (393x852 adaptées à l'écran)
  const containerWidth = 393;
  const containerHeight = 852;

  // Adapter les dimensions à l'écran actuel
  const scaleX = screenWidth / containerWidth;
  const scaleY = screenHeight / containerHeight;
  const scale = Math.min(scaleX, scaleY);

  return (
    <View style={{ 
      width: containerWidth * scale, 
      height: containerHeight * scale, 
      backgroundColor: '#000000',
      alignItems: 'center', 
      justifyContent: 'center',
      alignSelf: 'center',
      overflow: 'hidden',
    }}>

      {/* Premier élément de la couronne - ligne diagonale */}
      <Animated.View
        style={{
          position: 'absolute',
          left: 99.05 * scale,
          top: 363.49 * scale,
          width: 85.55 * scale,
          height: 2,
          backgroundColor: 'white',
          transform: [
            { rotate: '-1.66rad' },
          ],
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 4, // Pour Android
          opacity: lineAnimations[0],
        }}
      />

      {/* Deuxième élément de la couronne - ligne horizontale longue */}
      <Animated.View
        style={{
          position: 'absolute',
          left: 90 * scale,
          top: 278.98 * scale,
          width: 220.27 * scale,
          height: 2,
          backgroundColor: 'white',
          transform: [
            { rotate: '0.39rad' },
          ],
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 4, // Pour Android
          opacity: lineAnimations[1],
        }}
      />

    </View>
  );
}