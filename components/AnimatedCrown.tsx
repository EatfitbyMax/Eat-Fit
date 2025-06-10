import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function AnimatedCrown() {
  const lineAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateLine = () => {
      Animated.timing(lineAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    };

    animateLine();
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
          opacity: lineAnimation,
        }}
      />

    </View>
  );
}