import { useState, useEffect, useCallback } from 'react';
import { PersistentStorage } from '../utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FormeData {
  sleep: {
    hours: number;
    quality: 'Excellent' | 'Bon' | 'Moyen' | 'Médiocre';
    bedTime: string;
    wakeTime: string;
  };
  stress: {
    level: number;
    factors: string[];
    notes: string;
  };
  heartRate: {
    resting: number;
    variability: number;
  };
  rpe: {
    value: number;
    notes: string;
    workoutId?: string;
  };
  date: string;
}

export const useFormeScore = (userId: string) => {
  const [formeScore, setFormeScore] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCalculated, setLastCalculated] = useState<string | null>(null);

  const calculateFormeScore = useCallback(async (forceRefresh: boolean = false) => {
    if (!userId) return;

    const today = new Date().toISOString().split('T')[0];

    // Éviter les calculs répétés
    if (!forceRefresh && lastCalculated === today) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Récupérer les données de forme pour aujourd'hui
      const formeData = await PersistentStorage.getFormeData(userId, today);

      if (!formeData) {
        console.log('Aucune donnée de forme trouvée pour aujourd\'hui');
        setFormeScore(0);
        setLastCalculated(today);
        return;
      }

      // Calcul du score de forme
      let score = 0;
      let totalFactors = 0;

      // Score du sommeil (0-25 points)
      if (formeData.sleep?.hours > 0) {
        const sleepHours = formeData.sleep.hours;
        let sleepScore = 0;

        if (sleepHours >= 7 && sleepHours <= 9) {
          sleepScore = 25;
        } else if (sleepHours >= 6 && sleepHours <= 10) {
          sleepScore = 20;
        } else if (sleepHours >= 5 && sleepHours <= 11) {
          sleepScore = 15;
        } else {
          sleepScore = 5;
        }

        // Ajustement selon la qualité
        const qualityMultiplier = {
          'Excellent': 1.0,
          'Bon': 0.8,
          'Moyen': 0.6,
          'Médiocre': 0.4
        };

        sleepScore *= qualityMultiplier[formeData.sleep.quality] || 0.6;
        score += sleepScore;
        totalFactors++;
      }

      // Score du stress (0-25 points, inversé)
      if (formeData.stress?.level !== undefined) {
        const stressLevel = formeData.stress.level;
        const stressScore = 25 - ((stressLevel - 1) * 5); // Échelle 1-6 inversée
        score += Math.max(0, stressScore);
        totalFactors++;
      }

      // Score de la fréquence cardiaque (0-25 points)
      if (formeData.heartRate?.resting > 0) {
        const restingHR = formeData.heartRate.resting;
        let hrScore = 0;

        if (restingHR >= 60 && restingHR <= 70) {
          hrScore = 25;
        } else if (restingHR >= 50 && restingHR <= 80) {
          hrScore = 20;
        } else if (restingHR >= 40 && restingHR <= 90) {
          hrScore = 15;
        } else {
          hrScore = 5;
        }

        score += hrScore;
        totalFactors++;
      }

      // Score RPE (0-25 points)
      if (formeData.rpe?.value !== undefined) {
        const rpeValue = formeData.rpe.value;
        const rpeScore = 25 - ((rpeValue - 1) * 2.5); // Échelle 1-10 inversée
        score += Math.max(0, rpeScore);
        totalFactors++;
      }

      // Calcul du score final (moyenne sur 100)
      const finalScore = totalFactors > 0 ? Math.round(score / totalFactors * 4) : 0;

      console.log(`Score de forme calculé: ${finalScore}/100 (${totalFactors} facteurs)`);
      setFormeScore(finalScore);
      setLastCalculated(today);

      // Sauvegarder le score calculé localement
      await AsyncStorage.setItem(`forme_score_${userId}_${today}`, finalScore.toString());

    } catch (err) {
      console.error('Erreur calcul score de forme:', err);
      setError('Erreur lors du calcul du score de forme');

      // Fallback: essayer de récupérer le dernier score sauvegardé
      try {
        const savedScore = await AsyncStorage.getItem(`forme_score_${userId}_${today}`);
        if (savedScore) {
          setFormeScore(parseInt(savedScore));
        }
      } catch (fallbackError) {
        console.error('Erreur récupération score sauvegardé:', fallbackError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId, lastCalculated]);

  const refreshScore = useCallback(() => {
    calculateFormeScore(true);
  }, [calculateFormeScore]);

  // Calcul initial au montage du composant
  useEffect(() => {
    if (userId) {
      calculateFormeScore();
    }
  }, [userId, calculateFormeScore]);

  return {
    formeScore,
    isLoading,
    error,
    refreshScore
  };
};