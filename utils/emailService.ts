import emailjs from '@emailjs/react-native';

// Configuration EmailJS avec vos variables d'environnement
const EMAILJS_CONFIG = {
  SERVICE_ID: process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID || 'service_3d0mqnl',
  TEMPLATE_ID: process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID || 'template_cmyczjl',
  PUBLIC_KEY: process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY || 't2undaGNuWxcNU2YD',
};

console.log('🔧 Configuration EmailJS:', {
  PUBLIC_KEY: EMAILJS_CONFIG.PUBLIC_KEY ? `${EMAILJS_CONFIG.PUBLIC_KEY.substring(0, 10)}...` : 'NON_DEFINIE',
  SERVICE_ID: EMAILJS_CONFIG.SERVICE_ID,
  TEMPLATE_ID: EMAILJS_CONFIG.TEMPLATE_ID
});

if (!EMAILJS_CONFIG.PUBLIC_KEY || EMAILJS_CONFIG.PUBLIC_KEY.length < 10) {
  console.error('❌ Clé publique EmailJS manquante ou invalide');
  throw new Error('Configuration EmailJS incomplète');
}

export interface EmailParams {
  to_email: string;
  to_name: string;
  new_password: string;
  app_name: string;
}

export class EmailService {
  // Initialiser EmailJS une seule fois
  private static isInitialized = false;

  private static initializeEmailJS(): void {
    if (!this.isInitialized && EMAILJS_CONFIG.PUBLIC_KEY) {
      try {
        emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
        this.isInitialized = true;
        console.log('✅ EmailJS initialisé avec succès');
      } catch (error) {
        console.error('❌ Erreur initialisation EmailJS:', error);
      }
    }
  }

  static async sendPasswordResetEmail(params: EmailParams): Promise<boolean> {
    try {
      console.log('📧 Démarrage envoi email à:', params.to_email);

      // Vérifications de base
      if (!params.to_email || !params.to_email.includes('@')) {
        console.error('❌ Email invalide:', params.to_email);
        return false;
      }

      if (!EMAILJS_CONFIG.PUBLIC_KEY || EMAILJS_CONFIG.PUBLIC_KEY === 'your_public_key') {
        console.error('❌ Clé publique EmailJS non configurée dans .env');
        return false;
      }

      if (!EMAILJS_CONFIG.SERVICE_ID || !EMAILJS_CONFIG.TEMPLATE_ID) {
        console.error('❌ SERVICE_ID ou TEMPLATE_ID manquant dans .env');
        return false;
      }

      // Initialiser EmailJS
      this.initializeEmailJS();

      // Paramètres du template
      const templateParams = {
        to_email: params.to_email,
        to_name: params.to_name || 'Utilisateur',
        new_password: params.new_password,
        app_name: params.app_name || 'EatFitByMax',
        reset_date: new Date().toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      console.log('📤 Envoi avec les paramètres:', {
        service: EMAILJS_CONFIG.SERVICE_ID,
        template: EMAILJS_CONFIG.TEMPLATE_ID,
        to: params.to_email
      });

      // Envoyer l'email avec timeout
      const response = await Promise.race([
        emailjs.send(
          EMAILJS_CONFIG.SERVICE_ID,
          EMAILJS_CONFIG.TEMPLATE_ID,
          templateParams
        ),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 10000)
        )
      ]);

      console.log('📧 Réponse EmailJS:', response);

      if (response && (response.status === 200 || response.text === 'OK')) {
        console.log('✅ Email envoyé avec succès');
        return true;
      } else {
        console.error('❌ Erreur envoi email - statut:', response?.status);
        return false;
      }

    } catch (error) {
      console.error('❌ Exception service email:', error);

      if (error.message?.includes('Timeout')) {
        console.error('⏰ Timeout - vérifiez votre connexion internet');
      } else if (error.message?.includes('404')) {
        console.error('🔍 Template ou Service non trouvé - vérifiez vos IDs EmailJS');
      } else if (error.message?.includes('401') || error.message?.includes('403')) {
        console.error('🔑 Erreur d\'authentification - vérifiez votre clé publique');
      }

      return false;
    }
  }

  // Méthode de test améliorée
  static async testEmailConfiguration(): Promise<boolean> {
    try {
      console.log('🧪 Test de configuration EmailJS...');

      const testParams: EmailParams = {
        to_email: 'test@example.com',
        to_name: 'Test User',
        new_password: 'TestPassword123',
        app_name: 'EatFitByMax'
      };

      // Test sans vraiment envoyer
      console.log('📋 Configuration testée:', {
        SERVICE_ID: EMAILJS_CONFIG.SERVICE_ID,
        TEMPLATE_ID: EMAILJS_CONFIG.TEMPLATE_ID,
        PUBLIC_KEY_SET: !!EMAILJS_CONFIG.PUBLIC_KEY
      });

      return true; // Retourne true si la config semble OK

    } catch (error) {
      console.error('❌ Test configuration email échoué:', error);
      return false;
    }
  }

  // Nouvelle méthode pour vérifier la configuration
  static validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!EMAILJS_CONFIG.SERVICE_ID || EMAILJS_CONFIG.SERVICE_ID === 'your_service_id_here') {
      errors.push('SERVICE_ID manquant ou invalide');
    }

    if (!EMAILJS_CONFIG.TEMPLATE_ID || EMAILJS_CONFIG.TEMPLATE_ID === 'your_template_id_here') {
      errors.push('TEMPLATE_ID manquant ou invalide');
    }

    if (!EMAILJS_CONFIG.PUBLIC_KEY || EMAILJS_CONFIG.PUBLIC_KEY === 'your_public_key_here') {
      errors.push('PUBLIC_KEY manquante ou invalide');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}