// ==================== 1. CONFIGURAÇÃO FIREBASE ==================== //
const firebaseConfig = {
  apiKey: "AIzaSyBrWvuRGEOEPmlcuqWIaRpvVLPJtqWQI6g",
  authDomain: "projetochat-9bcca.firebaseapp.com",
  projectId: "projetochat-9bcca",
  storageBucket: "projetochat-9bcca.firebasestorage.app",
  messagingSenderId: "78865720122",
  appId: "1:78865720122:web:b78b5eb3467ea26c51a603"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// ==================== 2. MAPEAMENTO DOM ==================== //
const authContainer = document.getElementById('auth-container');
const inputAuthEmail = document.getElementById('auth-email');
const inputAuthPassword = document.getElementById('auth-password');
const btnLogin = document.getElementById('btn-login');
const btnRegister = document.getElementById('btn-register');

const securityBarFill = document.getElementById('security-bar-fill');
const securityText = document.getElementById('security-text');

const chatContainer = document.getElementById('chat-container');
const btnLogout = document.getElementById('btn-logout');
const btnAudioCall = document.getElementById('btn-audio-call');
const btnVideoCall = document.getElementById('btn-video-call');

const selectRecipient = document.getElementById('select-recipient');
const campoTexto = document.getElementById('message');
const btnEnviar = document.getElementById('send-btn');
const caixaMensagens = document.getElementById('chat-box');
const botoesEmoji = document.querySelectorAll('.btn-emoji');

const fileInput = document.getElementById('file-input');
const filePreview = document.getElementById('file-preview');
const fileNameDisplay = document.getElementById('file-name');
const btnRemoveFile = document.getElementById('btn-remove-file');
const lblFileInput = document.getElementById('lbl-file-input');

const callBox = document.getElementById('call-box');
const callTitle = document.getElementById('call-title');
const localVideo = document.getElementById('local-video');
const btnEndCall = document.getElementById('btn-end-call');

// Variáveis Globais de Controle
let usuarioAtual = null;
let destinatarioSelecionado = null;
let escutaMensagensUnsubscribe = null;
let arquivoSelecionado = null;
let localStream = null;


// ==================== 3. SEGURANÇA DA SENHA ==================== //
function verificarSegurancaSenha() {
  const senha = inputAuthPassword.value;
  let pontos = 0;

  if (senha.length === 0) {
    securityBarFill.style.width = '0%';
    securityBarFill.style.backgroundColor = '#e2e8f0';
    securityText.innerHTML = 'Insira a senha... ⚪';
    securityText.style.color = '#555';
    return;
  }

  if (senha.length >= 6) pontos += 25;
  if (senha.length >= 10) pontos += 25;
  if (/[A-Z]/.test(senha)) pontos += 25;
  if (/[0-9]/.test(senha) || /[^A-Za-z0-9]/.test(senha)) pontos += 25;

  if (pontos <= 25) {
    securityBarFill.style.width = '25%';
    securityBarFill.style.backgroundColor = '#ef4444';
    securityText.innerHTML = 'Fraca 🔴';
    securityText.style.color = '#dc2626';
  } else if (pontos <= 50) {
    securityBarFill.style.width = '50%';
    securityBarFill.style.backgroundColor = '#f59e0b';
    securityText.innerHTML = 'Média 🟡';
    securityText.style.color = '#d97706';
  } else if (pontos <= 75) {
    securityBarFill.style.width = '75%';
    securityBarFill.style.backgroundColor = '#10b981';
    securityText.innerHTML = 'Boa 🟢';
    securityText.style.color = '#059669';
  } else {
    securityBarFill.style.width = '100%';
    securityBarFill.style.backgroundColor = '#38bdf8';
    securityText.innerHTML = 'Muito Forte 🛡️🩵';
    securityText.style.color = '#0288d1';
  }
}
inputAuthPassword.addEventListener('input', verificarSegurancaSenha);


// ==================== 4. EMOJIS & ANEXOS ==================== //
botoesEmoji.forEach((botao) => {
  botao.addEventListener('click', () => {
    if (!campoTexto.disabled) {
      campoTexto.value += botao.getAttribute('data-emoji');
      campoTexto.focus();
    }
  });
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    arquivoSelecionado = file;
    fileNameDisplay.textContent = file.name;
    filePreview.classList.remove('hidden');
  }
});

btnRemoveFile.addEventListener('click', redefinirAnexo);

