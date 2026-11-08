const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", 
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

let globalTransactions = [];
let currentMode = "normal"; 
let isSaving = false;
let activeYearFilter = String(new Date().getFullYear());

//  Le formatteur monétaire officiel français
const moneyFormatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

document.addEventListener("DOMContentLoaded", () => {
    loadTransactions();
});

// ==========================================
//   Charge les données depuis le serveur par année
// ==========================================
async function loadTransactions() {
    try {
        const year = activeYearFilter || String(new Date().getFullYear());

        const response = await fetch(`/api/transactions/${year}`);
        if (!response.ok) throw new Error("Erreur lors de la récupération des données.");

        const data = await response.json();

        globalTransactions = data.operations || [];
        window.initialBalance = data.soldeInitial || 0;

        refreshUI();

    } catch (error) {
        console.error("Erreur d'initialisation de l'application :", error);
        alert("Impossible de charger les transactions depuis le serveur.");
    }
}

// ==========================================
//   Rafraîchit l'affichage graphique
// ==========================================
function refreshUI() {
    initInteractions(); // 1. Nettoie et prépare les structures globales
    renderWithTemplate(globalTransactions); // 2. Dessine les lignes et attache les clics handleRowClick
}

/**
 * Lit les données, effectue les calculs comptables et clone le template HTML
 */
