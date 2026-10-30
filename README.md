# 📊 Suivi de Compte Personnel (Application PC Locale)

Une application web Full-Stack légère, moderne et minimaliste conçue pour gérer et suivre son budget personnel directement depuis son ordinateur.

L'application simule une expérience de bureau native sous Windows grâce à un script d'automatisation complet qui gère l'installation et le lancement en un seul clic.

---

![Aperçu de l'application](<Screen_Site/Screenshot 2026-10-30 at 13-50-03 Suivi du Compte Bancaire.png>)

---

## 🚀 Fonctionnalités & Apprentissages

- **Architecture Client-Serveur (API REST) :** Communication asynchrone (`async/await` et `Fetch API`) entre l'interface frontend et le serveur backend Node.js.
- **Logique CRUD complète :** Ajout dynamique de transactions, suppression et mise à jour des calculs de solde glissant en temps réel.
- **Persistance des Données :** Sauvegarde et lecture physique des informations directement sur le disque dur via un fichier JSON local.
- **Interface Interactive & Thème Sombre :** Design soigné avec un commutateur dynamique (Entrée / Dépense) développé à 100% en CSS fluide.
- **Décompte d'Initialisation :** Script de démarrage Windows Batch (`.bat`) cadencé avec gestion autonome et silencieuse des dépendances.

---

## 🛠️ Technologies Utilisées

- **Frontend :** HTML5, CSS3 (Variables natives, Flexbox), JavaScript ES6
- **Backend :** Node.js, Express (Framework de routage pour l'API REST)
- **Base de données :** Fichier JSON local (`Data/data.json`)
- **Automatisation :** Script Windows Batch (`lancer_app.bat`)

---

## 📂 Structure du Projet

```text
Suivi de Compte (GitHub)
|   .gitignore
|   generate_structure_V2.bat
|   human.txt
|   index.html
|   lancer_app.bat
|   package.json
|   package-lock.json
|   README.md
|   server.js
+---Assets
|   \---Favicon
|       |   Favicon.K.sf.blanc.png
|       \---Favicon.K.sf.png
+---Data
|   \---data.json
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

## 🔒 Utilisation personnelle (Remise à zéro)

Par défaut, l'application est livrée avec un fichier de démonstration contenant de fausses transactions pour vous permettre de tester l'interface graphique dès le premier lancement.

**Pour vider l'application et l'utiliser avec vos propres comptes :**

1. Naviguez dans le dossier **`Data`**.
2. Ouvrez le fichier **`data.json`** avec le Bloc-notes de Windows ou l'éditeur de votre choix.
3. Supprimez tout son contenu et remplacez-le par un tableau vide :
   ```json
   []
   ```
4. Enregistrez et fermez le fichier. L'application est désormais totalement vierge, sécurisée et prête à accueillir vos données en toute confidentialité sur votre machine !
