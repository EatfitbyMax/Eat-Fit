
import emailjs from '@emailjs/react-native';

// Configuration EmailJS
const EMAILJS_CONFIG = {
  SERVICE_ID: process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID || 'your_service_id',
  TEMPLATE_ID: process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID || 'your_template_id',
  PUBLIC_KEY: process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY || 'your_public_key',
};

console.log('🔧 Configuration EmailJS:', {
  SERVICE_ID: EMAILJS_CONFIG.SERVICE_ID,
  TEMPLATE_ID: EMAILJS_CONFIG.TEMPLATE_ID,
  PUBLIC_KEY: EMAILJS_CONFIG.PUBLIC_KEY ? `${EMAILJS_CONFIG.PUBLIC_KEY.substring(0, 10)}...` : 'NON DÉFINIE',
});

export interface EmailParams {
  to_email: string;
  to_name: string;
  new_password: string;
  app_name: string;
}

export class EmailService {
  static async sendPasswordResetEmail(params: EmailParams): Promise<boolean> {
    try {
      console.log('📧 Envoi du mail de réinitialisation à:', params.to_email);
      
      // Vérifier que la clé publique est valide
      if (!EMAILJS_CONFIG.PUBLIC_KEY || EMAILJS_CONFIG.PUBLIC_KEY === 'your_public_key') {
        console.error('❌ Clé publique EmailJS non configurée');
        return false;
      }
      
      // Initialiser EmailJS avec votre clé publique
      console.log('🔑 Initialisation EmailJS avec la clé:', EMAILJS_CONFIG.PUBLIC_KEY.substring(0, 10) + '...');
      emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
      
      // Paramètres du template email
      const templateParams = {
        to_email: params.to_email,
        to_name: params.to_name,
        new_password: params.new_password,
        app_name: params.app_name,
        reset_date: new Date().toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };
      
      // Envoyer l'email
      const response = await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        templateParams
      );
      
      if (response.status === 200) {
        console.log('✅ Email envoyé avec succès:', response);
        return true;
      } else {
        console.error('❌ Erreur envoi email:', response);
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur service email:', error);
      return false;
    }
  }
  
  // Méthode pour tester la configuration
  static async testEmailConfiguration(): Promise<boolean> {
    try {
      const testParams: EmailParams = {
        to_email: 'test@example.com',
        to_name: 'Test User',
        new_password: 'TestPassword123',
        app_name: 'EatFitByMax'
      };
      
      return await this.sendPasswordResetEmail(testParams);
    } catch (error) {
      console.error('❌ Test configuration email échoué:', error);
      return false;
    }
  }
}
