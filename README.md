# TSARALAZA Restaurant App

Application de gestion de restaurant — React + Node.js/Express + MySQL.

## Structure

```
restaurant-app/
├── backend/       → Express API
├── frontend/      → React (Vite)
├── database/      → Scripts SQL
└── package.json   → Scripts racine
```

## Développement local

```bash
# Backend
cd backend
cp .env.example .env   # remplir les variables
npm install
npm run dev

# Frontend (autre terminal)
cd frontend
npm install
npm run dev
```

## Déploiement sur Render

1. Push le repo sur GitHub
2. Aller sur render.com → New → Web Service
3. Connecter le repo GitHub
4. Configurer :
   - **Root Directory** : laisser vide
   - **Build Command** : `npm run build`
   - **Start Command** : `npm run start`
5. Ajouter les variables d'environnement (voir `.env.example`)
6. Deploy !

## Variables d'environnement (Render)

Voir `.env.example` pour la liste complète.
Ne jamais commiter le fichier `.env`.
