// essaye de restaurer les utilisateurs depuis la session, sinon on conserve les valeurs par défaut
const defaultUsers = [
    {
        id: "1",
        name: "Ali",
        email: "Ali@example.com",
        password: "1232",
        wallet: {
            balance: 12457,
            currency: "MAD",
            cards: [
                { numcards: "124847", type: "visa", balance: "14712", expiry: "14-08-27", vcc: "147" },
                { numcards: "124478", type: "mastercard", balance: "1470", expiry: "14-08-28", vcc: "257" },
            ],
            transactions: [
                { id: "1", type: "credit", amount: 140, date: "14-08-25", from: "Ahmed", to: "124847" },
                { id: "2", type: "debit", amount: 200, date: "13-08-25", from: "124847", to: "Amazon" },
                { id: "3", type: "credit", amount: 250, date: "12-08-25", from: "Ahmed", to: "124478" },
            ]

        }
    },
    {
        id: "2",
        name: "Ahmed",
        email: "Ahmed@example.com",
        password: "456",
        wallet: {
            balance: 9876,
            currency: "MAD",
            cards: [
                { numcards: "123456", type: "visa", balance: "9876", expiry: "14-08-29", vcc: "369" },
            ],
            transactions: [
                { id: "4", type: "credit", amount: 100, date: "14-08-26", from: "Ali", to: "123456" },
                { id: "5", type: "debit", amount: 150, date: "13-08-26", from: "123456", to: "Google" },
            ]
        }
    }
];

let stored = null;
try {
    stored = JSON.parse(sessionStorage.getItem('databaseUsers'));
} catch { }

const database = {
    users: stored && Array.isArray(stored) ? stored : defaultUsers
};

// helper to synchronize database back to session
function persistDatabase() {
    sessionStorage.setItem('databaseUsers', JSON.stringify(database.users));
}

const finduserbymail = (mail, password) => {
    return database.users.find((u) => u.email === mail && u.password === password
    );
}

// retourne un utilisateur par identifiant et invoque le callback avec le résultat
const getUserById = (id, cb) => {
    const user = database.users.find(u => u.id == id);
    cb(user);
};

// calcule (ou renvoie) le solde courant d'un utilisateur.
// ici on se contente de renvoyer la valeur stockée dans wallet.balance,
// car les transactions antérieures ne sont pas suffisantes pour reconstruire
// correctement le solde initial.
function computeBalance(user) {
    if (!user) return 0;
    return user.wallet.balance;
}

// transfert avec callbacks : vérification d'existence et de solde
function transferWithCallbacks(senderId, beneficiaryId, amount, cb) {
    getUserById(senderId, sender => {
        if (!sender) return cb("Utilisateur expéditeur introuvable");
        // vérifier le solde réel stocké dans l'objet
        if (sender.wallet.balance < amount) return cb("Solde insuffisant");
        getUserById(beneficiaryId, beneficiary => {
            if (!beneficiary) return cb("Bénéficiaire introuvable");

            const date = new Date().toISOString().split('T')[0];
            const debitTxn = {
                id: (sender.wallet.transactions.length + 1).toString(),
                type: "debit",
                amount,
                date,
                from: sender.name,
                to: beneficiary.name
            };
            const creditTxn = {
                id: (beneficiary.wallet.transactions.length + 1).toString(),
                type: "credit",
                amount,
                date,
                from: sender.name,
                to: beneficiary.name
            };

            // ajuster explicitement les soldes
            sender.wallet.balance -= amount;
            beneficiary.wallet.balance += amount;

            sender.wallet.transactions.push(debitTxn);
            beneficiary.wallet.transactions.push(creditTxn);

            // sauvegarder le nouvel état en session pour que les transactions persistent
            persistDatabase();

            cb(null, { sender, beneficiary, debitTxn, creditTxn });
        });
    });
}

export { database, getUserById, computeBalance, transferWithCallbacks, persistDatabase };

export default finduserbymail;