function renderWithTemplate(data) {
    const container = document.getElementById("account-records");
    const template = document.getElementById("month-template");
    container.innerHTML = ""; 

    // Dynamisation de la date du jour pour l'ouverture automatique du bon bloc
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonthIndex = today.getMonth(); // Dynamique (0 = Janvier, 11 = Décembre)

    const structuredData = {};
    let runningBalance = window.initialBalance || 0;

    // ─── ÉTAPE DE TRI CHRONOLOGIQUE CRITIQUE ───
    // Trie toutes les transactions du plus ancien au plus récent avant tout calcul de solde
    const sortedData = data.slice().sort((a, b) => {
        const [dayA, monthA, yearA] = a.date.split("/");
        const [dayB, monthB, yearB] = b.date.split("/");
        return new Date(yearA, monthA - 1, dayA) - new Date(yearB, monthB - 1, dayB);
    });

    // 1. Calcul du solde glissant continu sur les données triées
    sortedData.forEach(tx => {
        const [_, monthStr, yearStr] = tx.date.split("/");
        const year = parseInt(yearStr);
        const monthIndex = parseInt(monthStr) - 1;

        if (!structuredData[year]) structuredData[year] = {};
        if (!structuredData[year][monthIndex]) structuredData[year][monthIndex] = [];

        const rentree = tx.rentree || 0;
        const depense = tx.depense || 0;
        runningBalance += (rentree - depense);

        structuredData[year][monthIndex].push({
            ...tx,
            calculatedSolde: runningBalance
        });
    });

    // 2. Injection du solde final global dans le Header principal
    const globalBalanceEl = document.getElementById("global-balance-amount");
    if (globalBalanceEl) {
        // ➔ MODIFICATION : Habillage automatique en format français (Ex: 4 249,71 €)
        globalBalanceEl.textContent = moneyFormatter.format(runningBalance);
        globalBalanceEl.className = `amount ${runningBalance >= 0 ? 'text-green' : 'text-red'}`;
    }


    // 3. Boucle sur les années et les mois pour cloner le Template
    Object.keys(structuredData).sort().forEach(year => {
        const yearGroup = document.createElement("div");
        yearGroup.className = "year-group";
        yearGroup.setAttribute("data-year", year);
        
        const yearSelect = document.getElementById("year-select");
        if (yearSelect && yearSelect.value) {
            activeYearFilter = yearSelect.value; // ➔ Met à jour la variable globale directement !
        }

        if (year !== activeYearFilter) {
            yearGroup.style.display = "none";
        }

        // Tri inversé (b - a) pour avoir les mois récents en haut de la page
        Object.keys(structuredData[year]).sort((a, b) => b - a).forEach(monthIdx => {
            const monthTransactions = structuredData[year][monthIdx];
            // Détection dynamique du mois en cours
            const isCurrentMonth = (parseInt(year) === currentYear && parseInt(monthIdx) === currentMonthIndex);
            
            let totalExpenses = 0;
            let totalIncomes = 0;
            monthTransactions.forEach(tx => {
                totalExpenses += (tx.depense || 0);
                totalIncomes += (tx.rentree || 0);
            });
            const monthlyDiff = totalIncomes - totalExpenses;
            const finalMonthBalance = monthTransactions[monthTransactions.length - 1].calculatedSolde;

            const clone = document.importNode(template.content, true);
            const fieldset = clone.querySelector(".month-fieldset");

            fieldset.className = `month-fieldset ${isCurrentMonth ? 'is-active' : 'is-hidden'}`;
            fieldset.setAttribute("data-month", parseInt(monthIdx) + 1);
            fieldset.setAttribute("data-year", year);

            const titleEl = clone.querySelector(".month-title");
            titleEl.innerHTML = `<span class="month-name-text">${monthNames[monthIdx]} ${year}</span> <span class="toggle-arrow">▼</span>`;

            const tbody = clone.querySelector(".transaction-tbody");

            // Rendu inversé pour afficher l'opération la plus récente en haut du tableau du mois
            monthTransactions.slice().reverse().forEach(tx => {
                const tr = document.createElement("tr");
                tr.setAttribute("data-id", tx.id);

                // ➔ MODIFICATION : Habillage des montants de la ligne au format français
                const entreeText = tx.rentree ? `+ ${moneyFormatter.format(tx.rentree)}` : "-";
                const depenseText = tx.depense ? `- ${moneyFormatter.format(tx.depense)}` : "-";

                tr.innerHTML = `
                    <td>${tx.date}</td>
                    <td>${tx.libelle}</td>
                    <td class="${tx.rentree ? 'text-green' : ''}">${entreeText}</td>
                    <td class="${tx.depense ? 'text-red' : ''}">${depenseText}</td>
                    <td>${moneyFormatter.format(tx.calculatedSolde)}</td>
                `;

                tr.addEventListener("click", () => {
                    if (typeof handleRowClick === "function") {
                        handleRowClick(tx.id);
                    }
                });
                tbody.appendChild(tr); // Retient uniquement celle-ci qui est la bonne !
            });

            // ➔ MODIFICATION : Format français pour le total des dépenses du mois
            clone.querySelector(".month-total-expenses").textContent = `-${moneyFormatter.format(totalExpenses)}`;

            // ➔ MODIFICATION : Habillage du total du mois en français avec conservation du signe "+"
            const diffEl = clone.querySelector(".month-diff");
            const formattedDiff = moneyFormatter.format(Math.abs(monthlyDiff)); // Calcule la valeur absolue sans le signe -

            diffEl.textContent = `${monthlyDiff >= 0 ? '+' : '-'}${formattedDiff}`;
            diffEl.className = monthlyDiff >= 0 ? "text-green" : "text-red";


            // ➔ MODIFICATION : Format français pour le solde final du mois
            clone.querySelector(".month-final-balance").textContent = moneyFormatter.format(finalMonthBalance);

            yearGroup.appendChild(clone);
        });

        container.appendChild(yearGroup);
    });

    updateYearSelect(Object.keys(structuredData), currentYear);
}

/**
 * Configure les écouteurs de clics (Accordéon) et de filtres (Année)
 */
function initInteractions() {
    // Écouteur global pour ouvrir/fermer le tableau d'un mois (Délégation d'événement)
    const accountRecords = document.getElementById("account-records");
    if (accountRecords && !accountRecords.dataset.hasListener) {
        accountRecords.addEventListener("click", (e) => {
            const title = e.target.closest(".month-title");
            if (title) {
                const currentFieldset = title.closest(".month-fieldset");
                if (currentFieldset.classList.contains("is-active")) {
                    currentFieldset.classList.replace("is-active", "is-hidden");
                } else {
                    currentFieldset.classList.replace("is-hidden", "is-active");
                }
            }
        });
        accountRecords.dataset.hasListener = "true"; // Sécurité anti-doublon
    }

    // Filtre sélecteur d'année
    const yearSelect = document.getElementById("year-select");
    if (yearSelect) {
        yearSelect.onchange = (e) => {
            activeYearFilter = e.target.value;
            loadTransactions(); // Recharge le bon fichier JSON
        };
    }

    // Gestion de la barre d'action supérieure (Boutons statiques)
    const btnAdd = document.getElementById("btn-main-add");
    const btnEdit = document.getElementById("btn-main-edit");
    const btnDelete = document.getElementById("btn-main-delete");
    const btnCancel = document.getElementById("btn-modal-cancel");
    const txForm = document.getElementById("transaction-form");

    if (btnAdd) btnAdd.onclick = () => setMode("add");
    if (btnEdit) btnEdit.onclick = () => setMode("edit");
    if (btnDelete) btnDelete.onclick = () => setMode("delete");
    if (btnCancel) btnCancel.onclick = closeModal;
    if (txForm) txForm.onsubmit = handleFormSubmit;
}



