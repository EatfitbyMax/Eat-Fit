
// Service désactivé - Utilisation du serveur VPS externe uniquement
export class ServerWakeupService {
  static async wakeupServer(): Promise<boolean> {
    return true; // VPS externe toujours actif
  }

  static async testConnection(): Promise<boolean> {
    // Test de connexion au VPS externe
    try {
      const VPS_URL = process.env.EXPO_PUBLIC_VPS_URL || 'https://eatfitbymax.cloud';
      const response = await fetch(`${VPS_URL}/health`, { 
        method: 'GET',
        timeout: 5000 
      });
      return response.ok;
    } catch (error) {
      console.warn('Connexion VPS externe échouée:', error);
      return false;
    }
  }
}
