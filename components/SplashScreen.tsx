
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const crownAnimation = useRef(new Animated.Value(0)).current;
  const textAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Animation de la couronne qui se dessine
    Animated.sequence([
      Animated.parallel([
        Animated.timing(crownAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(scaleAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(textAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Ne pas déclencher automatiquement onFinish ici
    // Le parent s'en charge maintenant
  }, []);

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.crownContainer,
            {
              transform: [{ scale: scaleAnimation }],
              opacity: crownAnimation,
            },
          ]}
        >
          <Text style={styles.crown}>👑</Text>
        </Animated.View>
        
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: textAnimation,
              transform: [
                {
                  translateY: textAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.appTitle}>Eat Fit</Text>
          <Text style={styles.byMax}>BY MAX</Text>
          <Text style={styles.motto}>
            Soit la meilleure version de toi jour après jour !
          </Text>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownContainer: {
    marginBottom: 40,
  },
  crown: {
    fontSize: 120,
    textAlign: 'center',
  },
  textContainer: {
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 5,
    letterSpacing: 2,
  },
  byMax: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 4,
    opacity: 0.8,
  },
  motto: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
    opacity: 0.9,
  },
});
