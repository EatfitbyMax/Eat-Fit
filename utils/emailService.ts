// Service email factice - EmailJS supprimé
export interface EmailParams {
  to_email: string;
  to_name: string;
  new_password: string;
  app_name: string;
}

export class EmailService {
  static async sendPasswordResetEmail(params: EmailParams): Promise<boolean> {
    console.log('⚠️ Service email désactivé - EmailJS supprimé');
    console.log('📧 Email qui aurait été envoyé à:', params.to_email);
    console.log('🔑 Nouveau mot de passe:', params.new_password);

    // Retourner false pour indiquer que l'email n'a pas été envoyé
    return false;
  }

  static async testEmailConfiguration(): Promise<boolean> {
    console.log('⚠️ Test email désactivé - EmailJS supprimé');
    return false;
  }
}