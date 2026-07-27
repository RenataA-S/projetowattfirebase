import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBrWvuRGEOEPmlcuqWIaRpvVLPJtqWQI6g",
    authDomain: "projetochat-9bcca.firebaseapp.com",
    projectId: "projetochat-9bcca",
    storageBucket: "projetochat-9bcca.firebasestorage.app",
    messagingSenderId: "78865720122",
    appId: "1:78865720122:web:b78b5eb3467ea26c51a603"
  };


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const messagesRef = collection(db, "messages");

const messagesDiv = document.getElementById("messages");
const form = document.getElementById("form");
const userInput = document.getElementById("user-input");
const messageInput = document.getElementById("message-input");

// Escutar mensagens em tempo real
const q = query(messagesRef, orderBy("createdAt", "asc"));

onSnapshot(q, (snapshot) => {
  messagesDiv.innerHTML = "";
  
  snapshot.forEach((doc) => {
    const data = doc.data();
    
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message");
    
    const authorDiv = document.createElement("div");
    authorDiv.classList.add("author");
    authorDiv.textContent = data.user || "Anônimo";
    
    const textDiv = document.createElement("div");
    textDiv.textContent = data.text;
    
    msgDiv.appendChild(authorDiv);
    msgDiv.appendChild(textDiv);
    messagesDiv.appendChild(msgDiv);
  });

  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

// Enviar mensagem
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const text = messageInput.value.trim();
  const user = userInput.value.trim();

  if (!text || !user) return;

  try {
    await addDoc(messagesRef, {
      text: text,
      user: user,
      createdAt: serverTimestamp()
    });
    
    messageInput.value = "";
  } catch (error) {
    console.error("Erro ao enviar mensagem: ", error);
  }
});