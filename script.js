// ==================== 1. CONFIGURAÇÃO FIREBASE ==================== //
const firebaseConfig = {
    apiKey: "AIzaSyBrWvuRGEOEPmlcuqWIaRpvVLPJtqWQI6g",
    authDomain: "projetochat-9bcca.firebaseapp.com",
    projectId: "projetochat-9bcca",
    storageBucket: "projetochat-9bcca.firebasestorage.app",
    messagingSenderId: "78865720122",
    appId: "1:78865720122:web:b78b5eb3467ea26c51a603"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// ==================== 2. ELEMENTOS DOM ==================== //
const authContainer = document.getElementById('auth-container');
const inputAuthEmail = document.getElementById('auth-email');
const inputAuthPassword = document.getElementById('auth-password');
const btnLogin = document.getElementById('btn-login');
const btnRegister = document.getElementById('btn-register');

const securityBarFill = document.getElementById('security-bar-fill');
const securityText = document.getElementById('security-text');

const chatContainer = document.getElementById('chat-container');
const usersList = document.getElementById('users-list');
const searchUser = document.getElementById('search-user');
const chatTargetTitle = document.getElementById('chat-target-title');

const btnLogout = document.getElementById('btn-logout');
const btnAudioCall = document.getElementById('btn-audio-call');
const btnVideoCall = document.getElementById('btn-video-call');

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

// ESTADOS GLOBAIS
let usuarioAtual = null;
let destinatarioSelecionado = null;
let listaUsuariosTodos = [];
let escutaMensagensUnsubscribe = null;
let escutaUsuariosUnsubscribe = null;
let arquivoSelecionado = null;
let localStream = null;

// ==================== 3. BARRA DE SEGURANÇA DA SENHA ==================== //
if (inputAuthPassword) {
    inputAuthPassword.addEventListener('input', () => {
        const senha = inputAuthPassword.value;
        let pontos = 0;

        if (!senha) {
            if (securityBarFill) securityBarFill.style.width = '0%';
            if (securityText) securityText.innerHTML = 'Insira a senha... ⚪';
            return;
        }

        if (senha.length >= 6) pontos += 25;
        if (senha.length >= 10) pontos += 25;
        if (/[A-Z]/.test(senha)) pontos += 25;
        if (/[0-9]/.test(senha) || /[^A-Za-z0-9]/.test(senha)) pontos += 25;

        if (securityBarFill) securityBarFill.style.width = `${pontos}%`;
        if (securityText) {
            if (pontos <= 25) {
                securityBarFill.style.backgroundColor = '#ef4444';
                securityText.innerHTML = 'Fraca 🔴';
            } else if (pontos <= 50) {
                securityBarFill.style.backgroundColor = '#f59e0b';
                securityText.innerHTML = 'Média 🟡';
            } else if (pontos <= 75) {
                securityBarFill.style.backgroundColor = '#10b981';
                securityText.innerHTML = 'Boa 🟢';
            } else {
                securityBarFill.style.backgroundColor = '#38bdf8';
                securityText.innerHTML = 'Forte 🛡️';
            }
        }
    });
}

// ==================== 4. AUTENTICAÇÃO E SESSÃO ==================== //
if (btnLogin) {
    btnLogin.addEventListener('click', () => {
        const email = inputAuthEmail.value.trim();
        const senha = inputAuthPassword.value.trim();
        if (!email || !senha) return alert('⚠️ Preencha e-mail e senha!');

        auth.signInWithEmailAndPassword(email, senha)
            .catch((err) => alert('❌ Erro no login: ' + err.message));
    });
}

if (btnRegister) {
    btnRegister.addEventListener('click', () => {
        const email = inputAuthEmail.value.trim();
        const senha = inputAuthPassword.value.trim();
        if (!email || !senha) return alert('⚠️ Preencha e-mail e senha!');

        auth.createUserWithEmailAndPassword(email, senha)
            .then((cred) => {
                // Grava o usuário cadastrado diretamente no Firestore Console na coleção "usuarios"
                return db.collection("usuarios").doc(cred.user.uid).set({
                    uid: cred.user.uid,
                    email: cred.user.email.toLowerCase(),
                    criadoEm: firebase.firestore.FieldValue.serverTimestamp()
                });
            })
            .then(() => alert('✨ Conta criada com sucesso!'))
            .catch((err) => alert('❌ Erro no cadastro: ' + err.message));
    });
}

if (btnLogout) {
    btnLogout.addEventListener('click', () => auth.signOut());
}

// OUVINTE DE ESTADO DE AUTENTICAÇÃO
auth.onAuthStateChanged((user) => {
    if (user) {
        usuarioAtual = user;
        if (authContainer) authContainer.classList.add('hidden');
        if (chatContainer) chatContainer.classList.remove('hidden');

        // Salva ou atualiza a entrada do usuário no banco de dados Firestore
        db.collection("usuarios").doc(user.uid).set({
            uid: user.uid,
            email: user.email.toLowerCase(),
            ultimoAcesso: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        carregarListaUsuarios();
    } else {
        usuarioAtual = null;
        destinatarioSelecionado = null;
        encerrarChamada();
        if (escutaUsuariosUnsubscribe) escutaUsuariosUnsubscribe();
        if (escutaMensagensUnsubscribe) escutaMensagensUnsubscribe();
        if (chatContainer) chatContainer.classList.add('hidden');
        if (authContainer) authContainer.classList.remove('hidden');

        desativarControlesChat();
    }
});

// ==================== 5. BUSCAR USUÁRIOS DO BANCO DE DADOS (FIRESTORE) ==================== //
function carregarListaUsuarios() {
    if (escutaUsuariosUnsubscribe) escutaUsuariosUnsubscribe();

    // Escuta em tempo real a coleção 'usuarios' do Firestore Console
    escutaUsuariosUnsubscribe = db.collection("usuarios").onSnapshot((snapshot) => {
        listaUsuariosTodos = [];

        snapshot.forEach((doc) => {
            const u = doc.data();
            // Adiciona todos os usuários do banco (exceto o próprio usuário logado)
            if (u.uid !== usuarioAtual.uid && u.email) {
                listaUsuariosTodos.push(u);
            }
        });

        const termoBusca = searchUser ? searchUser.value.trim().toLowerCase() : '';
        filtrarERenderizarUsuarios(termoBusca);
    }, (error) => {
        console.error("Erro ao puxar usuários do Firestore:", error);
        if (usersList) usersList.innerHTML = '<div class="empty-users">Erro ao carregar lista de usuários. Verifique as regras no Firebase Console.</div>';
    });
}

function filtrarERenderizarUsuarios(termo) {
    const filtrados = listaUsuariosTodos.filter(u => u.email.toLowerCase().includes(termo));
    renderizarListaUsuarios(filtrados);
}

function renderizarListaUsuarios(lista) {
    if (!usersList) return;
    usersList.innerHTML = '';

    if (lista.length === 0) {
        usersList.innerHTML = '<div class="empty-users">Nenhum outro usuário encontrado no banco.</div>';
        return;
    }

    lista.forEach((u) => {
        const item = document.createElement('div');
        item.classList.add('user-item');
        if (destinatarioSelecionado && destinatarioSelecionado.uid === u.uid) {
            item.classList.add('active');
        }

        const nomeExibicao = u.email ? u.email.split('@')[0] : 'Usuário';
        const inicial = u.email ? u.email.charAt(0).toUpperCase() : '?';

        item.innerHTML = `
      <div class="user-avatar">${inicial}</div>
      <div class="user-info">
        <span class="user-email" title="${u.email}">${nomeExibicao}</span>
      </div>
    `;

        item.addEventListener('click', () => selecionarUsuarioParaConversa(u));
        usersList.appendChild(item);
    });
}

if (searchUser) {
    searchUser.addEventListener('input', (e) => {
        filtrarERenderizarUsuarios(e.target.value.trim().toLowerCase());
    });
}

function selecionarUsuarioParaConversa(usuario) {
    destinatarioSelecionado = usuario;
    const nomeExibicao = usuario.email ? usuario.email.split('@')[0] : 'Usuário';

    if (chatTargetTitle) chatTargetTitle.textContent = `💬 ${nomeExibicao} (${usuario.email})`;

    ativarControlesChat();
    filtrarERenderizarUsuarios(searchUser ? searchUser.value.trim().toLowerCase() : '');
    carregarMensagensPrivadas();
}

function ativarControlesChat() {
    if (btnAudioCall) btnAudioCall.disabled = false;
    if (btnVideoCall) btnVideoCall.disabled = false;
    if (campoTexto) campoTexto.disabled = false;
    if (fileInput) fileInput.disabled = false;
    if (btnEnviar) btnEnviar.disabled = false;
    if (lblFileInput) lblFileInput.classList.remove('disabled-btn');
}

function desativarControlesChat() {
    if (btnAudioCall) btnAudioCall.disabled = true;
    if (btnVideoCall) btnVideoCall.disabled = true;
    if (campoTexto) { campoTexto.disabled = true; campoTexto.value = ''; }
    if (fileInput) fileInput.disabled = true;
    if (btnEnviar) btnEnviar.disabled = true;
    if (lblFileInput) lblFileInput.classList.add('disabled-btn');
    if (chatTargetTitle) chatTargetTitle.textContent = '💬 Selecione um Usuário';
    if (caixaMensagens) caixaMensagens.innerHTML = '<div class="empty-chat-msg">👈 Clique em qualquer pessoa na lista de usuários ao lado para abrir a conversa.</div>';
}

// ==================== 6. MENSAGENS E ANEXOS ==================== //
function obterChatRoomID(uid1, uid2) {
    return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}

async function enviarMensagem() {
    const texto = campoTexto ? campoTexto.value.trim() : '';
    if (!destinatarioSelecionado) return alert("⚠️ Selecione um usuário na lista à esquerda!");
    if (!texto && !arquivoSelecionado) return alert("⚠️ Digite uma mensagem ou anexe um arquivo!");

    if (btnEnviar) btnEnviar.disabled = true;
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

        if (campoTexto) campoTexto.value = '';
        redefinirAnexo();
    } catch (err) {
        console.error("Erro ao enviar mensagem:", err);
        alert("❌ Erro ao enviar mensagem ou anexo: " + err.message);
    } finally {
        if (btnEnviar) btnEnviar.disabled = false;
    }
}

if (btnEnviar) btnEnviar.addEventListener('click', enviarMensagem);
if (campoTexto) {
    campoTexto.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') enviarMensagem();
    });
}

