// 1. CONECTAR COM O FIREBASE /* Título da etapa de inicialização */
// coloque a sua chave de projeto aqui /* Local reservado para o objeto firebaseConfig com credenciais */


// Objeto hipotético de configuração do Firebase (deve ser preenchido com os dados do console do Firebase)
const firebaseConfig = {
  apiKey: "AIzaSyBrWvuRGEOEPmlcuqWIaRpvVLPJtqWQI6g",
  authDomain: "projetochat-9bcca.firebaseapp.com",
  projectId: "projetochat-9bcca",
  storageBucket: "projetochat-9bcca.firebasestorage.app",
  messagingSenderId: "78865720122",
  appId: "1:78865720122:web:b78b5eb3467ea26c51a603"
};

// Inicializa o Firebase /* Comentário de inicialização */
firebase.initializeApp(firebaseConfig); /* Executa a função do SDK que conecta a aplicação às chaves do projeto */


// ⚠️ CONECTA AO FIRESTORE (substituiu a linha firebase.database()) /* Comentário referente à API do Cloud Firestore */
const db = firebase.firestore(); /* Obtém a instância do banco de dados Firestore e armazena na variável 'db' */


// 2. SELECIONA OS ELEMENTOS DA TELA /* Título da etapa de captura de elementos DOM */
const campoNome = document.getElementById('username'); /* Busca e armazena o input do nome do usuário */
const campoTexto = document.getElementById('message'); /* Busca e armazena o input de mensagem */
const btnEnviar = document.getElementById('send-btn'); /* Busca e armazena o botão de envio */
const caixaMensagens = document.getElementById('chat-box'); /* Busca e armazena a div que exibirá as mensagens */


/// 3. FUNÇÃO PARA ENVIAR MENSAGEM AO FIRESTORE
function js() {
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

  if (nome === '' || texto === '') { /* Verifica se qualquer um dos dois campos está vazio */
    alert('Por favor, preencha o nome e a mensagem!'); /* Dispara um alerta nativo pedindo o preenchimento dos dados */
    return; /* Interrompe a execução da função imediatamente se os campos estiverem inválidos */
  } /* Fim do teste de validação */


  // Grava uma nova mensagem no Firestore com data e hora do servidor /* Comentário explicativo */
  db.collection("mensagens").add({ /* Acessa a coleção "mensagens" no Firestore e adiciona um novo documento */
    autor: nome, /* Grava o nome do usuário no campo 'autor' */
    texto: texto, /* Grava a mensagem digitada no campo 'texto' */
    criadoEm: firebase.firestore.FieldValue.serverTimestamp() /* Grava a marca temporal oficial gerada no servidor */
  }); /* Fim da operação de escrita no banco */


  campoTexto.value = ''; /* Limpa o campo da mensagem preparando-o para uma nova digitação */
} /* Fim da função enviarMensagem */


// 4. EVENTOS DE DISPARO /* Título do bloco de ouvintes de eventos */
btnEnviar.addEventListener('click', enviarMensagem); /* Associa o clique do mouse no botão de envio à função enviarMensagem */


campoTexto.addEventListener('keypress', (e) => { /* Adiciona um escutador de teclas digitadas no campo de texto */
  if (e.key === 'Enter') { /* Verifica se a tecla pressionada foi a tecla 'Enter' */
    enviarMensagem(); /* Chama a função enviarMensagem caso o Enter seja pressionado */
  } /* Fim do teste de tecla */
}); /* Fim do ouvinte do evento keypress */


// 5. RECEBER MENSAGENS EM TEMPO REAL NO FIRESTORE /* Título do bloco de leitura e renderização em tempo real */
db.collection("mensagens") /* Seleciona a coleção "mensagens" do Firestore */
  .orderBy("criadoEm", "asc") /* Ordena os documentos recuperados pelo campo 'criadoEm' em ordem ascendente (antigo ao novo) */
  .onSnapshot((snapshot) => { /* Assina um ouvinte em tempo real que executa o callback sempre que o banco atualizar */
    // Limpa o container para renderizar a lista atualizada /* Comentário da estratégia de re-renderização */
    caixaMensagens.innerHTML = ''; /* Esvazia o conteúdo HTML da div chat-box antes de reinserir as mensagens */


    snapshot.forEach((doc) => { /* Percorre cada documento presente no snapshot recebido do banco */
      const mensagem = doc.data(); /* Extrai o objeto de dados com os campos do documento atual */
      if (mensagem.autor && mensagem.texto) { /* Valida se o documento possui os atributos autor e texto preenchidos */
        const divMsg = document.createElement('div'); /* Cria dinamicamente um novo elemento HTML <div> na memória */
        divMsg.classList.add('msg'); /* Adiciona a classe 'msg' à div recém-criada para aplicar a estilização CSS */
        divMsg.innerHTML = `<span class="msg-user">${mensagem.autor}:</span> ${mensagem.texto}`; /* Preenche a div com o nome do autor e o texto */
        caixaMensagens.appendChild(divMsg); /* Insere o novo elemento divMsg dentro da caixaMensagens na tela */
      } /* Fim da verificação do documento */
    }); /* Fim do loop forEach */


    // Rola para o final da conversa /* Comentário orientativo */
    caixaMensagens.scrollTop = caixaMensagens.scrollHeight; /* Ajusta a posição de rolagem vertical para o limite inferior */
  }); /* Fim da escuta no Snapshot */
