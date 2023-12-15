# HackerNews UI

## Aperçu

La technologie évolue rapidement, et rester à jour avec les dernières avancées est essentiel pour les programmeurs. Ce projet vise à fournir une interface conviviale pour l'API HackerNews, offrant une manière pratique d'accéder aux actualités technologiques, aux offres d'emploi, aux histoires, aux sondages et aux commentaires.

## Fonctionnalités

- **Posts :** Affichage de divers types de posts, y compris des histoires, des offres d'emploi et des sondages.
- **Commentaires :** Organisation des commentaires avec leur post parent approprié, maintenant une hiérarchie claire.
- **Live Data :** Informez les utilisateurs des dernières informations avec des mises à jour en direct toutes les 5 secondes.

## Utilisation

1. **Sélectionnez la catégorie :** Utilisez le menu déroulant pour choisir la catégorie de posts que vous souhaitez explorer.
2. **Défilez pour plus :** Chargez des posts supplémentaires en faisant défiler jusqu'au bas de la page.
3. **Mises à jour en direct :** Restez informé avec les dernières informations affichées dans la section dédiée.

## Évitement de la limitation de taux

Pour éviter d'éventuels problèmes de limitation de taux, les stratégies suivantes ont été mises en œuvre :

- Optimisation du code pour éliminer les requêtes inutiles.
- Utilisation de fonctions de régulation (throttling/debouncing) pour contrôler le nombre de requêtes.

