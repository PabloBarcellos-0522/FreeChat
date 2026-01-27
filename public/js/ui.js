// public/js/ui.js
import { state } from "./state.js"
import { socket } from "./socket.js"

// --- Element Selectors ---
export const elements = {
    messages: document.getElementById("messages"),
    participantsContainer: document.getElementById("participants-container"),
    lobby: document.getElementById("lobby"),
    usernameInput: document.getElementById("username"),
    createRoomBtn: document.getElementById("create-room-btn"),
    roomNameInput: document.getElementById("room-name"),
    roomPasswordInput: document.getElementById("room-password"),
    roomsList: document.getElementById("rooms-list"),
    chatContainer: document.getElementById("chat-container"),
    chatRoomName: document.getElementById("chat-room-name"),
    participantsList: document.getElementById("participants-list"),
    messageInput: document.getElementById("message-input"),
    sendMediaBtn: document.getElementById("send-media-btn"),
    sendMessageBtn: document.getElementById("send-message-btn"),
    leaveRoomBtn: document.getElementById("leave-room-btn"),
    mediaInput: document.getElementById("media-input"),
    typingIndicator: document.getElementById("typing-indicator"),
    imageModal: document.getElementById("image-modal"),
    modalImage: document.getElementById("modal-image"),
    closeModalBtn: document.querySelector(".modal-close"),
    app: document.getElementById("app"),
    addVideo: document.getElementById("add-video"),
    requestMediaDialog: document.getElementById("request-media-dialog"),
    requesterUsername: document.getElementById("requester-username"),
    acceptMediaBtn: document.getElementById("accept-resquest-media"),
}

const mouseColors = [
    "#ffffff",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FFA500",
    "#800080",
    "#008000",
    "#FFC0CB",
    "#8B4513",
    "#4682B4",
    "#000000",
]

function getNextMouseColor() {
    const color = mouseColors[state.mouseColorIndex % mouseColors.length]
    state.mouseColorIndex++
    return color
}

// --- UI Manipulation Functions ---

export function displayMessage(data) {
    const { name, message, isSystem = false } = data
    const messageElement = document.createElement("div")
    messageElement.classList.add("message")

    const contentHTML = createMessageContent(data)
    messageElement.innerHTML = `<span class="sender">${name}</span><span class="content">${contentHTML}</span>`

    if (isSystem) {
        messageElement.classList.add("system-message")
        messageElement.innerHTML = `<em>${message}</em>`
    } else {
        if (state.userName === name) {
            messageElement.classList.add("sent")
        } else {
            messageElement.classList.add("received")
        }
    }
    elements.messages.appendChild(messageElement)
    elements.messages.scrollTop = elements.messages.scrollHeight
}

export function displayHistory(messagesArray) {
    messagesArray.forEach((msg) => displayMessage(msg))
    elements.messages.scrollTop = elements.messages.scrollHeight
}

export function updateRoomsList(rooms) {
    elements.roomsList.innerHTML = ""
    if (rooms.length === 0) {
        elements.roomsList.innerHTML = "<li class='void'>Nenhuma sala disponível. Crie uma!</li>"
        return
    }
    rooms.forEach((room) => {
        const li = document.createElement("li")
        li.dataset.roomName = room.name
        li.dataset.private = room.isPrivate
        li.innerHTML = `
            <span>${room.name}</span>
            <div class="room-info">
                ${room.isPrivate ? '<span class="lock-icon">🔒</span>' : ""}
                <span class="participant-count">${room.participantCount}</span>
            </div>
        `
        elements.roomsList.appendChild(li)
    })
}

export function updateParticipants(participants, socketId) {
    elements.participantsList.innerHTML = ""
    state.roomOwnerName = null
    participants.forEach((p) => {
        if (p.king) {
            state.roomOwnerName = p.name
        }
        const li = document.createElement("li")
        li.textContent = (p.king ? "👑 " : "👥 ") + p.name
        if (p.id === socketId) {
            li.textContent += " (Você)"
            li.style.fontWeight = "bold"
        }
        elements.participantsList.appendChild(li)
    })
}

export function updateTypingIndicator() {
    const names = Object.keys(state.typingUsers)
    if (names.length === 0) {
        elements.typingIndicator.innerHTML = ""
        return
    }
    let text =
        names.length === 1
            ? `<strong>${names[0]}</strong> está digitando`
            : names.length === 2
              ? `<strong>${names[0]}</strong> e <strong>${names[1]}</strong> estão digitando`
              : "Vários usuários estão digitando"
    elements.typingIndicator.innerHTML = `
        <span>${text}</span>
        <span class="dots"><span>.</span><span>.</span><span>.</span></span>`
}

