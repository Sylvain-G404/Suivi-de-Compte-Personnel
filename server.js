const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// Permet au serveur de comprendre le format JSON envoyé par le JS
app.use(express.json());

// Indique à Node de servir les fichiers directement depuis la racine de ton projet
app.use(express.static(__dirname));

// SÉCURITÉ CORS FINALE : Autorise expressément ton Live Server (port 5500) à communiquer
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    
    // Gère la requête de pré-vérification des navigateurs (OPTIONS)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

// Supprime l'erreur de sécurité concernant le favicon.ico dans ta console
app.get('/favicon.ico', (_, res) => res.status(204).end());

// Chemin exact pointant vers ton fichier de données physique
const DATA_FILE_PATH = path.join(__dirname, 'Data', 'data.json');

/**
 * ROUTE 1 : Permet à main.js de LIRE ton fichier data.json
 */
app.get('/api/transactions', (_, res) => {
    fs.readFile(DATA_FILE_PATH, 'utf8', (err, data) => {
        if (err) {
            console.error("Erreur de lecture du fichier data.json :", err);
            return res.status(500).json({ error: "Impossible de lire les données" });
        }
        res.json(JSON.parse(data));
    });
});

/**
 * ROUTE 2 : Permet à main.js d'ÉCRIRE et de SAUVEGARDER dans ton fichier data.json
 */
app.post('/api/transactions', (req, res) => {
    const updatedTransactions = req.body;

    fs.writeFile(DATA_FILE_PATH, JSON.stringify(updatedTransactions, null, 2), 'utf8', (err) => {
        if (err) {
            console.error("Erreur d'écriture dans le fichier data.json :", err);
            return res.status(500).json({ error: "Impossible de sauvegarder les données" });
        }
        console.log("Fichier data.json réécrit avec succès !");
        res.json({ success: true, message: "Sauvegarde réussie" });
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Serveur API de développement actif sur : http://localhost:${PORT}`);
    console.log(`💡 Ouvre ton fichier index.html avec Live Server (Port 5500) pour voir l'application.`);
});
