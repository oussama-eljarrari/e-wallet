import finduserbymail from "/src/controllers/database.js";
const email = document.getElementById("mail");
const password = document.getElementById("password");
const submit = document.getElementById("submitbtn");

submit.addEventListener("click", handler);

function handler() {
    const mail = email.value;
    const pass = password.value;
    if (mail == "" || pass == "") {
        alert("remplir tous les champs");
    } else {
        let user = finduserbymail(mail, pass);
        if (user) {
            // ← récupérer la version mise à jour
            const dbUsers = JSON.parse(sessionStorage.getItem('databaseUsers'));
            if (dbUsers) {
                const updated = dbUsers.find(u => u.id == user.id);
                if (updated) user = updated;
            }
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            alert("Login successful");
            document.location.href = "dashboard.html";
        } else {
            alert("User not found");
        }
    }
}