function carregarMensagensPrivadas() {
    if (escutaMensagensUnsubscribe) escutaMensagensUnsubscribe();
    if (!destinatarioSelecionado) return;

    const chatRoomID = obterChatRoomID(usuarioAtual.uid, destinatarioSelecionado.uid);

    escutaMensagensUnsubscribe = db.collection("chats_privados")
        .doc(chatRoomID)
        .collection("mensagens")
        .orderBy("criadoEm", "asc")
        .onSnapshot((snapshot) => {
            if (!caixaMensagens) return;
            caixaMensagens.innerHTML = '';

            if (snapshot.empty) {
                caixaMensagens.innerHTML = `<div class="empty-chat-msg">🔒 Nenhuma mensagem ainda. Envie uma mensagem para ${destinatarioSelecionado.email}!</div>`;
                return;
            }

            snapshot.forEach((doc) => {
                const msg = doc.data();
                const divMsg = document.createElement('div');
                divMsg.classList.add('msg');

                if (msg.remetenteUid === usuarioAtual.uid) divMsg.classList.add('msg-self');

                const nomeExibicao = msg.remetenteEmail ? msg.remetenteEmail.split('@')[0] : 'Usuário';
                let html = `<span class="msg-user">👤 ${nomeExibicao}:</span> ${msg.texto || ''}`;

                if (msg.arquivo) {
                    html += `<div>`;
                    if (msg.arquivo.tipo && msg.arquivo.tipo.startsWith('image/')) {
                        html += `<a href="${msg.arquivo.url}" target="_blank"><img src="${msg.arquivo.url}" class="msg-image"/></a>`;
                    } else {
                        html += `<a href="${msg.arquivo.url}" target="_blank" class="msg-file-link">📄 ${msg.arquivo.nome}</a>`;
                    }
                    html += `</div>`;
                }

                divMsg.innerHTML = html;
                caixaMensagens.appendChild(divMsg);
            });

            caixaMensagens.scrollTop = caixaMensagens.scrollHeight;
        }, (error) => {
            console.error("Erro ao carregar mensagens:", error);
        });
}