export function updateUserMouse(data) {
    let userData = state.usersMouse[data.userName]
    if (!userData || document.getElementById(`mouse-${data.userName}`) === null) {
        const assignedColor = userData ? userData.color : getNextMouseColor()
        const html = `
            <div class="userMouse" id="mouse-${data.userName}" style="color: ${assignedColor};">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"><path fill="currentColor" stroke="#000000" stroke-width="2" d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.35Z"></path></svg>
                <h1 style="font-size: 14px;">${data.userName}</h1>
            </div>
        `
        elements.app.insertAdjacentHTML("beforeend", html)
        state.usersMouse[data.userName] = {
            element: document.getElementById(`mouse-${data.userName}`),
            x: data.x,
            y: data.y,
            color: assignedColor,
        }
        userData = state.usersMouse[data.userName]
    }
    userData.x = data.x
    userData.y = data.y
    const posX = data.x * window.innerWidth
    const posY = data.y * window.innerHeight
    userData.element.style.transform = `translate3d(${posX}px, ${posY}px, 0)`
}

export function removeUserMouse(data) {
    const userData = state.usersMouse[data.userName]
    if (userData && userData.element) {
        userData.element.remove()
        // Deleting the user mouse data could be an option, but keeping it
        // helps retain color if they return quickly.
        // delete state.usersMouse[data.userName];
    }
}

export function enterLobby() {
    elements.lobby.style.display = "block"
    elements.chatContainer.style.display = "none"
    state.currentRoom = ""
    elements.chatRoomName.textContent = ""
    elements.messages.innerHTML = ""
    elements.participantsList.innerHTML = ""
    document.getElementById("participant-container").style.display = "none"

    state.videoPlayers = {}
    state.videoPlayerQueue = []

    console.log(state.intervals)
    for (const id in state.intervals) {
        clearInterval(state.intervals[id])
    }
    console.log(state.intervals)
}

export function enterChatRoom(roomName) {
    state.currentRoom = roomName
    elements.chatRoomName.textContent = roomName
    elements.lobby.style.display = "none"
    elements.chatContainer.style.display = "flex"
    elements.messages.scrollTop = elements.messages.scrollHeight
    elements.messageInput.focus()
    document.getElementById("participant-container").style.display = "block"
}

function onPlayerReady(event, uniqueInstanceId, videoID) {
    const player = event.target
    console.log(`Player ${videoID} (Instance: ${uniqueInstanceId}) está pronto.`)
    state.videoPlayers[uniqueInstanceId] = {
        player: player,
        isMuted: player.isMuted(),
        videoID: videoID, // Armazena o videoID original
    }

    startMuteCheck(player, uniqueInstanceId)
}

// function onPlayerApiChange(event, uniqueInstanceId) {
//     console.log(`/??????`)
//     if (state.isRemoteApiChange) {
//         state.isRemoteApiChange = false
//         return
//     }

//     const player = event.target
//     const playerState = state.videoPlayers[uniqueInstanceId]
//     if (!playerState) return

//     const isMutedNow = player.isMuted()
//     if (isMutedNow !== playerState.isMuted) {
//         console.log(
//             `EMIT: video-control '${isMutedNow ? "mute" : "unmute"}' para ${playerState.videoID} (Instance: ${uniqueInstanceId})`,
//         )
//         socket.emit("video-control", {
//             uniqueInstanceId: uniqueInstanceId, // Passa o ID da instância para o servidor
//             videoID: playerState.videoID, // Passa o ID do vídeo para autorização
//             action: isMutedNow ? "mute" : "unmute",
//         })
//         playerState.isMuted = isMutedNow
//     }
// }

function startMuteCheck(player, uniqueInstanceId) {
    const id = setInterval(() => {
        const currentState = player.isMuted()
        if (currentState !== state.lastMuteState) {
            state.lastMuteState = currentState
            console.log(currentState ? "Vídeo Silenciado" : "Som Ativado")

            // Aqui você pode disparar sua lógica customizada
            document.dispatchEvent(new CustomEvent("muteChanged", { detail: currentState }))

            const playerState = state.videoPlayers[uniqueInstanceId]
            socket.emit("video-control", {
                uniqueInstanceId: uniqueInstanceId, // Passa o ID da instância para o servidor
                videoID: playerState.videoID, // Passa o ID do vídeo para autorização
                action: player.isMuted() ? "mute" : "unmute",
            })
        }
    }, 500) // Verifica a cada meio segundo
    state.intervals[uniqueInstanceId] = id
}

