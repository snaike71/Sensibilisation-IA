-- Schéma Supabase — lhctrl. Sensibilisation IA
-- À exécuter dans le SQL Editor de Supabase

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS organisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  email_admin text UNIQUE NOT NULL,
  password_hash text,
  secteur text,
  taille text,
  outils_ia text[],
  maturite text,
  statut_onboarding text DEFAULT 'En cours',
  plan text DEFAULT 'Essai',
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS usecases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organisations(id) ON DELETE CASCADE,
  intitule text NOT NULL,
  description text,
  equipe text,
  outil_ia text,
  frequence text,
  risques text[],
  niveau_risque text,
  recommandation text,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organisations(id) ON DELETE CASCADE,
  nom text NOT NULL,
  code_acces text UNIQUE NOT NULL,
  description text,
  nb_collaborateurs integer DEFAULT 0,
  statut text DEFAULT 'Active',
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organisations(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id),
  nom text,
  email text,
  role text,
  xp integer DEFAULT 0,
  niveau integer DEFAULT 1,
  serie_jours integer DEFAULT 0,
  date_inscription timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organisations(id) ON DELETE CASCADE,
  titre text NOT NULL,
  code text,
  description text,
  categorie text DEFAULT 'Fondamentaux',
  niveau text DEFAULT 'intermediate',
  duree_min integer DEFAULT 12,
  equipes_ciblees text,
  contenu text,
  statut text DEFAULT 'active',
  personnalise boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES modules(id) ON DELETE CASCADE,
  type text,
  difficulty text,
  question text,
  options text[],
  correct integer,
  explanation text,
  concept text
);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organisations(id) ON DELETE CASCADE,
  collaborator_id uuid REFERENCES collaborators(id),
  module_id uuid REFERENCES modules(id),
  score integer,
  total_questions integer,
  xp_gagne integer,
  duree_min integer,
  concepts_maitrises text,
  date timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organisations(id) ON DELETE CASCADE,
  filename text,
  chunk text,
  embedding vector(768),
  created_at timestamp DEFAULT now()
);

-- RLS
-- Le rôle 'anon' est natif de Supabase ; on le crée s'il n'existe pas (Postgres local Docker)
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
END $$;

ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE usecases ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deny_all" ON organisations FOR ALL TO anon USING (false);
CREATE POLICY "deny_all" ON usecases FOR ALL TO anon USING (false);
CREATE POLICY "deny_all" ON teams FOR ALL TO anon USING (false);
CREATE POLICY "deny_all" ON collaborators FOR ALL TO anon USING (false);
CREATE POLICY "deny_all" ON modules FOR ALL TO anon USING (false);
CREATE POLICY "deny_all" ON questions FOR ALL TO anon USING (false);
CREATE POLICY "deny_all" ON sessions FOR ALL TO anon USING (false);
CREATE POLICY "deny_all" ON documents FOR ALL TO anon USING (false);
