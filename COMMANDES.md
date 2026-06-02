# Sensibilisation-IA — Commandes & Accès

## Accès

| Service | URL | Identifiants |
|---|---|---|
| Frontend local | http://localhost:8080 | voir comptes démo ci-dessous |
| Frontend prod | https://sensibilisation-ia.vercel.app | voir comptes démo ci-dessous |
| Backend local | http://localhost:3001 | — |
| Vercel dashboard | https://vercel.com | compte kevin.lapert617@gmail.com |
| Supabase | https://supabase.com | compte kevin.lapert617@gmail.com |
| ngrok dashboard | https://dashboard.ngrok.com | compte kevin.lapert617@gmail.com |

---

## Comptes de démo

### Compte Admin (accès panel de configuration)
- **Email** : admin@lhctrl.com
- **Mot de passe** : Admin2026!
- **Organisation** : LHCtrl Demo

### Compte Collaborateur (utilisateur standard)
- **Nom** : Jean Dupont
- **Email** : jean@lhctrl.com
- **Équipe** : Équipe RH
- **Code d'accès équipe** : QUIP-NFSV
- *(le collaborateur rejoint via code d'équipe, pas de mot de passe)*

---

## Démarrage complet (à faire à chaque session)

### 1 — Docker (backend + base de données)
```powershell
cd "c:\Users\snaik\code\cours\sensibilisationIA\Sensibilisation-IA"
docker compose up -d
```

### 2 — Ollama (avec accès réseau ouvert)
```powershell
Stop-Process -Name "ollama" -Force
# Attendre 2 secondes puis :
$env:OLLAMA_ORIGINS="*"; $env:OLLAMA_HOST="0.0.0.0"; & "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe" serve
```
Laisser ce terminal ouvert.

### 3 — Tunnel ngrok (URL permanente)
```powershell
ngrok http 3001 --url=incommunicable-rottenly-azzie.ngrok-free.dev --request-header-add "ngrok-skip-browser-warning:true"
```
Laisser ce terminal ouvert.

---

## Vercel — Variables d'environnement

| Variable | Valeur |
|---|---|
| VITE_API_BASE | https://incommunicable-rottenly-azzie.ngrok-free.dev |
| VITE_SUPABASE_URL | https://omivsuyzedmrthvnpaxa.supabase.co |
| VITE_SUPABASE_ANON_KEY | sb_publishable_o53-ADGum0gDm5lE4Oel2g_M7Chbb1C |

Après modification des variables → Redeploy sur Vercel.

---

## Docker — Commandes utiles

```powershell
# Démarrer tous les services
docker compose up -d

# Arrêter tous les services
docker compose down

# Arrêter ET supprimer la base de données (reset complet)
docker compose down -v

# Voir les logs du backend
docker logs sensibilisation-ia-backend-1 -f

# Voir les logs de la DB
docker logs sensibilisation-ia-db-1 -f

# Rebuild après modification du code backend
docker compose up --build -d backend

# Rebuild complet (frontend + backend)
docker compose up --build -d
```

---

## Base de données — Requêtes utiles

```powershell
# Lister les organisations (utilisateurs admin)
docker exec sensibilisation-ia-db-1 psql -U lhc -d lhcdb -c "SELECT id, nom, email_admin FROM organisations;"

# Lister les modules (configs quiz)
docker exec sensibilisation-ia-db-1 psql -U lhc -d lhcdb -c "SELECT titre, code, LEFT(contenu,50) FROM modules;"

# Lister les sessions (résultats quiz)
docker exec sensibilisation-ia-db-1 psql -U lhc -d lhcdb -c "SELECT * FROM sessions;"

# Compter les lignes par table
docker exec sensibilisation-ia-db-1 psql -U lhc -d lhcdb -c "SELECT 'organisations' as tbl, count(*) FROM organisations UNION ALL SELECT 'modules', count(*) FROM modules UNION ALL SELECT 'sessions', count(*) FROM sessions;"
```

---

## Ollama — Commandes utiles

```powershell
# Lister les modèles installés
curl.exe http://localhost:11434/api/tags

# Installer le modèle de génération
$env:LOCALAPPDATA\Programs\Ollama\ollama.exe pull gemma4:e2b

# Installer le modèle d'embedding (RAG)
$env:LOCALAPPDATA\Programs\Ollama\ollama.exe pull nomic-embed-text

# Tuer Ollama
Stop-Process -Name "ollama" -Force
```

---

## Git — Commandes utiles

```powershell
# Voir l'état
git status

# Récupérer les modifications de la collègue
git pull origin main

# Pousser ses modifications
git add .
git commit -m "description"
git push origin main
```

---

## Architecture du projet

```
[Browser]
    |
    ├── Vercel (frontend React/Vite) ──────────────────────────────┐
    |       VITE_API_BASE = URL ngrok                              |
    |                                                              ▼
    └── ngrok tunnel ──► backend:3001 (Docker) ──► PostgreSQL (Docker)
                                    |
                                    ├──► Ollama:11434 (local, proxy)
                                    └──► Supabase (RAG vectoriel)
```

### Rôle de chaque service
- **Frontend (Vercel)** : Interface React, quiz, admin panel
- **Backend (Docker:3001)** : API Express, auth JWT, config quiz, proxy Ollama
- **PostgreSQL (Docker)** : Organisations, modules, sessions, teams
- **Ollama (local)** : Génération IA (gemma4:e2b) + embeddings (nomic-embed-text)
- **Supabase** : Stockage vectoriel pour le RAG (PDF → embeddings)
- **ngrok** : Expose le backend local à Vercel via tunnel HTTPS
