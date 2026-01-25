// public/js/listeners.js
import { state } from "./state.js"
import { elements, enterLobby, closeModal, resetZoom } from "./ui.js"
import { socket } from "./socket.js"

function validateUsername() {
    let newUserName = elements.usernameInput.value.trim()
    if (newUserName.length < 3 || newUserName.length > 15) {
        alert("O nome de usuário deve ter entre 3 e 15 caracteres.")
        elements.usernameInput.value = state.setUserName
        return false
    }
    if (!/^[a-zA-Z0-9_]+$/.test(newUserName)) {
        alert("O nome de usuário só pode conter letras, números e underscores.")
        elements.usernameInput.value = state.setUserName
        return false
    }
    state.userName = newUserName
    return true
}

function sendMessage() {
    const message = elements.messageInput.value.trim()
    if (message) {
        const urlRegex = /(https?:\/\/[^\s]+)/g
        const isLink = urlRegex.test(message)

        socket.emit("send-message", {
            roomName: state.currentRoom,
            message,
            type: isLink ? "link" : "text",
            userName: state.userName,
        })
        clearTimeout(state.typingTimer)
        socket.emit("typing:stop", { roomName: state.currentRoom, userName: state.userName })
        state.isTyping = false
        elements.messageInput.value = ""
    }
}

export function registerDomEvents() {
    document.addEventListener("mousemove", (event) => {
        socket.emit("mousemove", {
            x: event.clientX / window.innerWidth,
            y: event.clientY / window.innerHeight,
        })
    })

    document.addEventListener("mouseleave", () => {
        socket.emit("mouseleave", {})
    })

    elements.usernameInput.addEventListener("change", () => {
        if (validateUsername()) {
            socket.emit("validade-username", { userName: state.userName })
        }
    })

    elements.createRoomBtn.addEventListener("click", () => {
        const roomName = elements.roomNameInput.value.trim()
        if (!validateUsername() || !roomName) {
            alert("Por favor, escolha um nome de usuário válido e um nome de sala.")
            return
        }
        socket.emit("create-room", {
            roomName,
            roomPassword: elements.roomPasswordInput.value,
            userName: state.userName,
        })
    })

    elements.roomsList.addEventListener("click", (e) => {
        const item = e.target.closest("li")
        if (item && !item.classList.contains("void")) {
            if (!validateUsername()) {
                alert("Por favor, escolha um nome de usuário antes de entrar em uma sala.")
                return
            }
            const roomName = item.dataset.roomName
            const isPrivate = item.dataset.private === "true"
            let password = ""
            if (isPrivate) {
                password = prompt("Esta sala é privada. Por favor, digite a senha:")
                if (password === null) return
            }
            socket.emit("join-room", { roomName, roomPassword: password, userName: state.userName })
        }
    })

    elements.sendMediaBtn.addEventListener("click", () => {
        elements.mediaInput.click()
    })

    elements.mediaInput.addEventListener("change", () => {
        const file = elements.mediaInput.files[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => {
            socket.emit("send-message", {
                roomName: state.currentRoom,
                message: reader.result,
                type: "image",
                userName: state.userName,
            })
        }
        reader.readAsDataURL(file)
        elements.mediaInput.value = ""
    })

    elements.sendMessageBtn.addEventListener("click", sendMessage)
    elements.messageInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault()
            sendMessage()
        }
    })

    elements.messageInput.addEventListener("input", () => {
        clearTimeout(state.typingTimer)
        if (!state.isTyping) {
            socket.emit("typing:start", { roomName: state.currentRoom, userName: state.userName })
            state.isTyping = true
        }
        state.typingTimer = setTimeout(() => {
            socket.emit("typing:stop", { roomName: state.currentRoom, userName: state.userName })
            state.isTyping = false
        }, 1000)
    })

    elements.leaveRoomBtn.addEventListener("click", () => {
        socket.emit("leave-room", { roomName: state.currentRoom, userName: state.userName })
        enterLobby()
    })

    // --- Modal and Video Fullscreen Listeners ---
    const zoomStep = 0.1,
        maxZoom = 3,
        minZoom = 0.5

    elements.messages.addEventListener("click", (e) => {
        // Image modal
        if (e.target.tagName === "IMG" && e.target.classList.contains("chat-image")) {
            elements.imageModal.style.display = "flex"
            elements.modalImage.src = e.target.src
            return
        }

        // Unauthorized video fullscreen
        const unauthorizedVideo = e.target.closest(".video-wrapper.unauthorized")
        if (unauthorizedVideo) {
            const uniqueInstanceId = unauthorizedVideo.dataset.uniqueinstanceid
            const player = state.videoPlayers[uniqueInstanceId]?.player
            if (player && typeof player.getIframe === "function") {
                const iframe = player.getIframe()
                if (iframe && typeof iframe.requestFullscreen === "function") {
                    iframe.requestFullscreen()
                }
            }
        }
    })

    elements.closeModalBtn.addEventListener("click", closeModal)

    elements.imageModal.addEventListener("wheel", (e) => {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -zoomStep : zoomStep
        const newZoom = state.currentZoom + delta
        if (newZoom >= minZoom && newZoom <= maxZoom) {
            state.currentZoom = newZoom
            elements.modalImage.style.transform = `scale(${state.currentZoom})`
        }
    })

    elements.imageModal.addEventListener("click", (e) => {
        if (e.target === elements.imageModal) closeModal()
    })

    elements.modalImage.addEventListener("click", (e) => {
        e.stopPropagation()
        resetZoom()
    })

    elements.addVideo.addEventListener("click", () => {
        // const videoID = prompt("Por favor, insira o ID do vídeo do YouTube:")
        console.log("Botão de adicionar vídeo clicado")
        const videoID = "bHYe6U0c4GA"
        if (videoID) {
            socket.emit("request-video-init", { userName: state.userName, videoID })
        }
    })
}
