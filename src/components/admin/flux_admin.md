🧭 Vue d'ensemble du flux Admin
Plaintext
[Écran 1 : Choix du Rôle] ➔ Sélection "Espace Admin"
       │
       ▼
[Écran 2 : Onboarding unique]
  ├── Étape 1 : Profil Entreprise
  ├── Étape 2 : Outils & Maturité IA
  ├── Étape 3 : Cartographie des Cas d'usage
  └── Étape 4 : Récapitulatif ➔ [Déclencheur : Génération IA des modules]
       │
       ▼
[Espace de Pilotage Core] ◄────────────────────────────────────────┐
  ├── Écran 3 : Vue d'ensemble (KPIs & Maturité)                   │ Navigation
  ├── Écran 4 : Cas d'usage (Analyse des risques & Recos IA)       │ via la Sidebar
  ├── Écran 5 : Modules (Gestion & Assignation)                     │ persistante
  └── Écran 6 : Équipes (Génération & Partage des codes d'accès) ───┘

🔍 Détail étape par étape
Phase 1 : Orientation initiale
Écran associé : RoleSelect (Écran 1)

Action : L'utilisateur choisit sa porte d'entrée.

Transition : Le clic sur la carte principale "Espace Admin" lance le processus de configuration pour les RH / Référents IA.

Phase 2 : Onboarding et Configuration (Écran 2)
Le composant OnboardFrame gère un tunnel linéaire de collecte de données indispensable pour personnaliser l'expérience.

Étape 1 — Votre entreprise (Onboard1) : Saisie de l'identité de l'organisation (Nom, Secteur, Taille, Email du référent). Action : Continuer.

Étape 2 — Maturité IA (Onboard2) : Sélection multi-critères des outils déjà présents (ChatGPT, Claude, etc.) et auto-évaluation du niveau de gouvernance (Émergent, En structuration, Mature). Action : Continuer.

Étape 3 — Cas d'usage IA (Onboard3) : Déclaration des usages réels sur le terrain (ex: "Analyse de CV via IA"), ciblage de l'équipe, et qualification des risques perçus. Les cas s'ajoutent à une liste dynamique. Action : Continuer.

Étape 4 — Récapitulatif (Onboard4) : Revue globale des données. Un encart sombre indique le plan d'action automatisé : "L'IA va générer 5 modules personnalisés".

Le point de bascule : Le clic sur "Générer mes modules" compile les données et déverrouille l'accès à l'application de pilotage.

Phase 3 : Le Hub de Gestion & Pilotage (Écrans 3 à 6)
Une fois l'onboarding terminé, l'administrateur navigue librement à travers une interface à deux colonnes contrôlée par la AdminSidebar (qui affiche en continu un score global de maturité IA de l'organisation, fixé ici à 58/100).

📊 Écran 3 — Tableau de bord (Dashboard)
Objectif : Obtenir une vue macro de la santé de l'entreprise face à l'IA.

Données clés : 4 cartes KPI (Collaborateurs, % de modules suivis, cas d'usage recensés, score moyen) et un graphique en barres horizontales mesurant la maturité IA par département (Direction, Commercial, RH, etc.).

Flux sortant : Boutons pour exporter les rapports ou déployer de nouvelles campagnes.

💡 Écran 4 — Cas d'usage IA (UseCases)
Objectif : Analyser les risques métiers identifiés lors de l'onboarding ou saisis à la volée.

Données clés : Liste de cartes (UseCaseCard) triées par niveau de criticité (Élevé, Modéré, Faible). Chaque carte propose une Recommandation générée par l'IA.

Flux sortant : Un bouton d'action contextuel "Générer module" permet de créer instantanément une formation sur-mesure pour contrer le risque détecté.

🧠 Écran 5 — Modules de formation (Modules)
Objectif : Manager le catalogue de formation de l'entreprise.

Données clés : Grille affichant les modules de sensibilisation. Les modules créés automatiquement portent un badge "PERSONNALISÉ" (ex: MOD-01 : Anonymiser avant de prompter).

Flux sortant : Possibilité de prévisualiser le contenu ou de cliquer sur "Assigner" pour l'envoyer à une équipe cible.

👥 Écran 6 — Gestion des Équipes (Teams)
Objectif : Créer des silos par département et distribuer les accès.

Données clés : Liste des groupes avec le compte des collaborateurs rattachés.

Le point de contact avec le parcours Apprenant : Chaque équipe affiche un Code d'accès exclusif encadré (ex: CMRC-481 pour l'équipe Commerciale).

Flux sortant : L'admin copie ou envoie ce code par email. C'est ce code précis que le collaborateur devra saisir à l'Écran 7 (JoinTeam) du parcours apprenant pour commencer sa formation.