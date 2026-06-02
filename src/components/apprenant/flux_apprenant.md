
[Flux Apprenant]
[Écran 7 : Saisie Code] ➔ [Écran 8 : Tableau de bord] ➔ [Écran 9 : Quiz] ➔ [Écran 10 : Résultat]
                                ▲                                             │
                                └───────────────── Retour au parcours ────────┼─ (Bouton 1)
                                                                              │
                                └───────────────── Recommencer le quiz ───────┘ (Bouton 2)


🔍 Détail étape par étape
1. Éclat d'entrée : Connexion à l'équipe
Écran associé : JoinTeam (Écran 7)

Action de l'apprenant : L'utilisateur arrive sur une page d'accueil dédiée. Il doit saisir un code d'accès unique à 8 caractères (ex: CMRC-481) fourni par son référent RH.

Éléments clés : Un champ de saisie stylisé en monospace et un bouton d'action principal.

Transition : Le clic sur le bouton "Rejoindre l'équipe" valide l'accès et redirige l'apprenant vers son espace personnel.

2. Le Hub : Tableau de bord de progression
Écran associé : MyPath (Écran 8)

Action de l'apprenant : L'apprenant consulte son profil complet (ici au nom de Amélie Rousseau), suit ses statistiques globales (niveau, XP, badges, série de jours consécutifs) et sélectionne son activité.

Gestion des états des modules : * done (Terminé) : Module validé avec une icône de coche verte (ex: "Anonymiser avant de prompter").

current (En cours) : Module actif mis en valeur avec un bouton "Démarrer" (ex: "Prompt & confidentialité").

todo (À faire) : Modules verrouillés ou suivants.

Transition : Le clic sur le bouton "Démarrer" du module actif lance la phase d'évaluation.

3. L'Action : Évaluation gamifiée
Écran associé : Quiz (Écran 9)

Action de l'apprenant : L'utilisateur répond à une série de questions (ici la question 2 sur 5) basées sur un scénario métier concret lié à l'IA et à la confidentialité.

Mécanique d'interaction : * Lorsqu'il clique sur une option, l'interface affiche un retour visuel immédiat grâce aux états de QuizOption (correct en vert avec explication pédagogique, incorrect en rouge).

Une barre de progression supérieure affiche l'avancée (Q2 / 5) et les points cumulés (180 pts).

Transition : Après chaque validation, l'apprenant clique sur "Question suivante". Une fois la dernière question complétée, le système calcule le score global.

4. Le Bilan : Célébration & Choix
Écran associé : Result (Écran 10)

Action de l'apprenant : L'écran affiche un message de félicitations personnalisé, le score final sous forme de jauge circulaire (ici 80%), ainsi que les récompenses acquises (+120 XP et incrémentation de la série de jours consécutifs).

Fin de boucle (Aiguillage) : L'apprenant se retrouve face à deux choix stratégiques pour la suite de son parcours :

Bouton "Mon parcours" (Ghost CTA) : Renvoie l'utilisateur vers le tableau de bord (Écran 8), où le module passe à l'état done et le module suivant devient disponible.

Bouton "Recommencer" (Primary CTA) : Relance immédiatement le quiz (Écran 9) pour tenter d'améliorer son score.