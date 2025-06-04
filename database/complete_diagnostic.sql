
-- Script de diagnostic complet pour identifier les problèmes

-- 1. Vérifier la structure des tables
SELECT 
    'TABLE: auth.users' as check_name,
    COUNT(*) as count,
    'Utilisateurs dans auth.users' as description
FROM auth.users
UNION ALL
SELECT 
    'TABLE: profiles' as check_name,
    COUNT(*) as count,
    'Profils créés' as description
FROM profiles;

-- 2. Afficher tous les utilisateurs avec leurs profils
SELECT 
    'USERS WITH PROFILES' as section,
    u.email,
    u.id as user_id,
    u.raw_user_meta_data,
    u.created_at as user_created,
    p.name,
    p.user_type,
    p.created_at as profile_created
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
ORDER BY u.created_at DESC;

-- 3. Vérifier les triggers
SELECT 
    'TRIGGER CHECK' as section,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table = 'users';

-- 4. Vérifier les fonctions
SELECT 
    'FUNCTION CHECK' as section,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%user%';
