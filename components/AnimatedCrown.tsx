
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
} from 'react-native-reanimated';

export default function AnimatedCrown() {
  // Valeurs animées pour chaque étape
  const step1Opacity = useSharedValue(0);
  const step2Opacity = useSharedValue(0);
  const step3Opacity = useSharedValue(0);
  const step4Opacity = useSharedValue(0);
  const step5Opacity = useSharedValue(0);
  const step6Opacity = useSharedValue(0);
  const step7Opacity = useSharedValue(0);
  const step8Opacity = useSharedValue(0);
  const step9Opacity = useSharedValue(0);
  const step10Opacity = useSharedValue(0);
  const step11Opacity = useSharedValue(0);
  const step12Opacity = useSharedValue(0);

  useEffect(() => {
    // Animation séquentielle de la couronne (13 étapes sur 3 secondes)
    const stepDuration = 200; // 200ms par étape
    
    step1Opacity.value = withDelay(0, withTiming(1, { duration: stepDuration }));
    step2Opacity.value = withDelay(200, withTiming(1, { duration: stepDuration }));
    step3Opacity.value = withDelay(400, withTiming(1, { duration: stepDuration }));
    step4Opacity.value = withDelay(600, withTiming(1, { duration: stepDuration }));
    step5Opacity.value = withDelay(800, withTiming(1, { duration: stepDuration }));
    step6Opacity.value = withDelay(1000, withTiming(1, { duration: stepDuration }));
    step7Opacity.value = withDelay(1200, withTiming(1, { duration: stepDuration }));
    step8Opacity.value = withDelay(1400, withTiming(1, { duration: stepDuration }));
    step9Opacity.value = withDelay(1600, withTiming(1, { duration: stepDuration }));
    step10Opacity.value = withDelay(1800, withTiming(1, { duration: stepDuration }));
    step11Opacity.value = withDelay(2000, withTiming(1, { duration: stepDuration }));
    step12Opacity.value = withDelay(2200, withTiming(1, { duration: stepDuration }));
  }, []);

  // Styles animés pour chaque étape
  const step1Style = useAnimatedStyle(() => ({
    opacity: step1Opacity.value,
  }));

  const step2Style = useAnimatedStyle(() => ({
    opacity: step2Opacity.value,
  }));

  const step3Style = useAnimatedStyle(() => ({
    opacity: step3Opacity.value,
  }));

  const step4Style = useAnimatedStyle(() => ({
    opacity: step4Opacity.value,
  }));

  const step5Style = useAnimatedStyle(() => ({
    opacity: step5Opacity.value,
  }));

  const step6Style = useAnimatedStyle(() => ({
    opacity: step6Opacity.value,
  }));

  const step7Style = useAnimatedStyle(() => ({
    opacity: step7Opacity.value,
  }));

  const step8Style = useAnimatedStyle(() => ({
    opacity: step8Opacity.value,
  }));

  const step9Style = useAnimatedStyle(() => ({
    opacity: step9Opacity.value,
  }));

  const step10Style = useAnimatedStyle(() => ({
    opacity: step10Opacity.value,
  }));

  const step11Style = useAnimatedStyle(() => ({
    opacity: step11Opacity.value,
  }));

  const step12Style = useAnimatedStyle(() => ({
    opacity: step12Opacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Étape 1: Premier trait bas gauche */}
      <Animated.View style={[styles.line1, step1Style]} />
      
      {/* Étape 2: Ligne horizontale du haut */}
      <Animated.View style={[styles.line2, step2Style]} />
      
      {/* Étape 3: Trait diagonal gauche */}
      <Animated.View style={[styles.line3, step3Style]} />
      
      {/* Étape 4: Continuation ligne du haut droite */}
      <Animated.View style={[styles.line4, step4Style]} />
      
      {/* Étape 5: Ligne centrale */}
      <Animated.View style={[styles.line5, step5Style]} />
      
      {/* Étape 6: Ligne diagonale centre */}
      <Animated.View style={[styles.line6, step6Style]} />
      
      {/* Étape 7: Ligne droite verticale */}
      <Animated.View style={[styles.line7, step7Style]} />
      
      {/* Étape 8: Lignes supplémentaires */}
      <Animated.View style={[styles.line8, step8Style]} />
      <Animated.View style={[styles.line8b, step8Style]} />
      
      {/* Étape 9: Base de la couronne */}
      <Animated.View style={[styles.line9, step9Style]} />
      
      {/* Étape 10: Détail central */}
      <Animated.View style={[styles.line10, step10Style]} />
      
      {/* Étape 11: Ligne finale droite */}
      <Animated.View style={[styles.line11, step11Style]} />
      
      {/* Étape 12: Détail final */}
      <Animated.View style={[styles.line12, step12Style]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 150,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  
  // Étape 1: Premier trait bas gauche
  line1: {
    position: 'absolute',
    width: 32,
    height: 1,
    backgroundColor: '#FFFFFF',
    left: 15,
    bottom: 35,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  
  // Étape 2: Ligne horizontale du haut
  line2: {
    position: 'absolute',
    width: 82,
    height: 1,
    backgroundColor: '#FFFFFF',
    left: 35,
    top: 15,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  
  // Étape 3: Trait diagonal gauche - simulé avec rotation
  line3: {
    position: 'absolute',
    width: 32,
    height: 1,
    backgroundColor: '#FFFFFF',
    left: 90,
    top: 14,
    transform: [{ rotate: '25deg' }],
  },
  
  // Étape 4: Continuation ligne du haut droite
  line4: {
    position: 'absolute',
    width: 82,
    height: 1,
    backgroundColor: '#FFFFFF',
    right: -42,
    top: 14,
  },
  
  // Étape 5: Ligne centrale
  line5: {
    position: 'absolute',
    width: 66,
    height: 1,
    backgroundColor: '#FFFFFF',
    left: 42,
    bottom: 35,
  },
  
  // Étape 6: Ligne diagonale centre
  line6: {
    position: 'absolute',
    width: 66,
    height: 1,
    backgroundColor: '#FFFFFF',
    left: 58,
    top: 5,
    transform: [{ rotate: '-25deg' }],
  },
  
  // Étape 7: Ligne droite verticale (simulée avec hauteur)
  line7: {
    position: 'absolute',
    width: 1,
    height: 30,
    backgroundColor: '#FFFFFF',
    right: 25,
    top: 25,
    transform: [{ rotate: '15deg' }],
  },
  
  // Étape 8: Lignes supplémentaires
  line8: {
    position: 'absolute',
    width: 73,
    height: 1,
    backgroundColor: '#FFFFFF',
    right: -23,
    bottom: 40,
  },
  
  line8b: {
    position: 'absolute',
    width: 1,
    height: 1,
    backgroundColor: '#FFFFFF',
    left: 27,
    bottom: 40,
  },
  
  // Étape 9: Base de la couronne
  line9: {
    position: 'absolute',
    width: 73,
    height: 1,
    backgroundColor: '#FFFFFF',
    left: 38,
    bottom: 45,
  },
  
  // Étape 10: Détail central
  line10: {
    position: 'absolute',
    width: 14,
    height: 1,
    backgroundColor: '#FFFFFF',
    left: 82,
    bottom: 40,
  },
  
  // Étape 11: Ligne finale droite
  line11: {
    position: 'absolute',
    width: 73,
    height: 1,
    backgroundColor: '#FFFFFF',
    right: -23,
    bottom: 52,
  },
  
  // Étape 12: Détail final
  line12: {
    position: 'absolute',
    width: 14,
    height: 1,
    backgroundColor: '#FFFFFF',
    left: 51,
    bottom: 50,
  },
});
