// Scénarios par défaut du kit LHC — format thème + questions
export const situations = [
  {
    id: 1,
    categorie: 'possibilite',
    titre: 'Automatiser intelligemment',
    description: "Votre organisation dispose d'outils IA validés par la DSI. Certaines tâches peuvent y être déléguées, d'autres non.",
    questions: [
      {
        id: '1-1',
        type: 'drag',
        texte: "Votre manager vous demande un résumé de 40 pages de rapports sectoriels pour dans 2 heures. Vous avez d'autres dossiers urgents en parallèle.",
        bonneReponse: 'ia',
        explication: "Résumer des documents volumineux est une tâche chronophage à faible risque — déléguer à l'IA vous libère pour les décisions à valeur ajoutée. Relisez simplement le résultat avant de l'envoyer.",
      },
      {
        id: '1-2',
        type: 'mcq',
        texte: "Laquelle de ces tâches est la plus adaptée à une délégation à l'IA sans risque ?",
        options: [
          "Signer un contrat client au nom de l'entreprise",
          "Résumer des notes de réunion internes sans données sensibles",
          "Décider du licenciement d'un employé à partir d'une analyse IA",
          "Transmettre des données RH à un outil IA grand public",
        ],
        bonneReponse: 'B',
        explication: "Résumer des notes sans données sensibles est un usage idéal de l'IA : gain de temps, risque nul. Les autres options engagent la responsabilité humaine ou exposent des données confidentielles.",
      },
      {
        id: '1-3',
        type: 'free',
        texte: "Dans votre quotidien, citez une tâche que vous pourriez déléguer à l'IA cette semaine et expliquez pourquoi c'est sans risque.",
        modelAnswer: "Les tâches idéales sont répétitives, à faible enjeu décisionnel et sans données sensibles : rédiger un premier jet d'email, reformuler un texte, résumer un document public, créer une FAQ à partir de contenu existant.",
        explication: "Le critère clé : peut-on relire et corriger le résultat avant de l'utiliser ? Si oui, l'IA est un accélérateur. Si la tâche engage une responsabilité directe, l'humain doit rester maître.",
      },
    ],
  },
  {
    id: 2,
    categorie: 'danger',
    titre: 'Données sensibles et IA grand public',
    description: "L'usage d'outils IA grand public (ChatGPT, Gemini…) non validés par la DSI présente des risques réels pour la confidentialité.",
    questions: [
      {
        id: '2-1',
        type: 'drag',
        texte: "Pour aller plus vite, vous copiez-collez un contrat client confidentiel dans ChatGPT afin qu'il vous en fasse un résumé structuré.",
        bonneReponse: 'humain',
        explication: "Les données collées dans un outil grand public peuvent quitter le périmètre de votre entreprise définitivement. Utilisez uniquement des solutions validées par votre DSI.",
      },
      {
        id: '2-2',
        type: 'mcq',
        texte: "Parmi ces données, laquelle est acceptable à coller dans un outil IA grand public non validé par votre DSI ?",
        options: [
          "Un contrat client avec données personnelles",
          "Le texte d'une loi publique disponible sur Légifrance",
          "Un tableau Excel de salaires internes",
          "Un email contenant les coordonnées d'un client",
        ],
        bonneReponse: 'B',
        explication: "Seules les données publiques peuvent être utilisées librement. Les données personnelles, financières ou confidentielles ne doivent jamais transiter par un outil non homologué.",
      },
      {
        id: '2-3',
        type: 'free',
        texte: "Un collègue vous montre qu'il utilise ChatGPT pour rédiger des comptes-rendus RH complets. Que lui répondez-vous ?",
        modelAnswer: "Je lui explique que les données RH (salaires, évaluations, données personnelles) sont soumises au RGPD. Les coller dans un outil grand public risque de les exposer en dehors du périmètre de l'entreprise. Je lui propose d'utiliser les outils validés par la DSI ou de travailler avec des données anonymisées.",
        explication: "La règle d'or : avant d'utiliser un outil IA, demandez-vous si les données traitées pourraient causer un préjudice si elles sortaient de l'entreprise.",
      },
    ],
  },
  {
    id: 3,
    categorie: 'cyber',
    titre: 'Fraudes et deepfakes IA',
    description: "L'IA générative permet d'imiter des styles d'écriture, des voix et des visages. Les tentatives de fraude deviennent de plus en plus sophistiquées.",
    questions: [
      {
        id: '3-1',
        type: 'drag',
        texte: "Vous recevez un email de votre PDG vous demandant de virer 15 000 € en urgence sur un nouveau compte fournisseur. Le ton ressemble parfaitement à ses mails habituels.",
        bonneReponse: 'humain',
        explication: "Les deepfakes textuels imitent parfaitement le style d'écriture. Toute demande financière urgente par email doit être vérifiée par un second canal (appel, Slack, en face-à-face).",
      },
      {
        id: '3-2',
        type: 'mcq',
        texte: "Vous recevez un message vocal de votre directeur demandant ses identifiants en urgence. Que faites-vous ?",
        options: [
          "Vous transmettez les identifiants par SMS pour aller vite",
          "Vous raccrochez et rappelez le directeur sur son numéro officiel connu",
          "Vous envoyez les identifiants par email chiffré",
          "Vous demandez un code secret par message vocal pour vérifier",
        ],
        bonneReponse: 'B',
        explication: "Les clones vocaux IA sont accessibles en quelques minutes. La seule défense fiable : raccrocher et rappeler sur un numéro connu et officiel, jamais sur celui de l'appelant.",
      },
      {
        id: '3-3',
        type: 'free',
        texte: "Comment expliquez-vous à un collègue non technique la différence entre un vrai email de la direction et un deepfake textuel généré par IA ?",
        modelAnswer: "Un deepfake textuel imite parfaitement le style d'écriture, la signature et le ton. Les signes d'alerte ne sont pas dans la forme mais dans le contexte : demande urgente, inhabituelle, non annoncée, avec pression temporelle. La règle : toute demande urgente hors procédure normale doit être vérifiée par un canal différent (appel téléphonique sur numéro connu).",
        explication: "L'IA peut cloner un style d'écriture en analysant quelques emails. L'urgence et la pression sont des signaux d'alarme, pas la qualité rédactionnelle.",
      },
    ],
  },
]
