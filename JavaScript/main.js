const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", 
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

let globalTransactions = [];
let currentMode = "normal"; 

document.addEventListener("DOMContentLoaded", () => {
    loadTransactions();
});

/**
 * Récupère les données depuis le serveur de développement local
 */
async function loadTransactions() {
    try {
        // On interroge notre mini-serveur node
        const response = await fetch('http://localhost:3000/api/transactions'); 
        if (!response.ok) throw new Error(`Erreur HTTP : ${response.status}`);
        
        globalTransactions = await response.json();
        refreshUI();
        initInteractions();
    } catch (error) {
        console.error("Erreur de chargement des transactions :", error);
        document.getElementById("account-records").innerHTML = 
            `<p class="text-red">Erreur : Assure-toi d'avoir lancé le serveur Node (node server.js).</p>`;
    }
}

function refreshUI() {
    renderWithTemplate(globalTransactions);
}


/**
 * Lit les données, effectue les calculs comptables et clone le template HTML
 */
function renderWithTemplate(data) {
    const container = document.getElementById("account-records");
    const template = document.getElementById("month-template");
    container.innerHTML = ""; 

    const currentYear = 2026;
    const currentMonthIndex = 9; // Octobre

    const structuredData = {};
    let runningBalance = 0;

    // 1. Tri chronologique de base et calcul du solde glissant continu (indispensable dans ce sens)
    data.forEach(tx => {
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
        globalBalanceEl.textContent = `${runningBalance.toFixed(2)} €`;
        globalBalanceEl.className = `amount ${runningBalance >= 0 ? 'text-green' : 'text-red'}`;
    }

    // 3. Boucle sur les années et les mois pour cloner le Template
    Object.keys(structuredData).sort().forEach(year => {
        const yearGroup = document.createElement("div");
        yearGroup.className = "year-group";
        yearGroup.setAttribute("data-year", year);
        
        const yearSelect = document.getElementById("year-select");
        let activeYearFilter = String(currentYear);
        if (yearSelect && yearSelect.value) {
            activeYearFilter = yearSelect.value;
        }
        
        if (year !== activeYearFilter) {
            yearGroup.style.display = "none";
        }

        // Tri inversé (b - a) pour avoir les mois récents en haut
        Object.keys(structuredData[year]).sort((a, b) => b - a).forEach(monthIdx => {
            const monthTransactions = structuredData[year][monthIdx];
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
            
            // ─── MODIFICATION ICI : On applique .slice().reverse() ───
            // Le .slice() permet de copier le tableau pour ne pas casser l'ordre des calculs du solde global
            monthTransactions.slice().reverse().forEach(tx => {
                const tr = document.createElement("tr");
                tr.setAttribute("data-id", tx.id);
                
                const entreeText = tx.rentree ? `<span class="text-green">+${tx.rentree.toFixed(2)} €</span>` : "-";
                const depenseText = tx.depense ? `<span class="text-red">-${tx.depense.toFixed(2)} €</span>` : "-";
                
                tr.innerHTML = `
                    <td>${tx.date}</td>
                    <td>${tx.libelle}</td>
                    <td>${entreeText}</td>
                    <td>${depenseText}</td>
                    <td>${tx.calculatedSolde.toFixed(2)} €</td>
                `;

                tr.addEventListener("click", () => {
                    if (typeof handleRowClick === "function") {
                        handleRowClick(tx.id);
                    }
                });
                tbody.appendChild(tr);
            });

            clone.querySelector(".month-total-expenses").textContent = `-${totalExpenses.toFixed(2)} €`;
            
            const diffEl = clone.querySelector(".month-diff");
            diffEl.textContent = `${monthlyDiff >= 0 ? '+' : ''}${monthlyDiff.toFixed(2)} €`;
            diffEl.className = monthlyDiff >= 0 ? "text-green" : "text-red";
            
            clone.querySelector(".month-final-balance").textContent = `${finalMonthBalance.toFixed(2)} €`;

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
    // Écouteur pour ouvrir/fermer le tableau d'un mois
    document.getElementById("account-records").addEventListener("click", (e) => {
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

    // Filtre sélecteur d'année
    const yearSelect = document.getElementById("year-select");
    if (yearSelect) {
        yearSelect.addEventListener("change", (e) => {
            const selectedYear = e.target.value;
            document.querySelectorAll(".year-group").forEach(group => {
                group.style.display = group.getAttribute("data-year") === selectedYear ? "block" : "none";
            });
        });
    }

    // Gestion de la barre d'action supérieure
    document.getElementById("btn-main-add").addEventListener("click", () => setMode("add"));
    document.getElementById("btn-main-edit").addEventListener("click", () => setMode("edit"));
    document.getElementById("btn-main-delete").addEventListener("click", () => setMode("delete"));
    document.getElementById("btn-modal-cancel").addEventListener("click", closeModal);
    document.getElementById("transaction-form").addEventListener("submit", handleFormSubmit);
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
            globalTransactions = globalTransactions.filter(t => t.id !== id);
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

    if (id) {
        const txIndex = globalTransactions.findIndex(t => t.id === id);
        if (txIndex !== -1) {
            globalTransactions[txIndex] = {
                id: id, date: formattedDate, libelle: libelle,
                rentree: isEntree ? montant : null,
                depense: !isEntree ? montant : null
            };
        }
    } else {
        const newTx = {
            id: String(Date.now()), date: formattedDate, libelle: libelle,
            rentree: isEntree ? montant : null,
            depense: !isEntree ? montant : null
        };
        globalTransactions.push(newTx);
    }

    closeModal();
    saveTransactionsToServer(); // ➔ Sauvegarde automatique après ajout/édition !
}

/**
 * ─── NOUVELLE FONCTION : Envoie le tableau mis à jour au serveur ───
 */
async function saveTransactionsToServer() {
    try {
        const response = await fetch('http://localhost:3000/api/transactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(globalTransactions)
        });

        if (!response.ok) throw new Error("Erreur lors de la sauvegarde sur le serveur.");
        
        // Si le serveur a bien écrit le fichier, on rafraîchit notre interface graphique
        refreshUI();
    } catch (error) {
        console.error("Impossible de sauvegarder les modifications :", error);
        alert("Attention : Impossible d'enregistrer les données dans le fichier JSON.");
    }
}

/**
 * Met à jour dynamiquement la liste déroulante des années
 */
function updateYearSelect(years, currentYear) {
    const yearSelect = document.getElementById("year-select");
    if (!yearSelect || yearSelect.options.length > 0) return;

    yearSelect.innerHTML = "";
    years.sort().forEach(year => {
        const option = document.createElement("option");
        option.value = year; option.textContent = year;
        if (parseInt(year) === currentYear) option.selected = true;
        yearSelect.appendChild(option);
    });
}

