
export interface WorkoutSession {
  id: string;
  userId: string;
  sport: string;
  sportName: string;
  type: 'scheduled' | 'completed' | 'custom';
  date: string; // ISO string
  duration: number; // en minutes
  calories?: number;
  intensity: 'low' | 'medium' | 'high';
  exercises?: Exercise[];
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export interface Exercise {
  id: string;
  name: string;
  sets?: number;
  reps?: string;
  weight?: number;
  duration?: number; // pour cardio
  distance?: number; // pour course/vélo
  completed: boolean;
}

export interface SportStats {
  totalSessions: number;
  totalDuration: number; // minutes
  totalCalories: number;
  averageIntensity: number;
  weeklyGoal: number; // sessions par semaine
  weeklyProgress: number; // sessions cette semaine
  favoriteTimeSlot: string;
  progressTrend: 'up' | 'down' | 'stable';
}

export interface WorkoutSession {
  id: string;
  userId: string;
  sport: string;
  type: 'planned' | 'completed';
  date: string;
  duration: number;
  intensity: 'low' | 'medium' | 'high';
  calories?: number;
  notes?: string;
  exercises?: Array<{
    name: string;
    sets?: number;
    reps?: number;
    weight?: number;
    distance?: number;
    time?: number;
  }>;
}

interface SportStats {
  totalSessions: number;
  totalDuration: number;
  totalCalories: number;
  averageIntensity: number;
  weeklyGoal: number;
  weeklyProgress: number;
  favoriteTimeSlot: string;
  progressTrend: 'up' | 'down' | 'stable';
}

class WorkoutTrackingService {
  private static VPS_URL = process.env.EXPO_PUBLIC_VPS_URL || 'https://eatfitbymax.replit.app';

  static async getWorkoutSessions(userId: string): Promise<WorkoutSession[]> {
    try {
      // Essayer le serveur VPS d'abord
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.VPS_URL}/api/workouts/${userId}`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const sessions = await response.json();
        console.log('Données d\'entraînement chargées depuis le serveur VPS:', sessions.length);
        return sessions;
      } else {
        throw new Error('Réponse serveur non-OK');
      }
    } catch (error) {
      console.log('Erreur serveur VPS workouts:', error.message);
      
      // Fallback vers le stockage local
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const stored = await AsyncStorage.getItem(`workout_sessions_${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }
      return [];
    }
  }

