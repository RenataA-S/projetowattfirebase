// 1. Importa os módulos do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js";

// 2. Configuração do seu projeto
const firebaseConfig = {
  <script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyDnWFy0JSEDZmvmCyiQymQqJeVT9KRlkEo",
    authDomain: "projetowattfirebase.firebaseapp.com",
    projectId: "projetowattfirebase",
    storageBucket: "projetowattfirebase.firebasestorage.app",
    messagingSenderId: "65999014156",
    appId: "1:65999014156:web:4de8c12614259ef23e2129"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
</script>


// 3. Inicializa o Firebase e o Banco
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const msgsRef = ref(db, 'mensagens');

// 4. Elementos da Tela
const inputUsuario = document.getElementById('usuario');
const inputTexto = document.getElementById('texto');
const btnEnviar = document.getElementById('btnEnviar');
const caixaMensagens = document.getElementById('mensagens');

// 5. Função para Enviar Mensagem
btnEnviar.addEventListener('click', () => {
  const usuario = inputUsuario.value.trim();
  const texto = inputTexto.value.trim();

  if (usuario !== "" && texto !== "") {
    push(msgsRef, { usuario, texto });
    inputTexto.value = ""; // Limpa a caixa de texto
  }
});

// 6. Receber Mensagens em Tempo Real
onValue(msgsRef, (snapshot) => {
  caixaMensagens.innerHTML = "";
  snapshot.forEach((child) => {
    const msg = child.val();
    const div = document.createElement('div');
    div.classList.add('msg-item');
    div.innerHTML = `<strong>${msg.usuario}:</strong> ${msg.texto}`;
    caixaMensagens.appendChild(div);
  });
  caixaMensagens.scrollTop = caixaMensagens.scrollHeight; // Rola até o fim
});