function redefinirAnexo() {
  arquivoSelecionado = null;
  fileInput.value = '';
  filePreview.classList.add('hidden');
  fileNameDisplay.textContent = '';
}


// ==================== 5. CHAMADAS DE WEBCAM E VOZ ==================== //
async function iniciarChamada(comVideo) {
  try {
    if (!destinatarioSelecionado) {
      alert("⚠️ Selecione um usuário para realizar a chamada!");
      return;
    }

    const restricoes = {
      audio: true,
      video: comVideo
    };

    localStream = await navigator.mediaDevices.getUserMedia(restricoes);
    localVideo.srcObject = localStream;
    callBox.classList.remove('hidden');

    callTitle.textContent = comVideo 
      ? `📹 Chamada de Vídeo com ${destinatarioSelecionado.email}...` 
      : `📞 Chamada de Voz com ${destinatarioSelecionado.email}...`;

  } catch (error) {
    console.error("Erro ao acessar câmera/microfone:", error);
    alert("❌ Permissão negada ou webcam/microfone não encontrado!");
  }
}

function encerrarChamada() {
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }
  localVideo.srcObject = null;
  callBox.classList.add('hidden');
}

btnVideoCall.addEventListener('click', () => iniciarChamada(true));
btnAudioCall.addEventListener('click', () => iniciarChamada(false));
btnEndCall.addEventListener('click', encerrarChamada);


// ==================== 6. AUTENTICAÇÃO E TROCA DE TELAS ==================== //
function realizarLogin() {
  const email = inputAuthEmail.value.trim();
  const senha = inputAuthPassword.value.trim();

  if (!email || !senha) {
    alert('⚠️ Preencha e-mail e senha!');
    return;
  }

  auth.signInWithEmailAndPassword(email, senha)
    .then(() => {
      inputAuthEmail.value = '';
      inputAuthPassword.value = '';
      verificarSegurancaSenha();
    })
    .catch((err) => alert('❌ Falha ao entrar: ' + err.message));
}

function criarConta() {
  const email = inputAuthEmail.value.trim();
  const senha = inputAuthPassword.value.trim();

  if (!email || !senha) {
    alert('⚠️ Preencha e-mail e senha!');
    return;
  }

  auth.createUserWithEmailAndPassword(email, senha)
    .then((credencial) => {
      return db.collection("usuarios").doc(credencial.user.uid).set({
        uid: credencial.user.uid,
        email: credencial.user.email
      });
    })
    .then(() => {
      alert('✨ Conta criada com sucesso!');
      inputAuthEmail.value = '';
      inputAuthPassword.value = '';
    })
    .catch((err) => alert('❌ Erro ao criar conta: ' + err.message));
}

btnLogout.addEventListener('click', () => auth.signOut());
btnLogin.addEventListener('click', realizarLogin);
btnRegister.addEventListener('click', criarConta);


// OUVINTE DE ESTADO DO USUÁRIO (CONTROLA A EXIBIÇÃO DAS TELAS)
auth.onAuthStateChanged((user) => {
  if (user) {
    usuarioAtual = user;
    
    // OCULTA TELA DE LOGIN E MOSTRA A TELA DO CHAT
    authContainer.classList.add('hidden');
    chatContainer.classList.remove('hidden');

    db.collection("usuarios").doc(user.uid).set({
      uid: user.uid,
      email: user.email
    }, { merge: true });

    carregarListaUsuarios();
  } else {
    usuarioAtual = null;
    encerrarChamada();
    
    // OCULTA TELA DO CHAT E MOSTRA APENAS O LOGIN
    chatContainer.classList.add('hidden');
    authContainer.classList.remove('hidden');
  }
});


// ==================== 7. SELEÇÃO DE USUÁRIOS E CHAT PRIVADO ==================== //
function carregarListaUsuarios() {
  db.collection("usuarios").onSnapshot((snapshot) => {
    selectRecipient.innerHTML = '<option value="">-- Selecione um usuário --</option>';
    
    snapshot.forEach((doc) => {
      const u = doc.data();
      if (u.uid !== usuarioAtual.uid) {
        const option = document.createElement('option');
        option.value = u.uid;
        option.textContent = u.email;
        option.dataset.email = u.email;
        selectRecipient.appendChild(option);
      }
    });
  });
}

