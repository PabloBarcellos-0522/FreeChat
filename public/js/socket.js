// public/js/socket.js
import { state } from "./state.js"
import * as ui from "./ui.js"

// Initialize the socket connection
export const socket = io("http://localhost:3000")
console.log("Cliente socket.io inicializado.", socket.id)

// Function to register all socket event handlers
export function registerSocketEvents() {
    socket.on("connect", () => {
        console.log("Conectado ao servidor")
    })

    socket.on("disconnect", () => {
        ui.enterLobby()
        console.log("Desconectado do servidor.")
        setTimeout(() => {
            alert("Você foi desconectado. Por favor, atualize a página.")
            location.reload()
        }, 100)
    })

    socket.on("username-validation", (data) => {
        if (data.isFree) {
            console.log("Nome de usuário disponível:", state.userName)
            state.setUserName = state.userName
        } else {
            alert("Nome de usuário já está em uso. Por favor, escolha outro.")
            state.userName = ""
            ui.elements.usernameInput.value = ""
        }
    })

    socket.on("user-mousemove", ui.updateUserMouse)
    socket.on("user-mouseleave", ui.removeUserMouse)

    socket.on("room-created", (roomName) => {
        console.log("Sala criada com sucesso:", roomName)
        const roomPassword = ui.elements.roomPasswordInput.value
        ui.elements.roomNameInput.value = ""
        ui.elements.roomPasswordInput.value = ""
        socket.emit("join-room", { roomName, roomPassword, userName: state.userName })
    })

    socket.on("room-creation-error", (data) => {
        alert(`Erro ao criar sala: ${data.message}`)
    })

    socket.on("room-history", (data) => {
        ui.displayHistory(data.messages)
        // Após exibir o histórico, inicializa quaisquer players de vídeo que foram enfileirados.
        ui.initializeQueuedPlayers()
    })

    socket.on("update-rooms-list", ui.updateRoomsList)

    socket.on("user-joined", (data) => {
        ui.displayMessage({ message: data.message, isSystem: true })
    })

    socket.on("user-left", (data) => {
        ui.displayMessage({ message: data.message, isSystem: true })
    })

    socket.on("join-error", (data) => {
        alert(`Erro ao entrar na sala: ${data.message}`)
    })

    socket.on("join-success", (data) => {
        ui.enterChatRoom(data.roomName)
    })

    socket.on("update-participants", (participants) => {
        ui.updateParticipants(participants, socket.id)
    })

    socket.on("new-message", (data) => {
        if (state.typingUsers[data.name]) {
            delete state.typingUsers[data.name]
            ui.updateTypingIndicator()
        }

        console.log("Nova mensagem recebida:", data)
        ui.displayMessage(data)
    })

    socket.on("user:typing:start", ({ userName }) => {
        console.log(`${userName} está digitando...`)
        state.typingUsers[userName] = true
        ui.updateTypingIndicator()
    })

    socket.on("user:typing:stop", ({ userName }) => {
        console.log(`${userName} parou de digitar...`)
        delete state.typingUsers[userName]
        ui.updateTypingIndicator()
    })

    // --- Video Sync Events ---

    socket.on("video-sync", (data) => {
        console.log("Evento 'video-sync' recebido", data)
        const player = state.videoPlayers[data.uniqueInstanceId]?.player
        if (!player) {
            console.warn(`Player para uniqueInstanceId ${data.uniqueInstanceId} não encontrado.`)
            return
        }

        if (data.action === "mute") {
            // state.isRemoteApiChange = true
            player.mute()
            return
        }
        if (data.action === "unmute") {
            // state.isRemoteApiChange = true
            player.unMute()
            return
        }

        // Ações que precisam de seek (play/pause)
        state.isRemoteStateChange = true
        if (data.time) {
            player.seekTo(data.time, true)
        }

        if (data.action === "play") {
            player.playVideo()
        } else if (data.action === "pause") {
            player.pauseVideo()
        }
    })
}
