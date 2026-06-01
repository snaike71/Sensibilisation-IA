# lhctrl. — Sensibilisation IA en entreprise

Plateforme de sensibilisation à l'IA pour les entreprises. Un admin uploade ses documents internes, l'IA génère des modules de formation personnalisés, et les collaborateurs les suivent via un système gamifié (XP, badges, classement).

## Stack

| Composant | Technologie |
|-----------|-------------|
| Frontend | Vite + React + Tailwind |
| Backend | Express.js (Node.js) |
| Base de données | Supabase (PostgreSQL + pgvector) |
| IA | Ollama (local) |
| RAG | pgvector + nomic-embed-text |

## Architecture

```
Frontend (Vite)  →  Backend (Express :3001)  →  Supabase (PostgreSQL)
                                              →  Ollama (:11434)
```

## Lancer le projet en local

### Prérequis
- Node.js 18+
- Ollama installé avec les modèles `gemma4` et `nomic-embed-text`

### 1. Variables d'environnement

Copier `.env.example` en `backend/.env` et remplir :

```
DATABASE_URL=postgresql://...
JWT_SECRET=...
```

### 2. Lancer le backend

```bash
cd backend
npm install
npm run dev
```

### 3. Lancer le frontend

```bash
npm install
npm run dev
```

Frontend disponible sur http://localhost:5173
Backend disponible sur http://localhost:3001

## Base de données

Schéma complet dans `db/init.sql` — à exécuter dans le SQL Editor de Supabase.

### Tables

| Table | Rôle |
|-------|------|
| `organisations` | Entreprises clientes (multi-tenant) |
| `usecases` | Cas d'usage IA recensés |
| `teams` | Équipes avec code d'accès |
| `collaborators` | Apprenants (XP, niveau, série) |
| `modules` | Modules de sensibilisation |
| `questions` | Questions générées par l'IA |
| `sessions` | Résultats des quiz |
| `documents` | Chunks de documents + embeddings (RAG) |

## API

### Auth
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/register` | Créer une organisation |
| POST | `/api/auth/login` | Connexion admin |

### Admin (token requis)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET/POST | `/api/usecases` | Cas d'usage |
| GET/POST | `/api/modules` | Modules |
| GET/POST | `/api/teams` | Équipes |
| GET | `/api/sessions` | Résultats |
| POST | `/api/documents` | Upload chunk + embedding |
| GET | `/api/documents/search` | Recherche vectorielle |

### Public
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/join` | Rejoindre une équipe via code |
| POST | `/api/sessions` | Sauvegarder un résultat de quiz |

## Équipe

| Dev | Rôle |
|-----|------|
| Dev 1 | Ollama + pipeline RAG |
| Dev 2 | Supabase + API Express |
| Dev 3 | Frontend React |