// Configuração de Anexo e Emojis
botoesEmoji.forEach((btn) => {
    btn.addEventListener('click', () => {
        if (campoTexto && !campoTexto.disabled) {
            campoTexto.value += btn.getAttribute('data-emoji');
            campoTexto.focus();
        }
    });
});

if (fileInput) {
    fileInput.addEventListener('change', (e) => {
        const f = e.target.files[0];
        if (f) {
            arquivoSelecionado = f;
            if (fileNameDisplay) fileNameDisplay.textContent = f.name;
            if (filePreview) filePreview.classList.remove('hidden');
        }
    });
}

if (btnRemoveFile) btnRemoveFile.addEventListener('click', redefinirAnexo);

function redefinirAnexo() {
    arquivoSelecionado = null;
    if (fileInput) fileInput.value = '';
    if (filePreview) filePreview.classList.add('hidden');
}

// ==================== 7. WEBCAM E LIGAÇÃO WEBRTC ==================== //

// Servidores STUN gratuitos para descoberta de IP na conexão P2P
const rtcConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

let peerConnection = null;
let escutaSinalizacaoUnsubscribe = null;
let modoCamera = 'user'; // 'user' = Frontal/Interna | 'environment' = Traseira/Externa

/**
 * Captura o fluxo de mídia (Áudio/Vídeo)
 */
async function obterMidiaLocal(comVideo, facingMode = 'user') {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }

    const constraints = {
        audio: true,
        video: comVideo ? { facingMode: facingMode } : false
    };

    localStream = await navigator.mediaDevices.getUserMedia(constraints);

    if (localVideo) {
        localVideo.srcObject = localStream;
    }

    return localStream;
}

/**
 * Inicia ou atende uma chamada via WebRTC
 */
