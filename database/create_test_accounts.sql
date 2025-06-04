
-- Script pour créer les comptes de test
-- À exécuter dans l'éditeur SQL de Supabase

-- Note: Ces comptes seront créés avec des mots de passe temporaires
-- Les utilisateurs devront les changer lors de leur première connexion

DO $$
DECLARE
    admin_user_id UUID;
    client_user_id UUID;
BEGIN
    -- Créer le compte administrateur (coach)
    -- Note: En production, utilisez des mots de passe plus sécurisés
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        invited_at,
        confirmation_token,
        confirmation_sent_at,
        recovery_token,
        recovery_sent_at,
        email_change_token_new,
        email_change,
        email_change_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        phone,
        phone_confirmed_at,
        phone_change,
        phone_change_token,
        phone_change_sent_at,
        email_change_token_current,
        email_change_confirm_status,
        banned_until,
        reauthentication_token,
        reauthentication_sent_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'eatfitbymax@gmail.com',
        crypt('motdepasse123', gen_salt('bf')), -- Mot de passe: motdepasse123
        NOW(),
        NULL,
        '',
        NULL,
        '',
        NULL,
        '',
        '',
        NULL,
        NULL,
        '{"provider": "email", "providers": ["email"]}',
        '{"name": "EatFitByMax Admin", "user_type": "coach"}',
        FALSE,
        NOW(),
        NOW(),
        NULL,
        NULL,
        '',
        '',
        NULL,
        '',
        0,
        NULL,
        '',
        NULL
    ) RETURNING id INTO admin_user_id;

    -- Créer le compte client
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        invited_at,
        confirmation_token,
        confirmation_sent_at,
        recovery_token,
        recovery_sent_at,
        email_change_token_new,
        email_change,
        email_change_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        phone,
        phone_confirmed_at,
        phone_change,
        phone_change_token,
        phone_change_sent_at,
        email_change_token_current,
        email_change_confirm_status,
        banned_until,
        reauthentication_token,
        reauthentication_sent_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'm.pacullmarquie@gmail.com',
        crypt('motdepasse123', gen_salt('bf')), -- Mot de passe: motdepasse123
        NOW(),
        NULL,
        '',
        NULL,
        '',
        NULL,
        '',
        '',
        NULL,
        NULL,
        '{"provider": "email", "providers": ["email"]}',
        '{"name": "M. Pacull Marquie", "user_type": "client"}',
        FALSE,
        NOW(),
        NOW(),
        NULL,
        NULL,
        '',
        '',
        NULL,
        '',
        0,
        NULL,
        '',
        NULL
    ) RETURNING id INTO client_user_id;

    -- Les profils seront créés automatiquement grâce au trigger
    RAISE NOTICE 'Comptes créés avec succès:';
    RAISE NOTICE 'Admin ID: %', admin_user_id;
    RAISE NOTICE 'Client ID: %', client_user_id;
    RAISE NOTICE 'Mot de passe pour les deux comptes: motdepasse123';

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erreur lors de la création des comptes: %', SQLERRM;
END $$;
