# 💞 Équilibre couple – calculateur

Équilibre couple est une application web qui aide deux partenaires à répartir équitablement leurs dépenses communes en tenant compte de leurs salaires nets et des avantages en tickets restaurant. Le calculateur permet d'estimer la contribution mensuelle de chacun, de visualiser le détail des calculs et de partager facilement le résultat avec l'autre personne.

## Fonctionnalités principales

- Paramètres de saisie simples : salaires nets, tickets restaurant et budget commun.
- Mode avancé pour préciser le pourcentage de tickets réellement dépensés, les dépenses éligibles et ajuster manuellement le prorata.
- Résumé visuel du montant à déposer par chacun et du cash nécessaire pour équilibrer le budget.
- Détail complet des calculs et avertissements lorsque les entrées ne sont pas cohérentes.
- Sauvegarde automatique dans le navigateur et génération de liens partageables.
- Impression ou export PDF en un clic et bascule clair/sombre.

## Aperçu rapide

L'interface principale se compose d'un formulaire de paramètres, d'un encart de synthèse et d'un bloc de détails :

1. Renseignez les salaires nets et, si pertinent, les montants de tickets restaurant.
2. Activez le *mode avancé* pour saisir les dépenses éligibles supplémentaires ou affiner le prorata via le curseur « Favoriser A/B ».
3. Consultez les cartes « Synthèse » et « Détails » pour connaître la contribution totale de chacun et la répartition proposée.
4. Utilisez les boutons situés en haut à droite pour copier un lien partageable, imprimer/exporter en PDF, réinitialiser les paramètres ou activer le thème sombre.

## Prérequis

- [Node.js](https://nodejs.org/) 18 ou plus.
- [npm](https://www.npmjs.com/) (fourni avec Node.js) pour gérer les dépendances.

## Démarrage rapide

```bash
npm install
npm run dev
```

Ouvrez ensuite http://localhost:5173 dans votre navigateur pour interagir avec l'application en développement.

### Scripts disponibles

| Commande        | Description                                               |
|-----------------|-----------------------------------------------------------|
| `npm run dev`   | Lance le serveur de développement Vite avec rechargement. |
| `npm run build` | Génère la version de production dans le dossier `dist`.    |
| `npm test`      | Exécute la suite de tests.                                |
| `npm run lint`* | (Optionnel) Lance le linter si configuré.                 |

\*La commande `npm run lint` n'est pas fournie par défaut mais peut être ajoutée selon les besoins.

## Déploiement

Le projet est prêt pour un déploiement sur Netlify :

1. Connectez le dépôt GitHub à Netlify.
2. Configurez la commande de build sur `npm run build`.
3. Définissez le dossier de publication sur `dist`.

Une fois la build terminée, l'URL Netlify générée peut être partagée directement dans la section « About » du dépôt GitHub.

## Stack technique

- [React](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) pour le bundling et le serveur de développement.
- [Tailwind CSS](https://tailwindcss.com/) pour le style et les composants utilitaires.

## Contribution

Les contributions sont bienvenues. Merci de proposer vos améliorations via des issues ou des pull requests. Pensez à lancer les tests avant de soumettre votre PR :

```bash
npm test
```

## Licence

Ce projet est publié sous licence [MIT](LICENSE).
