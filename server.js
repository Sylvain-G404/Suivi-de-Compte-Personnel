const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// Permet au serveur de comprendre le format JSON envoyé par le JS
app.use(express.json());

// Indique à Node de servir les fichiers directement depuis la racine de ton projet
app.use(express.static(__dirname));

// ==========================================
//   CONFIGURATION DES REQUÊTES DU SERVEUR
// ==========================================
app.use((req, res, next) => {
    // Autorise uniquement l'application locale à communiquer
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

// Supprime l'erreur de sécurité concernant le favicon.ico dans ta console
app.get('/favicon.ico', (_, res) => res.status(204).end());

// ==========================================
//   Récupération des transactions par année (avec création auto)
// ==========================================
app.get('/api/transactions/:year', (req, res) => {
    const year = parseInt(req.params.year);
    const filePath = path.join(__dirname, 'Data', `data-${year}.json`);

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (!err) {
            try {
                return res.json(JSON.parse(data));
            } catch (parseError) {
                console.error(`Fichier JSON ${year} malformé :`, parseError);
                return res.status(500).json({ error: "Format de données invalide." });
            }
        }

        console.log(`Le fichier data-${year}.json n'existe pas. Création automatique...`);
        
        const previousYearPath = path.join(__dirname, 'Data', `data-${year - 1}.json`);

        fs.readFile(previousYearPath, 'utf8', (prevErr, prevData) => {
            let nouveauSoldeInitial = 0;

            if (!prevErr) {
                try {
                    const parsedPrev = JSON.parse(prevData);
                    let total = parsedPrev.soldeInitial || 0;
                    
                    if (parsedPrev.operations && Array.isArray(parsedPrev.operations)) {
                        parsedPrev.operations.forEach(op => {
                            total += (op.rentree || 0) - (op.depense || 0);
                        });
                    }
                    // ➔ CORRECTION ICI : Arrondi strict à 2 décimales pour tuer le bug des millièmes !
                    nouveauSoldeInitial = Math.round(total * 100) / 100;
                } catch (e) {
                    console.error(`Impossible de calculer le solde de l'année précédente ${year - 1}`);
                }
            }

            const nouvelleAnneeStructure = {
                soldeInitial: nouveauSoldeInitial,
                operations: []
            };

            fs.writeFile(filePath, JSON.stringify(nouvelleAnneeStructure, null, 2), 'utf8', (writeErr) => {
                if (writeErr) {
                    console.error(`Erreur création fichier data-${year}.json :`, writeErr);
                    return res.status(500).json({ error: "Impossible de créer la nouvelle année." });
                }
                
                console.log(`Fichier data-${year}.json créé avec succès ! Solde de départ : ${nouveauSoldeInitial} €`);
                res.json(nouvelleAnneeStructure);
            });
        });
    });
});

// ==========================================
//   Sauvegarde sécurisée par année avec cascade
// ==========================================
app.post('/api/transactions/:year', (req, res) => {
    const year = parseInt(req.params.year);
    const updatedOperations = req.body;
    
    const filePath = path.join(__dirname, 'Data', `data-${year}.json`);
    const tempFilePath = filePath + '.tmp';

    // 1. Lire le fichier actuel pour conserver son solde initial
    fs.readFile(filePath, 'utf8', (readErr, currentData) => {
        let soldeInitial = 0;
        if (!readErr) {
            try {
                const parsed = JSON.parse(currentData);
                soldeInitial = parsed.soldeInitial || 0;
            } catch (e) {
                console.error(`Erreur parsing initial pour ${year}`);
            }
        }

        // 2. Reconstruire l'objet propre pour l'année en cours
        const finalDataStructure = {
            soldeInitial: soldeInitial,
            operations: updatedOperations
        };

        // 3. Écriture atomique avec le fichier .tmp
        fs.writeFile(tempFilePath, JSON.stringify(finalDataStructure, null, 2), 'utf8', (writeErr) => {
            if (writeErr) {
                return res.status(500).json({ error: "Échec de l'écriture temporaire." });
            }

            fs.rename(tempFilePath, filePath, (renameErr) => {
                if (renameErr) {
                    fs.unlink(tempFilePath, () => {});
                    return res.status(500).json({ error: "Échec du remplacement du fichier." });
                }

                console.log(`Fichier data-${year}.json mis à jour.`);

                // ➔ 4. COUP DE GÉNIE : On propage le nouveau solde aux années suivantes !
                propagateSoldeCascade(year);

                res.json({ success: true, message: "Sauvegarde réussie et cascade lancée." });
            });
        });
    });
});

