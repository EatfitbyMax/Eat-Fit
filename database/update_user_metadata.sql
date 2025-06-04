
-- Script pour mettre à jour les métadonnées des utilisateurs
-- À exécuter dans l'éditeur SQL de Supabase

-- Mettre à jour les métadonnées pour eatfitbymax@gmail.com
UPDATE auth.users 
SET raw_user_meta_data = '{"name": "EatFitByMax Admin", "user_type": "coach"}'::jsonb
WHERE email = 'eatfitbymax@gmail.com';

-- Mettre à jour les métadonnées pour m.pacullmarquie@gmail.com
UPDATE auth.users 
SET raw_user_meta_data = '{"name": "M. Pacull Marquie", "user_type": "client"}'::jsonb
WHERE email = 'm.pacullmarquie@gmail.com';

-- Vérifier les métadonnées
SELECT email, raw_user_meta_data 
FROM auth.users 
WHERE email IN ('eatfitbymax@gmail.com', 'm.pacullmarquie@gmail.com');
