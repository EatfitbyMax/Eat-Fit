
-- Script pour forcer la création des comptes coach et client
-- Version simplifiée qui utilise les fonctionnalités de base de Supabase

-- Étape 1: Nettoyer les données existantes (optionnel)
-- DELETE FROM profiles WHERE user_id IN (
--     SELECT id FROM auth.users WHERE email IN ('eatfitbymax@gmail.com', 'm.pacullmarquie@gmail.com')
-- );
-- DELETE FROM auth.users WHERE email IN ('eatfitbymax@gmail.com', 'm.pacullmarquie@gmail.com');

-- Étape 2: Vérifier si le trigger existe et le recréer si nécessaire
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recréer la fonction
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, user_type)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), 
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Étape 3: Créer manuellement les utilisateurs avec des UUIDs générés
DO $$
DECLARE
    coach_id UUID := gen_random_uuid();
    client_id UUID := gen_random_uuid();
BEGIN
    -- Insérer le coach
    INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
    ) VALUES (
        coach_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'eatfitbymax@gmail.com',
        crypt('motdepasse123', gen_salt('bf')),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"name": "EatFitByMax Admin", "user_type": "coach"}',
        NOW(),
        NOW()
    ) ON CONFLICT (email) DO NOTHING;

    -- Insérer le client
    INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
    ) VALUES (
        client_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'm.pacullmarquie@gmail.com',
        crypt('motdepasse123', gen_salt('bf')),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"name": "M. Pacull Marquie", "user_type": "client"}',
        NOW(),
        NOW()
    ) ON CONFLICT (email) DO NOTHING;

    -- Créer les profils manuellement
    INSERT INTO profiles (user_id, name, user_type)
    SELECT 
        u.id,
        u.raw_user_meta_data->>'name',
        u.raw_user_meta_data->>'user_type'
    FROM auth.users u
    WHERE u.email IN ('eatfitbymax@gmail.com', 'm.pacullmarquie@gmail.com')
    ON CONFLICT (user_id) DO UPDATE SET
        name = EXCLUDED.name,
        user_type = EXCLUDED.user_type;

    RAISE NOTICE 'Comptes créés avec succès !';
    RAISE NOTICE 'Coach ID: %', coach_id;
    RAISE NOTICE 'Client ID: %', client_id;
    RAISE NOTICE 'Emails: eatfitbymax@gmail.com, m.pacullmarquie@gmail.com';
    RAISE NOTICE 'Mot de passe: motdepasse123';

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erreur: %', SQLERRM;
END $$;

-- Étape 4: Vérifier les résultats
SELECT 
    'VERIFICATION' as section,
    u.email,
    u.id,
    u.raw_user_meta_data,
    p.name,
    p.user_type,
    p.created_at
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE u.email IN ('eatfitbymax@gmail.com', 'm.pacullmarquie@gmail.com')
ORDER BY p.user_type DESC;