/**
 * Configure le mode global actif (Couleur de survol sur les lignes du tableau)
 */
function setMode(mode) {
    const badge = document.getElementById("mode-badge");
    const body = document.body;

    body.classList.remove("mode-edit-active", "mode-delete-active");

    if (mode === "add") {
        currentMode = "normal";
        if (badge) badge.className = "mode-badge is-hidden";
        openModal(); // Affiche la pop-up immédiatement
    } else if (mode === "edit") {
        if (currentMode === "edit") {
            currentMode = "normal";
            if (badge) badge.className = "mode-badge is-hidden";
        } else {
            currentMode = "edit";
            body.classList.add("mode-edit-active");
            if (badge) {
                badge.className = "mode-badge edit-mode";
                badge.textContent = "Mode Modification Actif 📝 : Cliquez sur une ligne de tableau pour la modifier.";
            }
        }
    } else if (mode === "delete") {
        if (currentMode === "delete") {
            currentMode = "normal";
            if (badge) badge.className = "mode-badge is-hidden";
        } else {
            currentMode = "delete";
            body.classList.add("mode-delete-active");
            if (badge) {
                badge.className = "mode-badge delete-mode";
                badge.textContent = "Mode Suppression Actif 🗑️ : Cliquez sur une ligne de tableau pour la supprimer.";
            }
        }
    } else if (mode === "normal") {
        currentMode = "normal";
        if (badge) badge.className = "mode-badge is-hidden";
    }
}

/**
 * Intercepte le clic sur une ligne de transaction selon le mode actif
 */
function handleRowClick(id) {
    const transaction = globalTransactions.find(t => t.id === id);
    if (!transaction) return;

    if (currentMode === "edit") {
        openModal(transaction);
    } else if (currentMode === "delete") {
        const confirmText = `Êtes-vous sûr de vouloir supprimer l'opération suivante ?\n\n➔ ${transaction.date} | ${transaction.libelle} | ${transaction.rentree ? '+' : '-'}${transaction.rentree || transaction.depense} €`;
        if (confirm(confirmText)) {
            isSaving = true; 
            globalTransactions = globalTransactions.filter(t => t.id !== id);
            setMode("normal");
            saveTransactionsToServer(); // ➔ Sauvegarde automatique après suppression !
        }
    }
}

/**
 * Ouvre la fenêtre modale (Pop-up)
 */
function openModal(tx = null) {
    const modal = document.getElementById("transaction-modal");
    const title = document.getElementById("modal-title");
    const form = document.getElementById("transaction-form");
    
    modal.classList.remove("is-hidden");

    if (tx) {
        title.textContent = "Modifier l'Opération";
        document.getElementById("tx-id").value = tx.id;
        document.getElementById("tx-libelle").value = tx.libelle;
        document.getElementById("tx-montant").value = tx.rentree || tx.depense;
        document.getElementById("type-toggle").checked = !!tx.rentree;

        const [day, month, year] = tx.date.split("/");
        document.getElementById("tx-date").value = `${year}-${month}-${day}`;
    } else {
        title.textContent = "Nouvelle Opération";
        form.reset();
        document.getElementById("tx-id").value = "";
        document.getElementById("tx-date").valueAsDate = new Date();
    }
}

/**
 * Ferme et nettoie la fenêtre modale
 */
