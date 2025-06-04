
-- Script de diagnostic pour vérifier les utilisateurs et profils

-- 1. Vérifier tous les utilisateurs dans auth.users
SELECT 
    'AUTH USERS' as table_name,
    COUNT(*) as count
FROM auth.users;

-- 2. Afficher tous les utilisateurs auth
SELECT 
    email,
    id,
    created_at,
    raw_user_meta_data,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- 3. Vérifier tous les profils
SELECT 
    'PROFILES' as table_name,
    COUNT(*) as count
FROM profiles;

-- 4. Afficher tous les profils
SELECT 
    p.name,
    p.user_type,
    p.created_at,
    u.email
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.user_id
ORDER BY p.created_at DESC;

-- 5. Vérifier s'il y a des utilisateurs sans profils
SELECT 
    u.email,
    u.id,
    u.raw_user_meta_data,
    'NO PROFILE' as status
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.user_id = u.id
);

-- 6. Vérifier s'il y a des profils sans utilisateurs (orphelins)
SELECT 
    p.name,
    p.user_id,
    'ORPHAN PROFILE' as status
FROM profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = p.user_id
);
