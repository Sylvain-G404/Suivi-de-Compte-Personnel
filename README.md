# 📊 Suivi de Compte Personnel (Application PC Locale)

Une application web Full-Stack légère, moderne et minimaliste conçue pour gérer et suivre son budget personnel directement depuis son ordinateur, en toute confidentialité.

L'application simule une expérience de bureau native sous Windows grâce à un script d'automatisation complet qui gère l'installation et le lancement en un seul clic.

---

![Aperçu de l'application](<Screen_Site/Screenshot 2026-10-30 at 13-50-03 Suivi du Compte Bancaire.png>)

---

## 🚀 Fonctionnalités & Apprentissages

- **Architecture Client-Serveur (API REST) :** Communication asynchrone (`async/await` et `Fetch API`) entre l'interface frontend et le serveur backend Node.js.
- **Logique CRUD complète :** Ajout dynamique de transactions, suppression et mise à jour des calculs de solde glissant en temps réel.
- **Stockage Sectorisé par Année :** Répartition automatique des données dans des fichiers physiques distincts (`data-AAAA.json`) pour garantir la légèreté de l'application à long terme.
- **Mise à Jour en Cascade :** Algorithme serveur qui propage automatiquement les modifications de soldes du passé vers les années futures par un effet domino instantané.
- **Persistance Sécurisée Atomique :** Utilisation d'un fichier temporaire intermédiaire (`.tmp`) et d'un renommage atomique pour éviter tout risque de corruption des données sur le disque dur.
- **Interface Ergonomique & Format VF :** Habillage monétaire français natif (`Intl.NumberFormat`) pour les milliers et centimes, panneau de contrôle collant (`position: sticky`) au défilement, et commutateur dynamique (Entrée / Dépense) développé à 100% en CSS fluide.
- **Décompte d'Initialisation :** Script de démarrage Windows Batch (`.bat`) cadencé avec gestion autonome et silencieuse des dépendances.

---

## 🛠️ Technologies Utilisées

- **Frontend :** HTML5, CSS3 (Variables natives, Flexbox, Sticky layout), JavaScript ES6 (Intl API, DOM manipulation)
- **Backend :** Node.js, Express (Framework de routage pour l'API REST), fs (File System avec gestion atomique)
- **Base de données :** Fichiers JSON locaux par année (`Data/data-AAAA.json`)
- **Automatisation :** Script Windows Batch (`lancer_app.bat`)

---

## 📂 Structure du Projet

```text
Suivi de Compte
|   .gitignore
|   human.txt
|   index.html
|   lancer_app.bat
|   package.json
|   README.md
|   server.js
+---Assets
|   \---Favicon
|       |   Favicon.K.sf.blanc.png
|       \---Favicon.K.sf.png
+---Data
|   \---data-2026.json
+---Infos_Structure
+---JavaScript
|   \---main.js
+---node_modules
+---Screen_Site
|   \---Screenshot 2026-10-30 at 13-50-03 Suivi du Compte Bancaire.png
+---Style
    \---style.css
```

---

## 💻 Comment installer et lancer l'application ?

Le projet est pensé pour être autonome et utilisable immédiatement, sans avoir à configurer manuellement un serveur ou ouvrir un éditeur de code.

### Prérequis

- Avoir **Node.js** installé sur votre machine Windows.

### Lancement

1. Téléchargez ou clonez ce dépôt sur votre ordinateur.
2. Double-cliquez sur le fichier **`lancer_app.bat`** situé à la racine du projet.
3. Le script s'occupe de tout :
   - Il vérifie la présence des dépendances et lance silencieusement un `npm install` si le dossier `node_modules` est absent.
   - Il initialise le serveur Express local sur le port `3000` accompagné d'un décompte visuel de sécurité.
   - Il ouvre automatiquement votre navigateur internet par défaut sur l'application.
4. Pour couper proprement le serveur et fermer l'application à la fin de votre session, retournez sur la fenêtre du terminal noir et **appuyez sur n'importe quelle touche**.

---

## 🔒 Utilisation personnelle (Remise à zéro / Initialisation)

Par défaut, l'application est livrée avec un fichier de démonstration contenant les transactions de l'année en cours pour vous permettre de tester l'interface graphique dès le premier lancement.

**Pour configurer votre propre historique financier de départ :**

1. Naviguez dans le dossier **`Data`**.
2. Ouvrez le fichier de l'année la plus ancienne de votre choix (ex: **`data-2026.json`**) avec le Bloc-notes de Windows ou l'éditeur de votre choix.
3. Configurez votre solde de départ en modifiant la variable `soldeInitial` et assurez-vous que le tableau `operations` est vide :
   ```json
   {
     "soldeInitial": 500.0,
     "operations": []
   }
   ```
4. Enregistrez et fermez le fichier. L'application est désormais totalement vierge, sécurisée et prête à accueillir vos données en toute confidentialité. Les années futures seront générées automatiquement par le serveur lors de vos futures saisies de dates !

---

## 👤 À propos de l'Auteur

Ce projet a été développé avec passion par **KiirrA** (Sylvain-G404), développeur indépendant spécialisé dans la création d'outils d'automatisation légers, d'architectures logicielles découplées et d'interfaces web dynamiques.

N'hésitez pas à laisser une ⭐️ sur ce dépôt pour soutenir le projet !

- **GitHub :** [@Sylvain-G404](https://github.com/Sylvain-G404)
- **Portfolio :** [Mon-Portfolio-Temps](https://sylvain-g404.github.io/Mon-Portfolio-Temps/)

_« Coder sans limites. »_
