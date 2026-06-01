CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS results (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  score INT NOT NULL,
  profil TEXT,
  reponses JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_config (
  id SERIAL PRIMARY KEY,
  company_name TEXT,
  sector TEXT,
  size TEXT,
  tools TEXT,
  context TEXT,
  situations JSONB,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Compte admin par défaut (mot de passe : lhc2026)
INSERT INTO users (email, name, password_hash, role)
VALUES ('admin@lhctrl.io', 'Admin LHC', '$2b$10$LiEPLZuGJbJzXSHOTzYNGOX8tDGexReSAHSgpTvkHKxbuZQJbPpIm', 'admin')
ON CONFLICT DO NOTHING;