function onPlayerStateChange(event, uniqueInstanceId) {
    if (state.isRemoteStateChange) {
        state.isRemoteStateChange = false
        return
    }

    const playerState = state.videoPlayers[uniqueInstanceId]
    const player = playerState?.player
    if (!player) return

    switch (event.data) {
        case YT.PlayerState.PLAYING:
            console.log(
                `EMIT: video-control 'play' para ${playerState.videoID} (Instance: ${uniqueInstanceId})`,
            )
            socket.emit("video-control", {
                uniqueInstanceId: uniqueInstanceId, // Passa o ID da instância para o servidor
                videoID: playerState.videoID, // Passa o ID do vídeo para autorização
                action: "play",
                time: player.getCurrentTime(),
                timestamp: Date.now(),
            })
            break
        case YT.PlayerState.PAUSED:
            console.log(
                `EMIT: video-control 'pause' para ${playerState.videoID} (Instance: ${uniqueInstanceId})`,
            )
            socket.emit("video-control", {
                uniqueInstanceId: uniqueInstanceId, // Passa o ID da instância para o servidor
                videoID: playerState.videoID, // Passa o ID do vídeo para autorização
                action: "pause",
                time: player.getCurrentTime(),
                timestamp: Date.now(),
            })
            break
        case YT.PlayerState.ENDED:
            console.log(`Player ${playerState.videoID} (Instance: ${uniqueInstanceId}) terminou`)
            break
    }
}

export function initializeQueuedPlayers() {
    if (!window.YT || !window.YT.Player) {
        console.log("A API do YouTube ainda não está pronta. Tentando novamente em 100ms.")
        setTimeout(initializeQueuedPlayers, 100)
        return
    }

    if (state.videoPlayerQueue.length === 0) {
        return
    }

    console.log(`Inicializando ${state.videoPlayerQueue.length} player(s) na fila.`)
    state.videoPlayerQueue.forEach(({ uniqueInstanceId, videoID }) => {
        // Pega uniqueInstanceId
        if (!document.getElementById(uniqueInstanceId)) {
            console.warn(
                `Container ${uniqueInstanceId} não encontrado no DOM. O vídeo pode não ter sido renderizado ainda.`,
            )
            return
        }
        // Evita reinicializar um player que já existe (chave é uniqueInstanceId)
        if (state.videoPlayers[uniqueInstanceId]) {
            console.log(`Player para ${uniqueInstanceId} já inicializado.`)
            return
        }

        // Adiciona uma entrada temporária para evitar recriação em chamadas rápidas
        // O onReady irá preencher o objeto completo
        state.videoPlayers[uniqueInstanceId] = {}

        console.log(`Criando player para videoID: ${videoID} no container: ${uniqueInstanceId}`)
        new YT.Player(uniqueInstanceId, {
            height: "225",
            width: "400",
            videoId: videoID,
            playerVars: { playsinline: 1, enablejsapi: 1 },
            events: {
                onReady: (event) => onPlayerReady(event, uniqueInstanceId, videoID), // Passa uniqueInstanceId e videoID
                onStateChange: (event) => onPlayerStateChange(event, uniqueInstanceId),
                // onApiChange: (event) => onPlayerApiChange(event, uniqueInstanceId),
            },
        })
    })

    // Limpa a fila após processar
    state.videoPlayerQueue = []
}

function createMessageContent(data) {
    const { message, type = "text", name } = data
    const imageRegex = /\.(jpeg|jpg|gif|png|webp)$/i
    if (type === "image") {
        return `<img src="${message}" alt="Imagem enviada" class="chat-image">`
    } else if (type === "video") {
        // const uniqueInstanceId = `${data.videoID}-${Date.now()}-${Math.floor(Math.random() * 1000)}`; // uniqueInstanceId now comes from the server
        const uniqueInstanceId = data.uniqueInstanceId
        const isAuthorized = state.userName === state.roomOwnerName || state.userName === name
        const unauthorizedClass = !isAuthorized ? "unauthorized" : ""

        // Adiciona o vídeo à fila para ser inicializado quando a API estiver pronta
        state.videoPlayerQueue.push({ uniqueInstanceId, videoID: data.videoID }) // Armazena uniqueInstanceId

        // Gatilho para processar a fila. O setTimeout garante que o elemento
        // estará no DOM antes da inicialização.
        setTimeout(initializeQueuedPlayers, 0)

        // Retornamos o container com data-lenis-prevent para não bugar o scroll suave
        return `
            <div class="video-wrapper ${unauthorizedClass}" data-lenis-prevent data-uniqueinstanceid="${uniqueInstanceId}">
                <div id="${uniqueInstanceId}"></div>
            </div>
        `
    }
    const urlRegex = /(https?:\/\/[^\s]+)/g
    return message.replace(urlRegex, (url) =>
        imageRegex.test(url)
            ? `<a href="${url}" target="_blank" rel="noopener noreferrer"><img src="${url}" alt="Imagem de um link" class="chat-image"></a>`
            : `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`,
    )
}

export function resetZoom() {
    state.currentZoom = 1
    elements.modalImage.style.transform = `scale(${state.currentZoom})`
}

export function closeModal() {
    elements.imageModal.style.display = "none"
    elements.modalImage.src = ""
    resetZoom()
}
