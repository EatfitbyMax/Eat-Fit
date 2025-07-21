
// Service pour réveiller le serveur Replit
export class ServerWakeupService {
  private static readonly MAX_RETRY_ATTEMPTS = 3;
  private static readonly RETRY_DELAY = 2000; // 2 secondes

  static async wakeupServer(): Promise<boolean> {
    const serverUrl = 'https://workspace-eatfitbymax.replit.dev';
    
    console.log('🔄 Tentative de réveil du serveur Replit...');
    
    for (let attempt = 1; attempt <= this.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        console.log(`⏳ Tentative ${attempt}/${this.MAX_RETRY_ATTEMPTS}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 secondes
        
        const response = await fetch(`${serverUrl}/api/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log('✅ Serveur Replit réveillé avec succès');
          return true;
        }
        
        console.log(`⚠️ Tentative ${attempt} échouée, statut: ${response.status}`);
        
      } catch (error: any) {
        console.log(`❌ Tentative ${attempt} échouée:`, error.message);
        
        if (attempt < this.MAX_RETRY_ATTEMPTS) {
          console.log(`⏱️ Attente de ${this.RETRY_DELAY}ms avant la prochaine tentative...`);
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        }
      }
    }
    
    console.log('❌ Impossible de réveiller le serveur après plusieurs tentatives');
    return false;
  }
}