selectRecipient.addEventListener('change', (e) => {
  const uidDestino = e.target.value;
  const emailDestino = e.target.options[e.target.selectedIndex].dataset.email;

  if (!uidDestino) {
    destinatarioSelecionado = null;
    bloquearCamposChat(true);
    caixaMensagens.innerHTML = '<div class="empty-chat-msg">👈 Selecione um usuário acima para iniciar uma conversa privada.</div>';
    if (escutaMensagensUnsubscribe) escutaMensagensUnsubscribe();
    return;
  }

  destinatarioSelecionado = { uid: uidDestino, email: emailDestino };
  bloquearCamposChat(false);
  carregarMensagensPrivadas();
});

function bloquearCamposChat(bloquear) {
  campoTexto.disabled = bloquear;
  fileInput.disabled = bloquear;
  btnEnviar.disabled = bloquear;
  
  if (bloquear) {
    lblFileInput.classList.add('disabled-btn');
  } else {
    lblFileInput.classList.remove('disabled-btn');
  }
}

function obterChatRoomID(uid1, uid2) {
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}


// ==================== 8. ENVIAR E RECEBER MENSAGENS PRIVADAS ==================== //
async function enviarMensagem() {
  const texto = campoTexto.value.trim();

  if (!destinatarioSelecionado) return;
  if (!texto && !arquivoSelecionado) {
    alert("⚠️ Digite uma mensagem ou anexe um arquivo!");
    return;
  }

  btnEnviar.disabled = true;
  btnEnviar.textContent = '⏳ Enviando...';

  let fileData = null;

  try {
    if (arquivoSelecionado) {
      const storageRef = storage.ref(`anexos_privados/${Date.now()}_${arquivoSelecionado.name}`);
      const uploadTask = await storageRef.put(arquivoSelecionado);
      const fileUrl = await uploadTask.ref.getDownloadURL();

      fileData = {
        url: fileUrl,
        nome: arquivoSelecionado.name,
        tipo: arquivoSelecionado.type
      };
    }

    const chatRoomID = obterChatRoomID(usuarioAtual.uid, destinatarioSelecionado.uid);

    await db.collection("chats_privados")
      .doc(chatRoomID)
      .collection("mensagens")
      .add({
        remetenteUid: usuarioAtual.uid,
        remetenteEmail: usuarioAtual.email,
        texto: texto,
        arquivo: fileData,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp()
      });

    campoTexto.value = '';
    redefinirAnexo();
  } catch (error) {
    console.error("Erro ao enviar:", error);
    alert("❌ Erro ao enviar mensagem privada.");
  } finally {
    btnEnviar.disabled = false;
    btnEnviar.textContent = '📨 Enviar Mensagem Privada';
  }
}

btnEnviar.addEventListener('click', enviarMensagem);
campoTexto.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') enviarMensagem();
});

function carregarMensagensPrivadas() {
  if (escutaMensagensUnsubscribe) escutaMensagensUnsubscribe();

  const chatRoomID = obterChatRoomID(usuarioAtual.uid, destinatarioSelecionado.uid);

  escutaMensagensUnsubscribe = db.collection("chats_privados")
    .doc(chatRoomID)
    .collection("mensagens")
    .orderBy("criadoEm", "asc")
    .onSnapshot((snapshot) => {
      caixaMensagens.innerHTML = '';

      if (snapshot.empty) {
        caixaMensagens.innerHTML = `<div class="empty-chat-msg">🔒 Nenhuma mensagem ainda. Inicie a conversa com ${destinatarioSelecionado.email}!</div>`;
        return;
      }

      snapshot.forEach((doc) => {
        const msg = doc.data();
        const divMsg = document.createElement('div');
        divMsg.classList.add('msg');

        if (msg.remetenteUid === usuarioAtual.uid) {
          divMsg.classList.add('msg-self');
        }

        let html = `<span class="msg-user">👤 ${msg.remetenteEmail.split('@')[0]}:</span> ${msg.texto || ''}`;

        if (msg.arquivo) {
          html += `<div class="msg-attachment">`;
          if (msg.arquivo.tipo && msg.arquivo.tipo.startsWith('image/')) {
            html += `<a href="${msg.arquivo.url}" target="_blank">
                      <img src="${msg.arquivo.url}" alt="${msg.arquivo.nome}" class="msg-image" />
                    </a>`;
          } else {
            html += `<a href="${msg.arquivo.url}" target="_blank" class="msg-file-link">
                      📄 ${msg.arquivo.nome}
                    </a>`;
          }
          html += `</div>`;
        }

        divMsg.innerHTML = html;
        caixaMensagens.appendChild(divMsg);
      });

      caixaMensagens.scrollTop = caixaMensagens.scrollHeight;
    });
}