async function iniciarChamada(comVideo) {
    try {
        if (!destinatarioSelecionado) {
            return alert("⚠️ Selecione um usuário para iniciar a chamada!");
        }

        await obterMidiaLocal(comVideo, modoCamera);

        if (callBox) callBox.classList.remove('hidden');

        const nomeDest = destinatarioSelecionado.email ? destinatarioSelecionado.email.split('@')[0] : 'Usuário';
        if (callTitle) {
            callTitle.textContent = comVideo
                ? `📹 Chamada de Vídeo com ${nomeDest}`
                : `📞 Chamada de Voz com ${nomeDest}`;
        }

        // Criar conexão Peer-to-Peer
        peerConnection = new RTCPeerConnection(rtcConfig);

        // Adiciona as faixas de áudio/vídeo locais na conexão P2P
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });

        const chatRoomID = obterChatRoomID(usuarioAtual.uid, destinatarioSelecionado.uid);
        const callDoc = db.collection("chats_privados").doc(chatRoomID).collection("chamadas").doc("ativa");

        // Gerencia candidatos de rede (ICE Candidates)
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                callDoc.collection("candidates").add(event.candidate.toJSON());
            }
        };

        // Cria a oferta da chamada (SDP Offer)
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        await callDoc.set({
            remetenteUid: usuarioAtual.uid,
            offer: {
                type: offer.type,
                sdp: offer.sdp
            },
            comVideo: comVideo
        });

        // Escuta a resposta e os ICE Candidates do outro usuário
        ouvirSinalizacaoChamada(callDoc);

    } catch (err) {
        console.error("Erro na chamada WebRTC:", err);
        alert("❌ Erro ao acessar a mídia. Verifique permissões ou HTTPS/localhost.");
    }
}

/**
 * Escuta eventos de sinalização no Firestore
 */
function ouvirSinalizacaoChamada(callDoc) {
    escutaSinalizacaoUnsubscribe = callDoc.onSnapshot(async (snapshot) => {
        const data = snapshot.data();
        if (!data) return;

        // Quando o destinatário responde com a "Answer"
        if (peerConnection && !peerConnection.currentRemoteDescription && data.answer) {
            const answer = new RTCSessionDescription(data.answer);
            await peerConnection.setRemoteDescription(answer);
        }
    });

    // Escuta os candidatos de rede remotos
    callDoc.collection("candidates").onSnapshot((snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'added' && peerConnection) {
                const candidate = new RTCIceCandidate(change.doc.data());
                await peerConnection.addIceCandidate(candidate);
            }
        });
    });
}

/**
 * Alterna entre a câmera frontal (interna) e traseira (externa)
 */
async function alternarCamera() {
    if (!localStream) return;

    const videoTrack = localStream.getVideoTracks()[0];
    if (!videoTrack) return;

    // Inverte o modo atual
    modoCamera = (modoCamera === 'user') ? 'environment' : 'user';

    try {
        await obterMidiaLocal(true, modoCamera);

        // Se estiver em uma conexão WebRTC ativa, substitui a faixa de vídeo
        if (peerConnection) {
            const sender = peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
            if (sender) {
                const novoVideoTrack = localStream.getVideoTracks()[0];
                sender.replaceTrack(novoVideoTrack);
            }
        }
    } catch (err) {
        console.error("Erro ao alternar câmera:", err);
        alert("Não foi possível alternar a câmera neste dispositivo.");
    }
}

/**
 * Encerra a chamada local e limpa as conexões WebRTC e Firestore
 */
async function encerrarChamada() {
    // Para todas as faixas de mídia (Câmera e Microfone)
    if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
        localStream = null;
    }

    // Fecha a conexão P2P
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }

    if (escutaSinalizacaoUnsubscribe) {
        escutaSinalizacaoUnsubscribe();
        escutaSinalizacaoUnsubscribe = null;
    }

    // Limpa o estado no Firestore
    if (usuarioAtual && destinatarioSelecionado) {
        const chatRoomID = obterChatRoomID(usuarioAtual.uid, destinatarioSelecionado.uid);
        await db.collection("chats_privados").doc(chatRoomID).collection("chamadas").doc("ativa").delete().catch(() => { });
    }

    if (localVideo) localVideo.srcObject = null;
    if (callBox) callBox.classList.add('hidden');
}

// Vinculando Eventos aos Botões
if (btnVideoCall) btnVideoCall.addEventListener('click', () => iniciarChamada(true));
if (btnAudioCall) btnAudioCall.addEventListener('click', () => iniciarChamada(false));
if (btnEndCall) btnEndCall.addEventListener('click', encerrarChamada);

const btnSwitchCam = document.getElementById('btn-switch-cam');
if (btnSwitchCam) {
    btnSwitchCam.addEventListener('click', alternarCamera);
}