  static async saveWorkoutSession(session: WorkoutSession): Promise<void> {
    try {
      // Sauvegarder sur le serveur VPS
      const response = await fetch(`${this.VPS_URL}/api/workouts/${session.userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(session),
      });

      if (response.ok) {
        console.log('Session d\'entraînement sauvegardée sur le serveur VPS');
      } else {
        throw new Error('Erreur sauvegarde serveur');
      }
    } catch (error) {
      console.log('Erreur sauvegarde serveur VPS workout:', error);
      
      // Fallback vers le stockage local
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const sessions = await this.getWorkoutSessions(session.userId);
      const updatedSessions = [...sessions, session];
      await AsyncStorage.setItem(`workout_sessions_${session.userId}`, JSON.stringify(updatedSessions));
    }
  }

  static async updateWorkoutSession(userId: string, sessionId: string, updates: Partial<WorkoutSession>): Promise<void> {
    const sessions = await this.getWorkoutSessions(userId);
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex !== -1) {
      sessions[sessionIndex] = { ...sessions[sessionIndex], ...updates };
      
      try {
        // Sauvegarder toutes les sessions sur le serveur
        const response = await fetch(`${this.VPS_URL}/api/workouts/${userId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sessions),
        });

        if (!response.ok) {
          throw new Error('Erreur sauvegarde serveur');
        }
      } catch (error) {
        console.log('Erreur mise à jour serveur VPS workout:', error);
        
        // Fallback local
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem(`workout_sessions_${userId}`, JSON.stringify(sessions));
      }
    }
  }

  static calculateSportStats(sessions: WorkoutSession[], sport: string): SportStats {
    const sportSessions = sessions.filter(s => s.sport === sport);
    const now = new Date();
    
    // Sessions de cette semaine
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const thisWeekSessions = sportSessions.filter(s => 
      new Date(s.date) >= startOfWeek && s.type === 'completed'
    );

    // Calculer les tendances des 4 dernières semaines
    const weeklyData = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(startOfWeek);
      weekStart.setDate(startOfWeek.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekSessions = sportSessions.filter(s => {
        const sessionDate = new Date(s.date);
        return sessionDate >= weekStart && sessionDate <= weekEnd && s.type === 'completed';
      });
      
      weeklyData.push(weekSessions.length);
    }

    // Déterminer la tendance
    let progressTrend: 'up' | 'down' | 'stable' = 'stable';
    if (weeklyData.length >= 2) {
      const recent = weeklyData.slice(-2).reduce((a, b) => a + b, 0);
      const previous = weeklyData.slice(0, 2).reduce((a, b) => a + b, 0);
      
      if (recent > previous) progressTrend = 'up';
      else if (recent < previous) progressTrend = 'down';
    }

    const completedSessions = sportSessions.filter(s => s.type === 'completed');
    const totalDuration = completedSessions.reduce((sum, s) => sum + s.duration, 0);
    const totalCalories = completedSessions.reduce((sum, s) => sum + (s.calories || 0), 0);
    
    const intensities = { low: 1, medium: 2, high: 3 };
    const avgIntensity = completedSessions.length > 0 ? 
      completedSessions.reduce((sum, s) => sum + intensities[s.intensity], 0) / completedSessions.length : 2;

    return {
      totalSessions: completedSessions.length,
      totalDuration,
      totalCalories,
      averageIntensity: avgIntensity,
      weeklyGoal: 3, // Par défaut, peut être personnalisé
      weeklyProgress: thisWeekSessions.length,
      favoriteTimeSlot: 'Matin', // À calculer selon les heures
      progressTrend
    };
  }

  static getSportEmoji(sport: string): string {
    const emojiMap: Record<string, string> = {
      musculation: '💪',
      course: '🏃',
      cyclisme: '🚴',
      natation: '🏊',
      yoga: '🧘',
      boxe: '🥊',
      tennis: '🎾',
      football: '⚽',
      basketball: '🏀',
      escalade: '🧗',
      crossfit: '🏋️',
      danse: '💃'
    };
    return emojiMap[sport] || '🏃';
  }

  static getSportName(sport: string): string {
    const nameMap: Record<string, string> = {
      musculation: 'Musculation',
      course: 'Course à pied',
      cyclisme: 'Cyclisme',
      natation: 'Natation',
      yoga: 'Yoga',
      boxe: 'Boxe/Arts martiaux',
      tennis: 'Tennis',
      football: 'Football',
      basketball: 'Basketball',
      escalade: 'Escalade',
      crossfit: 'CrossFit',
      danse: 'Danse'
    };
    return nameMap[sport] || sport;
  }
}
static async createSampleSessions(userId: string, favoriteSport: string): Promise<void> {
    const sampleSessions: WorkoutSession[] = [];
    const currentDate = new Date();
    
    // Créer des sessions d'exemple pour les 30 derniers jours
    for (let i = 0; i < 30; i++) {
      const sessionDate = new Date(currentDate);
      sessionDate.setDate(currentDate.getDate() - i);
      
      // Probabilité de session selon le jour de la semaine
      const dayOfWeek = sessionDate.getDay();
      const probability = [0.2, 0.8, 0.6, 0.8, 0.7, 0.9, 0.5][dayOfWeek]; // Dimanche à Samedi
      
      if (Math.random() < probability) {
        const intensities: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
        const intensity = intensities[Math.floor(Math.random() * 3)];
        
        let duration, calories;
        switch (favoriteSport) {
          case 'musculation':
            duration = Math.floor(Math.random() * 40) + 45; // 45-85 min
            calories = duration * 6; // ~6 cal/min pour musculation
            break;
          case 'course':
            duration = Math.floor(Math.random() * 30) + 30; // 30-60 min
            calories = duration * 12; // ~12 cal/min pour course
            break;
          case 'yoga':
            duration = Math.floor(Math.random() * 30) + 45; // 45-75 min
            calories = duration * 3; // ~3 cal/min pour yoga
            break;
          default:
            duration = Math.floor(Math.random() * 30) + 45;
            calories = duration * 8;
        }
        
        const session: WorkoutSession = {
          id: `sample_${userId}_${i}`,
          userId: userId,
          sport: favoriteSport,
          sportName: this.getSportName(favoriteSport),
          type: 'completed',
          date: sessionDate.toISOString(),
          duration: duration,
          calories: calories,
          intensity: intensity,
          exercises: [],
          createdAt: sessionDate.toISOString(),
          completedAt: sessionDate.toISOString()
        };
        
        sampleSessions.push(session);
      }
    }
    
    // Sauvegarder les sessions d'exemple
    try {
      const response = await fetch(`${this.VPS_URL}/api/workout-sessions/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sampleSessions),
      });

      if (response.ok) {
        console.log('Sessions d\'exemple créées sur le serveur VPS');
      } else {
        throw new Error('Erreur sauvegarde serveur');
      }
    } catch (error) {
      console.log('Erreur sauvegarde serveur VPS sessions exemple:', error);
      
      // Fallback local
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(`workout_sessions_${userId}`, JSON.stringify(sampleSessions));
    }
  }
