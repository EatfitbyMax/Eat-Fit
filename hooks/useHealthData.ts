
import { useState } from 'react';

// Hook HealthKit supprimé - fonctionnalité non utilisée
const useHealthData = (date: Date = new Date()) => {
  return {
    steps: 0,
    flights: 0,
    distance: 0,
    heartRate: 0,
    weight: null,
    activeEnergy: 0,
    sleepHours: 0,
    hasPermissions: false,
    isLoading: false,
    error: 'Fonctionnalité HealthKit supprimée',
    writeWeight: () => Promise.resolve(false),
  };
};

export default useHealthData;
