
-- Script pour corriger le type d'utilisateur et créer un admin
-- Version corrigée sans tentative de mise à jour de champs inexistants

-- 1. Mettre à jour l'utilisateur eatfitbymax pour en faire un coach
UPDATE profiles 
SET user_type = 'coach', 
    name = 'EatFitByMax Admin'
WHERE user_id = (
    SELECT id FROM auth.users 
    WHERE email = 'eatfitbymax@gmail.com'
);

-- 2. Mettre à jour les métadonnées utilisateur pour cohérence (optionnel)
UPDATE auth.users 
SET raw_user_meta_data = '{"name": "EatFitByMax Admin", "user_type": "coach"}'::jsonb
WHERE email = 'eatfitbymax@gmail.com';

-- 3. Vérifier les résultats
SELECT 
    u.email,
    p.name,
    p.user_type,
    u.raw_user_meta_data
FROM auth.users u
JOIN profiles p ON p.user_id = u.id
WHERE u.email IN ('eatfitbymax@gmail.com', 'm.pacullmarquie@gmail.com')
ORDER BY p.user_type DESC;
