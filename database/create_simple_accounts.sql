
-- Script pour créer des comptes utilisateurs de test
-- À exécuter dans l'éditeur SQL de Supabase

-- D'abord, créer les profils pour les utilisateurs qui existent déjà
-- (si vous les avez créés manuellement via l'interface Supabase)

-- Vérifier s'il y a des utilisateurs dans auth.users
SELECT email, id, raw_user_meta_data FROM auth.users;

-- Si vous avez des utilisateurs mais pas de profils, les créer :
INSERT INTO profiles (user_id, name, user_type)
SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
    COALESCE(u.raw_user_meta_data->>'user_type', 'client')::TEXT
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Vérifier les résultats
SELECT 
    u.email,
    u.raw_user_meta_data,
    p.name,
    p.user_type,
    p.created_at
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
ORDER BY u.created_at;
