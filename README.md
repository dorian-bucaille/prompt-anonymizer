# 🛡️ Anonymiseur de prompts

Cette application React + TypeScript transforme le projet « Équilibre couple » en un anonymiseur de prompts 100 % client-side. Elle détecte des informations personnelles (PII) grâce à des heuristiques locales, propose des remplacements réalistes et vous permet de copier un texte propre prêt pour un LLM en un clic.

## Fonctionnalités clés

- **Détection automatique** des personnes, entreprises, lieux, emails, téléphones et identifiants structurés via regex et listes statiques.
- **Remplacement cohérent** : une même entité garde la même anonymisation sur tout le texte, quelle que soit la longueur du prompt.
- **Prévisualisation immédiate** : surlignage des entités détectées, mise à jour du texte anonymisé en temps réel et compteur de caractères.
- **Édition fine** : changement de type, suppression ou ajout manuel d'entités, génération de nouveaux remplacements, styles variés (prénoms FR, neutres, labels génériques).
- **Mode debug** pour inspecter la liste des entités, le mapping original → anonymisé et la diff entre les textes.
- **Respect de la vie privée** : aucune donnée du texte n'est persistée. Seules les préférences (types activés, style, mode debug) sont conservées dans `localStorage`.

## Prise en main rapide

1. Collez votre prompt dans la zone « Texte original » : la détection démarre immédiatement.
2. Vérifiez les entités surlignées et ajustez-les dans le tableau si nécessaire.
3. Le texte anonymisé se met à jour automatiquement dans le panneau de droite : copiez-le quand vous êtes satisfait.
4. Utilisez les paramètres pour activer/désactiver des types de PII, choisir un style de remplacement ou régénérer toutes les valeurs.
5. Activez le mode debug pour investiguer un cas particulier ou comprendre la logique d'anonymisation.

## Scripts

| Commande        | Description                                                |
|-----------------|------------------------------------------------------------|
| `npm run dev`   | Lance Vite en mode développement avec rechargement à chaud. |
| `npm run build` | Produit la version optimisée dans `dist`.                   |
| `npm test`      | Exécute la suite Vitest (détection, mapping, performances). |
| `npm run lint`  | Vérifie les règles ESLint/TypeScript du projet.             |

## Développement

```bash
npm install
npm run dev
```

Rendez-vous ensuite sur http://localhost:5173 pour utiliser l'application. Le code est écrit avec React + TypeScript, Vite, Tailwind CSS et un petit hook de persistance (`usePersistedState`).

## Déploiement

Le projet est prêt pour Netlify :

1. Connectez le dépôt GitHub.
2. Commande de build : `npm run build`.
3. Dossier de publication : `dist`.

Netlify se charge du reste et fournit une URL partageable.

## Licence

Ce projet est distribué sous licence [MIT](LICENSE).
