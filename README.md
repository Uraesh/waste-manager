# 🗑️ Waste Manager

Une application complète de gestion des déchets et des missions de collecte, construite avec Next.js, TypeScript et Supabase.

## 🌟 Fonctionnalités

### Gestion des Demandes
- 📋 Création et suivi des demandes de collecte
- 🎯 Attribution des missions au personnel
- 📊 Filtrage avancé par statut, priorité et type
- 📱 Interface responsive pour tous les appareils

### Types de Services
- 🗑️ **Ramassage** : Collecte régulière des déchets
- ♻️ **Recyclage** : Gestion des matériaux recyclables
- ⚠️ **Déchets Spéciaux** : Traitement des déchets dangereux
- 🚨 **Urgence** : Interventions rapides

### Gestion Multi-Rôles
- 👤 **Clients** : Soumettre et suivre leurs demandes
- 👷 **Personnel** : Gérer leurs missions assignées
- 👨‍💼 **Administrateurs** : Superviser l'ensemble du système

### Caractéristiques Techniques
- 🔐 Authentification sécurisée avec Supabase
- 📍 Géolocalisation des missions
- 📅 Planification avec dates et horaires
- 🔔 Système de notifications en temps réel
- 💳 Gestion des paiements intégrée

## 🚀 Installation

### Prérequis
- Node.js 18+ 
- npm ou yarn
- Compte Supabase

### Étapes d'installation

1. **Cloner le repository**
```bash
git clone https://github.com/votre-repo/waste-manager.git
cd waste-manager
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**
Créez un fichier `.env.local` :
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

4. **Lancer le serveur de développement**
```bash
npm run dev
```

5. **Ouvrir l'application**
Navigatez vers [http://localhost:3000](http://localhost:3000)

## 📋 Configuration de la Base de Données

Le projet utilise Supabase avec les tables suivantes :

- `missions` : Demandes de collecte
- `clients` : Informations clients
- `staff_profiles` : Profils du personnel
- `users` : Utilisateurs authentifiés
- `payments` : Gestion des paiements
- `notifications` : Système de notifications

### Scripts SQL
Les scripts de création des tables sont disponibles dans `src/scripts/`.

## 🛠️ Stack Technique

### Frontend
- **Next.js 14** - Framework React
- **TypeScript** - Typage statique
- **Tailwind CSS** - Styling
- **Shadcn/ui** - Composants UI

### Backend
- **Supabase** - Base de données et authentification
- **PostgreSQL** - Base de données relationnelle
- **API Routes** - Endpoints Next.js

### Outils de Développement
- **ESLint** - Linting
- **TypeScript** - Vérification de types
- **PostCSS** - Traitement CSS

## 📁 Structure du Projet

```
src/
├── app/                    # Pages Next.js
│   ├── api/               # API Routes
│   └── dashboard/         # Pages du tableau de bord
├── components/            # Composants React
│   ├── ui/               # Composants UI génériques
│   ├── request-management/ # Gestion des demandes
│   ├── staff-management/   # Gestion du personnel
│   └── navigation/       # Navigation
├── lib/                   # Utilitaires
│   ├── supabase/         # Configuration Supabase
│   └── hooks/            # Hooks personnalisés
├── types/                # Définitions TypeScript
│   ├── supabase.ts       # Types générés
│   ├── api.types.ts      # Types API
│   └── database.types.ts # Types base de données
└── scripts/              # Scripts SQL
```

## 🎯 Ce qui Reste à Faire

### 🚧 Fonctionnalités en Cours
- [ ] Système de chat en temps réel entre clients et personnel
- [ ] Intégration complète du paiement en ligne (Stripe/PayPal)
- [ ] Système de notation et d'avis
- [ ] Export des rapports PDF
- [ ] Notifications push mobile

### 🔧 Améliorations Techniques
- [ ] Tests unitaires et d'intégration
- [ ] CI/CD avec GitHub Actions
- [ ] Monitoring et analytics
- [ ] Optimisation des performances
- [ ] Documentation API avec Swagger

### 🌟 Fonctionnalités Futures
- [ ] Application mobile native (React Native)
- [ ] Tableau de bord analytics avancé
- [ ] Planification intelligente des tournées
- [ ] Intégration avec des capteurs IoT
- [ ] Système de fidélité client

## 🤝 Contribution

Les contributions sont les bienvenues ! 

1. Forkez le projet
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Commitez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Pushez vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 🐛 Signalement de Bugs

Si vous trouvez un bug, merci d'ouvrir une issue avec :
- Une description détaillée du problème
- Les étapes pour reproduire
- Votre environnement (OS, navigateur, version)
- Des captures d'écran si pertinent

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 👥 Contact

Pour toute question ou suggestion :
- Email : contact@wastemanager.com
- LinkedIn : [Votre Profil]
- Twitter : [@VotreCompte]

---

**⭐ Si ce projet vous est utile, n'hésitez pas à lui donner une étoile !**