function closeModal() {
    document.getElementById("transaction-modal").classList.add("is-hidden");
    document.getElementById("transaction-form").reset();
    document.body.classList.remove("mode-edit-active", "mode-delete-active");
    currentMode = "normal";
    
    const badge = document.getElementById("mode-badge");
    if (badge) badge.className = "mode-badge is-hidden";
}

/**
 * Enregistre un nouvel élément ou applique les modifications
 */
function handleFormSubmit(e) {
    e.preventDefault();

    const id = document.getElementById("tx-id").value;
    const isEntree = document.getElementById("type-toggle").checked;
    const rawDate = document.getElementById("tx-date").value;
    const libelle = document.getElementById("tx-libelle").value;
    const montant = parseFloat(document.getElementById("tx-montant").value);

    const [year, month, day] = rawDate.split("-");
    const formattedDate = `${day}/${month}/${year}`;

    const newTx = {
        id: id || String(Date.now()), 
        date: formattedDate, 
        libelle: libelle,
        rentree: isEntree ? montant : null,
        depense: !isEntree ? montant : null
    };

    closeModal();

    // ➔ Sécurité : Si l'opération appartient à l'année actuellement affichée
    if (year && String(year) === activeYearFilter) {
        if (id) {
            const txIndex = globalTransactions.findIndex(t => t.id === id);
            if (txIndex !== -1) globalTransactions[txIndex] = newTx;
        } else {
            globalTransactions.push(newTx);
        }
        saveTransactionsToServer();
    } 
    // ➔ Si l'opération est pour une AUTRE année, on l'envoie directement sans toucher au tableau actuel
    else if (year) {
        saveSingleTransactionToOtherYear(String(year), newTx);
    }
}

// ==========================================
//   Envoie le tableau mis à jour au serveur par année
// ==========================================
async function saveTransactionsToServer() {
    try {
        const year = activeYearFilter || String(new Date().getFullYear());

        const response = await fetch(`/api/transactions/${year}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(globalTransactions)
        });

        if (!response.ok) throw new Error("Erreur lors de la sauvegarde sur le serveur.");
        
        // ➔ TRÈS IMPORTANT : On recharge proprement le fichier de l'année cible 
        // pour récupérer le soldeInitial et toutes les opérations existantes triées
        loadTransactions(); 
        isSaving = false;
        
    } catch (error) {
        console.error("Impossible de sauvegarder les modifications :", error);
        alert("Attention : Impossible d'enregistrer les données dans le fichier JSON.");
        isSaving = false;
    }
}

/**
 * Met à jour dynamiquement la liste déroulante des années avec historique et futur
 */
function updateYearSelect(years, currentYear) {
    const yearSelect = document.getElementById("year-select");
    if (!yearSelect) return;

    const previouslySelected = yearSelect.value;
    const uniqueYears = new Set(years.map(y => String(y)));
    
    // ➔ SÉCURITÉ : On force l'historique depuis la création du compte (2024) jusqu'au futur (currentYear + 1)
    for (let y = 2024; y <= currentYear + 1; y++) {
        uniqueYears.add(String(y));
    }

    yearSelect.innerHTML = ""; 
    
    Array.from(uniqueYears).sort((a, b) => b - a).forEach(year => {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        
        if (previouslySelected ? year === previouslySelected : parseInt(year) === currentYear) {
            option.selected = true;
        }
        yearSelect.appendChild(option);
    });
}

// ==========================================
//   Envoie une opération isolée vers une autre année
// ==========================================
async function saveSingleTransactionToOtherYear(targetYear, transaction) {
    try {
        const response = await fetch(`/api/transactions/single/${targetYear}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transaction)
        });

        if (!response.ok) throw new Error("Erreur lors de l'ajout isolé.");

        // On bascule visuellement sur l'année de l'opération qu'on vient de créer
        activeYearFilter = targetYear;
        const yearSelect = document.getElementById("year-select");
        if (yearSelect) yearSelect.value = activeYearFilter;

        // On recharge proprement toutes les données de cette année
        loadTransactions();
    } catch (error) {
        console.error("Erreur de sauvegarde isolée :", error);
        alert("Impossible d'enregistrer l'opération dans l'autre année.");
    }
}