import finduserbymail, { database, transferWithCallbacks } from "/src/controllers/database.js";

//recuperer le user pour afficher les infos dans le dashboard
let user = JSON.parse(sessionStorage.getItem('currentUser'));
const dbUsers = JSON.parse(sessionStorage.getItem('databaseUsers'));
if (dbUsers) {
    const updated = dbUsers.find(u => u.id == user.id);
    if (updated) user = updated;
}
//afficher les infos du user dans le dashboard

const nom = document.getElementById("greetingName");
nom.textContent = user.name;

const balance = document.getElementById("availableBalance");
balance.textContent = user.wallet.balance + " " + user.wallet.currency;

const revenus = document.getElementById("monthlyIncome");
const revenusTotal = user.wallet.transactions.filter(t => t.type === "credit")
    .reduce((sum, t) => sum + t.amount, 0);
revenus.textContent = revenusTotal + " " + user.wallet.currency;

const depenses = document.getElementById("monthlyExpenses");
const depensesTotal = user.wallet.transactions.filter(t => t.type === "debit")
    .reduce((sum, t) => sum + t.amount, 0);
depenses.textContent = depensesTotal + " " + user.wallet.currency;

//nbr de cards
const cards = document.getElementById("activeCards");
cards.textContent = user.wallet.cards.length;

document.getElementById("currentDate").textContent = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
});


const transferBtn = document.getElementById("quickTransfer");

const open = document.getElementById('transfer-section');

const closebtn = document.getElementById("closeTransferBtn");

//afficher la page de transfert
transferBtn.addEventListener("click", openTransferPage);
function openTransferPage() {
    open.classList.remove('hidden');
}

// button pour fermer la section de transfert
closebtn.addEventListener("click", closesection);
function closesection() {
    open.classList.add('hidden');
}

document.getElementById("cancelTransferBtn").addEventListener("click", closesection);
// Remplir le select bénéficiaires
const beneficiarySelect = document.getElementById("beneficiary");

const autresUsers = database.users.filter(u => u.id !== user.id);

autresUsers.forEach(u => {
    const option = document.createElement("option");
    option.value = u.id;
    option.textContent = u.name; // affiche "Ahmed", "Ali"...
    beneficiarySelect.appendChild(option);
});
// Remplir le select cards
const sourceCardSelect = document.getElementById("sourceCard");

user.wallet.cards.forEach(card => {
    const option = document.createElement("option");
    option.value = card.numcards;
    option.textContent = `${card.type.toUpperCase()} - **** ${card.numcards.slice(-4)}`;
    sourceCardSelect.appendChild(option);
});

//recupere les infos du transfert

const form = document.getElementById("transferForm");
form.addEventListener("submit", handleTransfer);


// gestionnaire de transfert utilisant les callbacks définis dans la couche de données
function handleTransfer(event) {
    event.preventDefault();
    const beneficiaryId = beneficiarySelect.value;
    const amountInput = document.getElementById("amount");
    const amount = parseFloat(amountInput.value);

    if (!beneficiaryId || isNaN(amount) || amount <= 0) {
        alert("Veuillez remplir tous les champs et saisir un montant valide.");
        return;
    }

    // appelle la fonction de transfert en chaîne de callbacks
    transferWithCallbacks(user.id, beneficiaryId, amount, (err, result) => {
        if (err) {
            alert(err);
            return;
        }
        alert("Transfert effectué avec succès !");

        // mettre à jour l'objet utilisateur en mémoire et dans sessionStorage
        user = result.sender;
        sessionStorage.setItem('currentUser', JSON.stringify(user));

        // mettre à jour l'affichage du solde et des transactions
        updateDashboard();
        closesection();
        // éventuellement, réinitialiser le formulaire
        form.reset();
    });
}

// recalculer et réafficher les infos du tableau de bord après modification
function updateDashboard() {
    // solde
    balance.textContent = user.wallet.balance + " " + user.wallet.currency;
    // revenus et dépenses
    const revenusTotal = user.wallet.transactions
        .filter(t => t.type === "credit")
        .reduce((sum, t) => sum + t.amount, 0);
    revenus.textContent = revenusTotal + " " + user.wallet.currency;
    const depensesTotal = user.wallet.transactions
        .filter(t => t.type === "debit")
        .reduce((sum, t) => sum + t.amount, 0);
    depenses.textContent = depensesTotal + " " + user.wallet.currency;
    // rafraîchir liste transactions si nécessaire
    renderRecentTransactions();
}

function renderRecentTransactions() {
    const list = document.getElementById("recentTransactionsList");
    list.innerHTML = "";
    user.wallet.transactions.slice(-5).reverse().forEach(t => {
        const item = document.createElement("div");
        item.className = "transaction-item";
        item.textContent = `${t.date} – ${t.type} – ${t.amount} ${user.wallet.currency} (${t.to})`;
        list.appendChild(item);
    });
}
document.getElementById("logoutBtn").addEventListener("click", () => {
  const dbUsers = sessionStorage.getItem('databaseUsers');
  sessionStorage.clear();
  if (dbUsers) sessionStorage.setItem('databaseUsers', dbUsers); // ← remet databaseUsers
  window.location.href = "/src/view/login.html"
});
// initialisation de l'affichage des transactions
renderRecentTransactions();



