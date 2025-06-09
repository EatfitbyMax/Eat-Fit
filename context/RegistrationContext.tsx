
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface RegistrationData {
  firstName: string;
  lastName: string;
  goals: string[];
  gender: 'Homme' | 'Femme' | null;
  age: string;
  height: string;
  weight: string;
  activityLevel: string;
  email: string;
  password: string;
}

interface RegistrationContextType {
  registrationData: RegistrationData;
  updateRegistrationData: (data: Partial<RegistrationData>) => void;
  resetRegistrationData: () => void;
}

const initialData: RegistrationData = {
  firstName: '',
  lastName: '',
  goals: [],
  gender: null,
  age: '',
  height: '',
  weight: '',
  activityLevel: '',
  email: '',
  password: '',
};

const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined);

export function RegistrationProvider({ children }: { children: ReactNode }) {
  const [registrationData, setRegistrationData] = useState<RegistrationData>(initialData);

  const updateRegistrationData = (data: Partial<RegistrationData>) => {
    setRegistrationData(prev => ({ ...prev, ...data }));
  };

  const resetRegistrationData = () => {
    setRegistrationData(initialData);
  };

  return (
    <RegistrationContext.Provider value={{
      registrationData,
      updateRegistrationData,
      resetRegistrationData,
    }}>
      {children}
    </RegistrationContext.Provider>
  );
}

export function useRegistration() {
  const context = useContext(RegistrationContext);
  if (context === undefined) {
    throw new Error('useRegistration must be used within a RegistrationProvider');
  }
  return context;
}
