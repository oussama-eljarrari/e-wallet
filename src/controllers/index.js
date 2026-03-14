const btn=document.getElementById('Loginbtn');

btn.addEventListener('click',handler);
function handler(){
    btn.textContent='Logging out...';
    setTimeout(()=>{
        window.location.href='login.html';
    },2000);
}
