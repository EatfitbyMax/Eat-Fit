
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import AnimatedCrown from './AnimatedCrown';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const textAnimation = useRef(new Animated.Value(0)).current;
  const subtitleAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Séquence d'animation complète
    const startAnimation = () => {
      // La couronne s'anime automatiquement pendant 2.5s
      
      // Titre apparaît après 2.5s
      setTimeout(() => {
        Animated.timing(textAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      }, 2500);

      // Sous-titre apparaît après 3.3s
      setTimeout(() => {
        Animated.timing(subtitleAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      }, 3300);

      // Le parent gère maintenant la fin du splash screen
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
            styles.textContainer,
            {
              opacity: textAnimation,
              transform: [{
                translateY: textAnimation.interpolate({
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
              opacity: subtitleAnimation,
              transform: [{
                translateY: subtitleAnimation.interpolate({
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
  textContainer: {
    paddingHorizontal: 40,
    alignItems: 'center',
    marginBottom: 30,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 3,
  },
  byMax: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CCCCCC',
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 6,
    opacity: 0.8,
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
