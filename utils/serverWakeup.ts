
// Service pour réveiller le serveur Replit
export class ServerWakeupService {
  private static readonly MAX_RETRY_ATTEMPTS = 5;
  private static readonly RETRY_DELAY = 3000; // 3 secondes
  private static readonly TIMEOUT_MS = 30000; // 30 secondes

  static async wakeupServer(): Promise<boolean> {
    const serverUrl = 'https://workspace-eatfitbymax.replit.dev';
    
    console.log('🔄 Tentative de réveil du serveur Replit...');
    console.log(`🌐 URL du serveur: ${serverUrl}`);
    
    // Test de connectivité d'abord
    console.log('🔍 Test de connectivité basique...');
    
    for (let attempt = 1; attempt <= this.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        console.log(`⏳ Tentative ${attempt}/${this.MAX_RETRY_ATTEMPTS}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);
        
        // Tester différentes routes
        const routes = ['/api/health', '/api/diagnostic', '/'];
        let success = false;
        
        for (const route of routes) {
          try {
            console.log(`🔍 Test de la route: ${route}`);
            const response = await fetch(`${serverUrl}${route}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'EatFitByMax-App/1.0.0',
              },
              signal: controller.signal
            });
            
            if (response.ok) {
              const data = await response.text();
              console.log(`✅ Route ${route} réponse OK:`, data.substring(0, 100));
              success = true;
              break;
            } else {
              console.log(`⚠️ Route ${route} - Statut: ${response.status}`);
            }
          } catch (routeError: any) {
            console.log(`❌ Erreur route ${route}:`, routeError.message);
          }
        }
        
        clearTimeout(timeoutId);
        
        if (success) {
          console.log('✅ Serveur Replit accessible avec succès');
          return true;
        }
        
        console.log(`⚠️ Tentative ${attempt} échouée - Aucune route accessible`);
        
      } catch (error: any) {
        console.log(`❌ Tentative ${attempt} échouée:`, error.message);
        
        // Informations de debug supplémentaires
        if (error.name === 'AbortError') {
          console.log('⏰ Timeout - Le serveur met trop de temps à répondre');
        } else if (error.message.includes('Network request failed')) {
          console.log('🌐 Problème réseau - Vérifiez la connexion internet');
        }
      }
      
      if (attempt < this.MAX_RETRY_ATTEMPTS) {
        console.log(`⏱️ Attente de ${this.RETRY_DELAY}ms avant la prochaine tentative...`);
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
      }
    }
    
    console.log('❌ Impossible de réveiller le serveur après plusieurs tentatives');
    console.log('🔧 Solutions possibles:');
    console.log('   - Vérifiez que PM2 est en cours d\'exécution');
    console.log('   - Vérifiez la configuration réseau');
    console.log('   - Redémarrez le serveur manuellement');
    
    return false;
  }

  static async testConnection(): Promise<boolean> {
    try {
      const serverUrl = 'https://workspace-eatfitbymax.replit.dev';
      const response = await fetch(`${serverUrl}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
