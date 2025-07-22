// Service désactivé - Utilisation du serveur VPS uniquement
export class ServerWakeupService {
  static async wakeupServer(): Promise<boolean> {
    console.log('⚠️ Service de réveil désactivé - Utilisation du serveur VPS');
    return false;
  }

  static async testConnection(): Promise<boolean> {
    console.log('⚠️ Service de test Replit désactivé - Utilisation du serveur VPS');
    return false;
  }
}