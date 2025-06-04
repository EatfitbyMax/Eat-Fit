
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

-- Forcer la création des profils si ils n'existent pas
INSERT INTO profiles (user_id, name, user_type)
SELECT 
    u.id,
    u.raw_user_meta_data->>'name',
    u.raw_user_meta_data->>'user_type'
FROM auth.users u
WHERE u.email IN ('eatfitbymax@gmail.com', 'm.pacullmarquie@gmail.com')
AND NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.user_id = u.id
)
ON CONFLICT (user_id) DO UPDATE SET
    name = EXCLUDED.name,
    user_type = EXCLUDED.user_type;

-- Vérifier les résultats
SELECT 
    u.email, 
    u.raw_user_meta_data,
    p.name,
    p.user_type,
    p.created_at
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE u.email IN ('eatfitbymax@gmail.com', 'm.pacullmarquie@gmail.com');
