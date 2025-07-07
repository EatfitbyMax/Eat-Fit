
# Configuration EmailJS pour l'envoi d'emails

## Étapes de configuration

### 1. Créer un compte EmailJS
- Allez sur [https://www.emailjs.com](https://www.emailjs.com)
- Créez un compte gratuit
- Vérifiez votre email

### 2. Configurer un service email
- Dans le dashboard EmailJS, allez dans "Email Services"
- Cliquez sur "Add New Service"
- Choisissez votre fournisseur d'email (Gmail, Outlook, etc.)
- Suivez les instructions pour connecter votre compte email
- Notez le **Service ID** généré

### 3. Créer un template d'email
- Allez dans "Email Templates"
- Cliquez sur "Create New Template"
- Utilisez le contenu du fichier `email-templates/password-reset-template.html`
- Configurez les variables suivantes :
  - `{{to_email}}` : Email du destinataire
  - `{{to_name}}` : Nom du destinataire
  - `{{new_password}}` : Nouveau mot de passe temporaire
  - `{{app_name}}` : Nom de l'application
  - `{{reset_date}}` : Date de réinitialisation
- Notez le **Template ID** généré

### 4. Obtenir la clé publique
- Allez dans "Integration" → "API Keys"
- Copiez votre **Public Key**

### 5. Configurer les variables d'environnement
Créez un fichier `.env` avec :
```
EXPO_PUBLIC_EMAILJS_SERVICE_ID=your_service_id_here
EXPO_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id_here
EXPO_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key_here
```

### 6. Tester la configuration
- Utilisez la méthode `EmailService.testEmailConfiguration()` pour tester
- Vérifiez que les emails arrivent bien dans la boîte de réception

## Limites du plan gratuit
- 200 emails/mois
- Idéal pour commencer et tester
- Possibilité d'upgrade si nécessaire

## Sécurité
- Les clés EmailJS sont publiques par nature
- Ne mettez jamais de mots de passe ou informations sensibles dans les templates
- Utilisez les variables de template pour les données dynamiques
