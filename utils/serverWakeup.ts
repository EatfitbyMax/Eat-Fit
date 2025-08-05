
// Service désactivé - Utilisation du serveur VPS uniquement
export class ServerWakeupService {
  static async wakeupServer(): Promise<boolean> {
    return true; // VPS toujours actif
  }

  static async testConnection(): Promise<boolean> {
    return true; // VPS toujours disponible
  }
}
