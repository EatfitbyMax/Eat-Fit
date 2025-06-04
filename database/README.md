
# Configuration de la base de données Supabase

## Instructions d'installation

1. **Créer un projet Supabase**
   - Allez sur [supabase.com](https://supabase.com)
   - Créez un nouveau projet
   - Notez l'URL et la clé API anonyme

2. **Exécuter les scripts SQL**
   Dans l'éditeur SQL de Supabase, exécutez les fichiers dans cet ordre :
   
   ```bash
   1. schema.sql       # Création des tables et index
   2. policies.sql     # Politiques RLS et sécurité
   3. sample_data.sql  # Données d'exemple (optionnel)
   ```

3. **Configuration de l'authentification**
   - Activez l'authentification par email dans Supabase
   - Configurez les URL de redirection si nécessaire

4. **Variables d'environnement**
   Mettez à jour `utils/supabase.ts` avec vos vraies clés :
   ```typescript
   const supabaseUrl = 'VOTRE_SUPABASE_URL';
   const supabaseKey = 'VOTRE_SUPABASE_ANON_KEY';
   ```

## Structure de la base de données

### Tables principales
- `profiles` : Profils utilisateurs (étend auth.users)
- `nutrition_programs` : Programmes de nutrition
- `meals` : Repas des programmes de nutrition
- `workout_programs` : Programmes d'entraînement
- `workouts` : Séances d'entraînement
- `exercises` : Exercices des séances
- `conversations` : Conversations entre coach et client
- `messages` : Messages dans les conversations
- `program_assignments` : Affectations de programmes aux clients

### Sécurité (RLS)
Toutes les tables ont des politiques Row Level Security configurées pour :
- Les coachs ne peuvent voir/modifier que leurs propres données
- Les clients ne peuvent voir que leurs programmes assignés
- La messagerie est sécurisée entre coach et client

### Relations
- Un coach peut avoir plusieurs programmes et clients
- Un client peut avoir plusieurs programmes assignés
- Les conversations sont liées à un coach et un client
- Les programmes peuvent être assignés à plusieurs clients

## Fonctionnalités avancées

### Temps réel
Supabase permet l'écoute en temps réel des changements :
- Nouveaux messages dans la messagerie
- Nouvelles affectations de programmes
- Modifications des programmes

### Fonctions automatiques
- Création automatique du profil utilisateur après inscription
- Mise à jour automatique des timestamps `updated_at`
- Contraintes de validation des données
