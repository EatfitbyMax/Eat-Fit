
-- Politiques RLS complètes pour toutes les tables

-- Politiques pour les repas
CREATE POLICY "Les coachs peuvent gérer les repas de leurs programmes" ON meals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM nutrition_programs np 
      WHERE np.id = program_id AND np.coach_id = auth.uid()
    )
  );

CREATE POLICY "Les clients peuvent voir les repas de leurs programmes assignés" ON meals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM program_assignments pa 
      JOIN nutrition_programs np ON np.id = pa.program_id
      WHERE np.id = program_id 
      AND pa.client_id = auth.uid() 
      AND pa.program_type = 'nutrition'
      AND pa.status = 'active'
    )
  );

-- Politiques pour les programmes d'entraînement
CREATE POLICY "Les coachs peuvent gérer leurs programmes d'entraînement" ON workout_programs
  FOR ALL USING (auth.uid() = coach_id);

CREATE POLICY "Les clients peuvent voir leurs programmes d'entraînement assignés" ON workout_programs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM program_assignments pa 
      WHERE pa.program_id = id 
      AND pa.client_id = auth.uid() 
      AND pa.program_type = 'workout'
      AND pa.status = 'active'
    )
  );

-- Politiques pour les entraînements
CREATE POLICY "Les coachs peuvent gérer les entraînements de leurs programmes" ON workouts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workout_programs wp 
      WHERE wp.id = program_id AND wp.coach_id = auth.uid()
    )
  );

CREATE POLICY "Les clients peuvent voir les entraînements de leurs programmes assignés" ON workouts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM program_assignments pa 
      JOIN workout_programs wp ON wp.id = pa.program_id
      WHERE wp.id = program_id 
      AND pa.client_id = auth.uid() 
      AND pa.program_type = 'workout'
      AND pa.status = 'active'
    )
  );

-- Politiques pour les exercices
CREATE POLICY "Les coachs peuvent gérer les exercices de leurs entraînements" ON exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workouts w 
      JOIN workout_programs wp ON wp.id = w.program_id
      WHERE w.id = workout_id AND wp.coach_id = auth.uid()
    )
  );

CREATE POLICY "Les clients peuvent voir les exercices de leurs programmes assignés" ON exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM program_assignments pa 
      JOIN workout_programs wp ON wp.id = pa.program_id
      JOIN workouts w ON w.program_id = wp.id
      WHERE w.id = workout_id 
      AND pa.client_id = auth.uid() 
      AND pa.program_type = 'workout'
      AND pa.status = 'active'
    )
  );

-- Politiques pour les conversations
CREATE POLICY "Les utilisateurs peuvent voir leurs conversations" ON conversations
  FOR SELECT USING (auth.uid() = coach_id OR auth.uid() = client_id);

CREATE POLICY "Les coachs peuvent créer des conversations avec des clients" ON conversations
  FOR INSERT WITH CHECK (
    auth.uid() = coach_id AND 
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND user_type = 'coach')
  );

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs conversations" ON conversations
  FOR UPDATE USING (auth.uid() = coach_id OR auth.uid() = client_id);

-- Politiques pour les messages
CREATE POLICY "Les utilisateurs peuvent voir les messages de leurs conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c 
      WHERE c.id = conversation_id 
      AND (c.coach_id = auth.uid() OR c.client_id = auth.uid())
    )
  );

CREATE POLICY "Les utilisateurs peuvent envoyer des messages dans leurs conversations" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations c 
      WHERE c.id = conversation_id 
      AND (c.coach_id = auth.uid() OR c.client_id = auth.uid())
    )
  );

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs messages reçus" ON messages
  FOR UPDATE USING (auth.uid() = receiver_id);

-- Politiques pour les affectations de programmes
CREATE POLICY "Les coachs peuvent gérer leurs affectations" ON program_assignments
  FOR ALL USING (auth.uid() = coach_id);

CREATE POLICY "Les clients peuvent voir leurs affectations" ON program_assignments
  FOR SELECT USING (auth.uid() = client_id);

-- Fonction pour créer automatiquement un profil après inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Déclencheur pour créer automatiquement un profil
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
