// public/js/state.js

// Mantém todo o estado do lado do cliente, como informações do usuário,
// estado da sala e dados de UI em um único objeto para fácil acesso e gerenciamento.

export const state = {
    // Informações do usuário
    userName: "",
    set setUserName(newUserName) {
        this.userName = newUserName
        localStorage.setItem("userName", newUserName)
    },

    // Estado da sala e chat
    currentRoom: null,
    roomOwnerName: null, // Nome do dono da sala
    typingTimer: null,
    isTyping: false,
    typingUsers: {}, // Usuários que estão digitando

    // Estado da UI e interações
    mouseColorIndex: 0,
    usersMouse: {}, // Posição e elemento do mouse de outros usuários
    currentZoom: 1, // Nível de zoom atual para a imagem no modal

    // Gerenciamento dos players de vídeo
    videoPlayers: {}, // Armazena instâncias dos players do YouTube
    videoPlayerQueue: [], // Fila para inicializar players após a API do YouTube carregar
    isRemoteStateChange: false, // Flag para evitar loops de eventos de vídeo (play/pause)
    // isRemoteApiChange: false, // Flag para evitar loops de eventos de API (mute/unmute)
    lastMuteState: null, // Último estado de mute conhecido
    intervals: {}, // Armazena intervalos relacionados aos vídeos
}

// Recupera o nome de usuário do localStorage na inicialização
const savedUserName = localStorage.getItem("userName")
if (savedUserName) {
    state.userName = savedUserName
    document.getElementById("username").value = savedUserName
}
