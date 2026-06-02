# 🇫🇷 Examen Civique

Application web (100 % en français) pour s'entraîner à l'**examen civique** français,
exigé pour une première demande de titre de séjour pluriannuel ou de carte de résident.

> ⚠️ Outil d'entraînement **non officiel**. Les énoncés des questions proviennent des
> listes officielles publiées par le ministère de l'Intérieur sur
> [formation-civique.interieur.gouv.fr](https://formation-civique.interieur.gouv.fr/).
> Les propositions de réponses sont générées à titre pédagogique et ne constituent
> pas le corrigé officiel (les réponses ne sont pas publiées par l'administration).

## Fonctionnalités

1. **📚 Mode révision** (`/reviser`)
   Parcourez les **366 questions** des deux listes officielles (CSP et CR),
   filtrez par **thématique**, par **liste**, recherchez un mot-clé et révélez la
   bonne réponse avec son explication.

2. **🎯 Mode quiz** (`/quiz`)
   Un quiz façon *trivia* : choisissez une thématique et un nombre de questions,
   répondez une par une avec retour immédiat, barre de progression, puis obtenez
   votre **score** et un **récapitulatif** détaillé.

## Les 5 thématiques

- 🇫🇷 Principes et valeurs de la République
- 🏛️ Système institutionnel et politique
- ⚖️ Droits et devoirs
- 📜 Histoire, géographie et culture
- 🤝 Vivre dans la société française

## Stockage des données

Les données sont **statiques et en lecture seule**. Le plus simple et le plus
performant est donc un **fichier JSON embarqué** (`src/data/questions.json`),
chargé au build — pas besoin de base de données ni de SQLite. Cela permet un
déploiement 100 % statique sur n'importe quel hébergeur (Vercel, Netlify, GitHub
Pages…). Chaque question contient :

```json
{
  "id": 1,
  "q": "À quoi correspond la date du 14 juillet ?",
  "theme": "Principes et valeurs de la République",
  "themeSlug": "principes",
  "lists": ["CSP"],
  "options": ["…", "…", "…", "…"],
  "correct": 0,
  "explanation": "…"
}
```

## Stack technique

- [Next.js 16](https://nextjs.org/) (App Router) + React 19
- TypeScript
- Tailwind CSS v4

## Développement

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de production
npm run start    # sert le build de production
```

## Déploiement

Le projet se déploie tel quel sur **Vercel** (recommandé pour Next.js) : importez
le dépôt, aucune variable d'environnement n'est requise.

## Licence & avertissement

Projet éducatif. Les énoncés appartiennent au ministère de l'Intérieur. Vérifiez
toujours les informations officielles sur le site du gouvernement.
