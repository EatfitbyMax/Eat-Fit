
const API_BASE_URL = 'http://localhost:5000/api';

export interface User {
  id: number;
  email: string;
  name: string;
  userType: 'client' | 'coach';
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

class AuthService {
  private token: string | null = null;

  // Stocker le token
  private setToken(token: string) {
    this.token = token;
  }

  // Récupérer le token
  private getToken(): string | null {
    return this.token;
  }

  // Inscription
  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name,
          userType: 'client'
        }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        this.setToken(data.token);
      }

      return data;
    } catch (error) {
      console.error('Erreur inscription:', error);
      return { success: false, error: 'Erreur de connexion au serveur' };
    }
  }

  // Connexion
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        this.setToken(data.token);
      }

      return data;
    } catch (error) {
      console.error('Erreur connexion:', error);
      return { success: false, error: 'Erreur de connexion au serveur' };
    }
  }

  // Vérifier le token
  async verifyToken(): Promise<AuthResponse> {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'Aucun token' };
      }

      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur vérification token:', error);
      return { success: false, error: 'Erreur de vérification' };
    }
  }

  // Déconnexion
  logout(): void {
    this.token = null;
  }

  // Récupérer le profil
  async getProfile(): Promise<any> {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('Aucun token');
      }

      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Erreur récupération profil:', error);
      throw error;
    }
  }

  // Mettre à jour le profil
  async updateProfile(profileData: any): Promise<any> {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('Aucun token');
      }

      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      return await response.json();
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      throw error;
    }
  }

  // Test de connexion serveur
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/test`);
      const data = await response.json();
      return data.success === true;
    } catch (error) {
      console.error('Erreur test connexion:', error);
      return false;
    }
  }
}

export const authService = new AuthService();
