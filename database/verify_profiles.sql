-- Vérifier que les profils sont bien créés avec les bonnes métadonnées

-- 1. Vérifier les métadonnées dans auth.users
SELECT 
    email, 
    raw_user_meta_data->'name' as name,
    raw_user_meta_data->'user_type' as user_type
FROM auth.users 
WHERE email IN ('eatfitbymax@gmail.com', 'm.pacullmarquie@gmail.com');

-- 2. Vérifier les profils créés automatiquement
SELECT 
    p.name, 
    p.user_type, 
    u.email,
    p.created_at
FROM profiles p
JOIN auth.users u ON u.id = p.user_id
WHERE u.email IN ('eatfitbymax@gmail.com', 'm.pacullmarquie@gmail.com');

-- 3. Forcer la création du profil si nécessaire
INSERT INTO profiles (user_id, name, user_type)
SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'name', u.email),
    COALESCE(u.raw_user_meta_data->>'user_type', 'client')
FROM auth.users u
WHERE u.email IN ('eatfitbymax@gmail.com', 'm.pacullmarquie@gmail.com')
AND NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.user_id = u.id
);