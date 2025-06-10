import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function AnimatedCrown() {
  const lineAnimations = useRef([
    new Animated.Value(0), // Premier élément
    new Animated.Value(0), // Deuxième élément
    new Animated.Value(0), // Troisième élément
    new Animated.Value(0), // Quatrième élément
    new Animated.Value(0), // Cinquième élément
    new Animated.Value(0), // Sixième élément
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

      // Animer le troisième élément avec un délai
      setTimeout(() => {
        Animated.timing(lineAnimations[2], {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }).start();
      }, 300);

      // Animer le quatrième élément avec un délai
      setTimeout(() => {
        Animated.timing(lineAnimations[3], {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }).start();
      }, 450);

      // Animer le cinquième élément avec un délai
      setTimeout(() => {
        Animated.timing(lineAnimations[4], {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }).start();
      }, 600);

      // Animer le sixième élément avec un délai
      setTimeout(() => {
        Animated.timing(lineAnimations[5], {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }).start();
      }, 750);
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

      {/* Troisième élément de la couronne - ligne diagonale droite */}
      <Animated.View
        style={{
          position: 'absolute',
          left: 301.25 * scale,
          top: 278.27 * scale,
          width: 86.03 * scale,
          height: 2,
          backgroundColor: 'white',
          transform: [
            { rotate: '1.66rad' },
          ],
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 4, // Pour Android
          opacity: lineAnimations[2],
        }}
      />

      {/* Quatrième élément de la couronne - ligne diagonale longue */}
      <Animated.View
        style={{
          position: 'absolute',
          left: 302 * scale,
          top: 278.27 * scale,
          width: 220.17 * scale,
          height: 2,
          backgroundColor: 'white',
          transform: [
            { rotate: '2.75rad' },
          ],
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 4, // Pour Android
          opacity: lineAnimations[3],
        }}
      />

      {/* Cinquième élément de la couronne - ligne diagonale centrale */}
      <Animated.View
        style={{
          position: 'absolute',
          left: 98.96 * scale,
          top: 363.44 * scale,
          width: 176.30 * scale,
          height: 2,
          backgroundColor: 'white',
          transform: [
            { rotate: '-0.98rad' },
          ],
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 4, // Pour Android
          opacity: lineAnimations[4],
        }}
      />

      {/* Sixième élément de la couronne - ligne diagonale en haut à droite */}
      <Animated.View
        style={{
          position: 'absolute',
          left: 195.52 * scale,
          top: 217.06 * scale,
          width: 175.73 * scale,
          height: 2,
          backgroundColor: 'white',
          transform: [
            { rotate: '0.98rad' },
          ],
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 4, // Pour Android
          opacity: lineAnimations[5],
        }}
      />

    </View>
  );
}