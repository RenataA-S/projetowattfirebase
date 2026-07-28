// 1. CONECTAR COM O FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyBrWvuRGEOEPmlcuqWIaRpvVLPJtqWQI6g",
  authDomain: "projetochat-9bcca.firebaseapp.com",
  projectId: "projetochat-9bcca",
  storageBucket: "projetochat-9bcca.firebasestorage.app",
  messagingSenderId: "78865720122",
  appId: "1:78865720122:web:b78b5eb3467ea26c51a603"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);

// Conecta ao Firestore
const db = firebase.firestore();

// 2. SELECIONA OS ELEMENTOS DA TELA
const campoNome = document.getElementById('username');
const campoTexto = document.getElementById('message');
const btnEnviar = document.getElementById('send-btn');
const caixaMensagens = document.getElementById('chat-box');

// 3. FUNÇÃO PARA ENVIAR MENSAGEM AO FIRESTORE
function enviarMensagem() {
  const nome = campoNome.value.trim();
  const texto = campoTexto.value.trim();

  if (nome === '' || texto === '') {
    alert('Por favor, preencha o nome e a mensagem!');
    return;
  }

  // Grava uma nova mensagem no Firestore com data e hora do servidor
  db.collection("mensagens").add({
    autor: nome,
    texto: texto,
    criadoEm: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
    campoTexto.value = ''; // Limpa o campo após o envio com sucesso
  })
  .catch((error) => {
    console.error("Erro ao enviar mensagem: ", error);
    alert("Ocorreu um erro ao enviar a mensagem.");
  });
}

// 4. EVENTOS DE DISPARO
btnEnviar.addEventListener('click', enviarMensagem);

campoTexto.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    enviarMensagem();
  }
});

// 5. RECEBER MENSAGENS EM TEMPO REAL NO FIRESTORE
db.collection("mensagens")
  .orderBy("criadoEm", "asc")
  .onSnapshot((snapshot) => {
    caixaMensagens.innerHTML = '';

    snapshot.forEach((doc) => {
      const mensagem = doc.data();
      if (mensagem.autor && mensagem.texto) {
        const divMsg = document.createElement('div');
        divMsg.classList.add('msg');
        divMsg.innerHTML = `<span class="msg-user">${mensagem.autor}:</span> ${mensagem.texto}`;
        caixaMensagens.appendChild(divMsg);
      }
    });

    // Rola para o final da conversa
    caixaMensagens.scrollTop = caixaMensagens.scrollHeight;
  });