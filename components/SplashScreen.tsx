
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import AnimatedCrown from './AnimatedCrown';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startAnimation = () => {
      // La couronne s'anime automatiquement pendant 2.5s (11 lignes × 200ms + animations)
      
      // Titre apparaît après l'animation de la couronne
      setTimeout(() => {
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      }, 2500);

      // Sous-titre apparaît après le titre
      setTimeout(() => {
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      }, 3300);

      // Terminer le splash screen après toutes les animations
      setTimeout(() => {
        onFinish();
      }, 5000);
    };

    startAnimation();
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Couronne animée */}
        <View style={styles.crownContainer}>
          <AnimatedCrown />
        </View>
        
        {/* Titre principal */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: titleOpacity,
              transform: [{
                translateY: titleOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            },
          ]}
        >
          <Text style={styles.appTitle}>Eat Fit</Text>
          <Text style={styles.byMax}>BY MAX</Text>
        </Animated.View>

        {/* Sous-titre motivationnel */}
        <Animated.View
          style={[
            styles.subtitleContainer,
            {
              opacity: subtitleOpacity,
              transform: [{
                translateY: subtitleOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            },
          ]}
        >
          <Text style={styles.motto}>
            Soit la meilleure version de toi jour après jour !
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  titleContainer: {
    paddingHorizontal: 40,
    alignItems: 'center',
    marginBottom: 30,
  },
  appTitle: {
    fontSize: 64,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  byMax: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'Inter',
  },
  subtitleContainer: {
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  motto: {
    fontSize: 18,
    fontWeight: '500',
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 26,
    fontStyle: 'italic',
    opacity: 0.9,
  },
});