/**
 * Fonction utilitaire : Calcule la clôture d'une année et met à jour le départ de la suivante
 */
function propagateSoldeCascade(currentYear) {
    const currentFilePath = path.join(__dirname, 'Data', `data-${currentYear}.json`);
    const nextYear = currentYear + 1;
    const nextFilePath = path.join(__dirname, 'Data', `data-${nextYear}.json`);

    // On vérifie si l'année suivante existe sur le disque
    if (!fs.existsSync(nextFilePath)) {
        console.log(`Pas d'année suivante trouvée (${nextYear}). Fin de la cascade.`);
        return; // Si data-2027.json n'existe pas encore, on s'arrête là !
    }

    // 1. On lit l'année en cours pour calculer son solde de fin exact
    fs.readFile(currentFilePath, 'utf8', (err, currentData) => {
        if (err) return;
        try {
            const parsedCurrent = JSON.parse(currentData);
            let total = parsedCurrent.soldeInitial || 0;
            
            if (parsedCurrent.operations && Array.isArray(parsedCurrent.operations)) {
                parsedCurrent.operations.forEach(op => {
                    total += (op.rentree || 0) - (op.depense || 0);
                });
            }
            const soldeClotureArrondi = Math.round(total * 100) / 100;

            // 2. On ouvre l'année suivante pour lui injecter ce solde en initial
            fs.readFile(nextFilePath, 'utf8', (nextErr, nextData) => {
                if (nextErr) return;
                try {
                    const parsedNext = JSON.parse(nextData);
                    parsedNext.soldeInitial = soldeClotureArrondi; // Mise à jour !

                    // 3. On réécrit l'année suivante mise à jour
                    fs.writeFile(nextFilePath, JSON.stringify(parsedNext, null, 2), 'utf8', (writeNextErr) => {
                        if (!writeNextErr) {
                            console.log(`🔄 Cascade : Le solde initial de ${nextYear} a été mis à jour à ${soldeClotureArrondi} €`);
                            // 4. On continue la chaîne au cas où il y aurait une année encore après (ex: 2028...)
                            propagateSoldeCascade(nextYear);
                        }
                    });
                } catch (e) {
                    console.error(`Erreur lors de la cascade sur l'année ${nextYear}`);
                }
            });
        } catch (e) {
            console.error(e);
        }
    });
}

app.listen(PORT, () => {
    console.log(`🚀 Serveur API de développement actif sur : http://localhost:${PORT}`);
});

// ==========================================
//   Ajout d'une opération isolée dans une autre année avec cascade
// ==========================================
app.post('/api/transactions/single/:year', (req, res) => {
    const year = parseInt(req.params.year);
    const newOperation = req.body;
    
    const filePath = path.join(__dirname, 'Data', `data-${year}.json`);
    const tempFilePath = filePath + '.tmp';

    // 1. On lit le fichier de l'année cible sur le disque
    fs.readFile(filePath, 'utf8', (readErr, currentData) => {
        let soldeInitial = 0;
        let operations = [];

        if (!readErr) {
            try {
                const parsed = JSON.parse(currentData);
                soldeInitial = parsed.soldeInitial || 0;
                operations = parsed.operations || [];
            } catch (e) {
                console.error(`Erreur parsing pour l'année ${year}`);
            }
        }

        // 2. On ajoute l'opération reçue à l'historique existant sans rien effacer !
        operations.push(newOperation);

        const finalDataStructure = {
            soldeInitial: soldeInitial,
            operations: operations
        };

        // 3. Écriture atomique sécurisée
        fs.writeFile(tempFilePath, JSON.stringify(finalDataStructure, null, 2), 'utf8', (writeErr) => {
            if (writeErr) return res.status(500).json({ error: "Échec écriture." });

            fs.rename(tempFilePath, filePath, (renameErr) => {
                if (renameErr) {
                    fs.unlink(tempFilePath, () => {});
                    return res.status(500).json({ error: "Échec remplacement." });
                }

                // 4. Cascade de mise à jour des soldes vers les années futures
                propagateSoldeCascade(year);

                res.json({ success: true, message: "Opération isolée enregistrée avec succès." });
            });
        });
    });
});
