# prompt-anonymizer

Petit projet client-side qui permet d'anonymiser / générer des données (prénoms, villes, types de rue, ...) pour des démonstrations, du prototypage ou des tests front-end.

## Description

Le projet contient une simple application web (fichiers `index.html` et `app.js`) qui utilise des données JSON locales situées dans le dossier `data/` pour générer ou anonymiser des informations françaises courantes : prénoms, villes et types de rues.

Objectifs :
- Fournir un outil léger, sans dépendances serveur, pour simuler des données anonymisées.
- Rester simple à exécuter (ouvrir `index.html` ou lancer un petit serveur statique).
- Faciliter l'extension en ajoutant de nouvelles sources JSON.

## Contenu du dépôt

- `index.html` — page principale de l'application.
- `app.js` — logique JavaScript côté client.
- `data/` — jeux de données JSON utilisés par l'application :
  - `firstnames-fr-common.json` — prénoms français courants.
  - `cities-fr-common.json` — villes françaises courantes.
  - `streets-fr-types.json` — types de voies (rue, avenue, etc.).
- `LICENSE` — licence du projet.
- `README.md` — ce fichier.

## Technologies

- HTML, CSS (si présent dans `index.html`) et JavaScript côté client.
- Données statiques JSON.

Aucune dépendance côté serveur n'est nécessaire pour l'utilisation basique.

## Installation et exécution

Option 1 — Ouvrir directement (mode développement rapide) :
- Ouvrir `index.html` dans un navigateur (double-clic ou "Ouvrir avec" -> navigateur).
  - Remarque : certains navigateurs restreignent l'accès aux fichiers locaux (CORS). Si l'application lit les JSON via fetch, il sera nécessaire de lancer un serveur local.

Option 2 — Lancer un petit serveur statique (recommandé) :
- Avec Python 3 (port 8000) :
  - Ouvrir un terminal dans le dossier du projet et exécuter :
    - `python -m http.server 8000`
  - Puis ouvrir `http://localhost:8000` dans le navigateur.
- Avec npx http-server :
  - `npx http-server . -p 8000`
  - Puis ouvrir `http://localhost:8000`.

Ces commandes servent uniquement à exposer les fichiers statiques pour que les requêtes fetch fonctionnent correctement dans tous les navigateurs.

## Utilisation

- L'interface d'exemple dans `index.html` permet de :
  - Charger des prénoms/ville/type de rue depuis `data/`.
  - Générer un jeu de données anonymisé.
  - (Comportement exact dépendant de l'implémentation dans `app.js`.)

Usage recommandé :
- Cette application est pensée pour être utilisée avant d'envoyer à des LLM (par ex. ChatGPT) des prompts contenant des informations potentiellement sensibles. Son objectif est de protéger la vie privée en anonymisant localement les données (noms, adresses, téléphones, etc.) présentes dans vos prompts.
- Traitement local : toute l'anonymisation s'effectue côté client dans le navigateur — aucune donnée n'est envoyée sur le réseau par défaut.
- Démo en ligne : l'application est déployée sur https://prompt-anonymizer.netlify.app/ (capture d'écran fournie dans la revue du projet).

Consulter et modifier `app.js` pour adapter la logique d'anonymisation (par ex. règles de remplacement, format de sortie, taille des jeux de données).

## Structure des données

Les fichiers JSON dans `data/` contiennent des listes/objets simples. Exemple typique :
- `firstnames-fr-common.json` : tableau de chaînes (prénoms).
- `cities-fr-common.json` : tableau de chaînes (noms de villes).
- `streets-fr-types.json` : tableau de chaînes (types de voie).

Vous pouvez remplacer ou étendre ces fichiers par vos propres jeux de données (respectez les mêmes structures pour éviter les erreurs côté client).

## Développement

- Éditez `index.html` et `app.js` pour ajouter des fonctionnalités ou modifier l'UI.
- Ajouter de nouveaux fichiers JSON dans `data/` et ajuster `app.js` pour les charger.
- Pour travailler confortablement, servez le dossier via un serveur local (voir section précédente).

Bonnes pratiques recommandées :
- Ne pas stocker de données sensibles réelles dans ce dépôt.
- Si vous ajoutez des jeux de données plus volumineux, envisagez de paginer ou d'utiliser des fichiers compressés pour les tests.

## Roadmap

Améliorations et corrections notées :
- Feature : Ajouter beaucoup plus de prénoms (étendre `data/firstnames-fr-common.json` et proposer un import de sources supplémentaires).
- Feature : Permettre d'entrer la réponse du LLM et de la désanonymiser (fonctionnalité de "round-trip" : remplacement des balises anonymisées par leurs valeurs d'origine).
- Bug : Les noms de famille semblent mal détectés — investigation sur la logique de reconnaissance des entités et amélioration des règles/expressions régulières.
- Bug : Certains cas spécifiques ne sont pas détectés (ex. "place des Lices") — améliorer la couverture des types de lieux et des variations d'orthographe.

Priorités suggérées :
1. Corriger la détection des noms et cas manquants (bugs).
2. Étendre la base de prénoms.
3. Implémenter la fonctionnalité de désanonymisation.
4. Ajouter des tests et exemples pour couvrir les cas signalés.

Contributions pour la roadmap :
- Ouvrir une issue pour chaque point afin de suivre la progression.
- Proposer des PRs pour les jeux de données (ajout de prénoms) ou les améliorations côté `app.js`.

## Contribution

Contributions bienvenues :
- Ouvrir une issue pour proposer des améliorations ou signaler des bugs.
- Forker le dépôt, créer une branche dédiée et soumettre une pull request.

Respectez la licence et ajoutez des tests/doc si vous complexifiez la logique d'anonymisation.

## Licence

Voir le fichier `LICENSE` à la racine du dépôt.

## Auteur / Références

- Dépôt distant : https://github.com/dorian-bucaille/prompt-anonymizer
- Auteur original : Dorian Bucaille (voir historique Git pour plus d'informations).
