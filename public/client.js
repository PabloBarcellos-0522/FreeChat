document.addEventListener("DOMContentLoaded", () => {
    const socket = io("http://localhost:3000")
    console.log("Cliente socket.io inicializado.", socket.id)

    // Lobby elements
    const lobby = document.getElementById("lobby")
    const usernameInput = document.getElementById("username")
    const createRoomBtn = document.getElementById("create-room-btn")
    const roomNameInput = document.getElementById("room-name")
    const roomPasswordInput = document.getElementById("room-password")
    const roomsList = document.getElementById("rooms-list")

    // Chat elements
    const chatContainer = document.getElementById("chat-container")
    const chatRoomName = document.getElementById("chat-room-name")
    const participantsList = document.getElementById("participants-list")
    const messages = document.getElementById("messages")
    const messageInput = document.getElementById("message-input")
    const sendMediaBtn = document.getElementById("send-media-btn")
    const sendMessageBtn = document.getElementById("send-message-btn")
    const leaveRoomBtn = document.getElementById("leave-room-btn")
    const mediaInput = document.getElementById("media-input")

    // Image Modal Elements
    const imageModal = document.getElementById("image-modal")
    const modalImage = document.getElementById("modal-image")
    const closeModalBtn = document.querySelector(".modal-close")

    let userName = ""
    let setUserName = ""
    let currentRoom = ""

    // ----------------- Event Listeners -----------------

    usernameInput.addEventListener("change", () => {
        if (validateUsername()) {
            socket.emit("validade-username", { userName })
        }
    })

    createRoomBtn.addEventListener("click", () => {
        const roomName = roomNameInput.value.trim()
        console.log("Tentando criar sala:", roomName)
        if (!validateUsername() || !roomName) {
            alert("Por favor, escolha um nome de usuário válido e um nome de sala.")
            return
        }
        const roomPassword = roomPasswordInput.value
        console.log("Criando sala:", roomName, roomPassword)
        socket.emit("create-room", {
            roomName,
            roomPassword,
            userName,
        })

        socket.emit("join-room", { roomName, roomPassword, userName })
    })

    roomsList.addEventListener("click", (e) => {
        const item = e.target.closest("li")

        if (
            (e.target.tagName === "LI" || e.target.closest("li")) &&
            !item.classList.contains("void")
        ) {
            const li = e.target.closest("li")
            const roomName = li.dataset.roomName
            const isPrivate = li.dataset.private === "true"

            if (!validateUsername()) {
                alert("Por favor, escolha um nome de usuário antes de entrar em uma sala.")
                return
            }

            let password = ""
            if (isPrivate) {
                password = prompt("Esta sala é privada. Por favor, digite a senha:")
                if (password === null) return // User cancelled
            }

            socket.emit("join-room", { roomName, roomPassword: password, userName })
        }
    })

    sendMediaBtn.addEventListener("click", () => {
        mediaInput.click()
    })

    mediaInput.addEventListener("change", () => {
        const file = mediaInput.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = () => {
            const base64String = reader.result
            socket.emit("send-message", {
                roomName: currentRoom,
                message: base64String,
                type: "image",
                userName,
            })
        }
        reader.readAsDataURL(file)
        mediaInput.value = "" // Reset for next selection
    })

    sendMessageBtn.addEventListener("click", sendMessage)
    messageInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault()
            sendMessage()
        }
    })

    leaveRoomBtn.addEventListener("click", () => {
        console.log("Saindo da sala:", currentRoom)
        socket.emit("leave-room", { roomName: currentRoom, userName })
        document.getElementById("participant-container").style.display = "none"
        enterLobby()
    })

    // ----------------- Image Modal Logic -----------------
    let currentZoom = 1
    const zoomStep = 0.1
    const maxZoom = 3
    const minZoom = 0.5

    messages.addEventListener("click", (e) => {
        if (e.target.tagName === "IMG" && e.target.classList.contains("chat-image")) {
            imageModal.style.display = "flex"
            modalImage.src = e.target.src
        }
    })

    function closeModal() {
        imageModal.style.display = "none"
        modalImage.src = "" // Clear the image source
        resetZoom()
    }

    function resetZoom() {
        currentZoom = 1
        modalImage.style.transform = `scale(${currentZoom})`
    }

    closeModalBtn.addEventListener("click", closeModal)

    imageModal.addEventListener("wheel", (e) => {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -zoomStep : zoomStep
        const newZoom = currentZoom + delta

        if (newZoom >= minZoom && newZoom <= maxZoom) {
            currentZoom = newZoom
            modalImage.style.transform = `scale(${currentZoom})`
        }
    })

    // Close modal if clicking outside the image (on the overlay)
    imageModal.addEventListener("click", (e) => {
        if (e.target === imageModal) {
            closeModal()
        }
    })

    modalImage.addEventListener("click", (e) => {
        e.stopPropagation()
        resetZoom()
    })

    // ----------------- Socket Event Handlers -----------------

    socket.on("connect", () => {
        console.log("Conectado ao servidor")
    })

    socket.on("disconnect", () => {
        enterLobby()
        console.log("Desconectado do servidor.")
        setTimeout(() => {
            alert("Você foi desconectado. Por favor, atualize a página.")
            location.reload()
        }, 100)
    })

    socket.on("username-validation", (data) => {
        if (data.isFree) {
            console.log("Nome de usuário disponível:", userName)
            setUserName = userName
        } else {
            alert("Nome de usuário já está em uso. Por favor, escolha outro.")
            userName = ""
            usernameInput.value = ""
        }
    })

    socket.on("room-history", (data) => {
        displayHistory(data.messages)
    })

    socket.on("update-rooms-list", (rooms) => {
        roomsList.innerHTML = ""
        if (rooms.length === 0) {
            roomsList.innerHTML = "<li class='void'>Nenhuma sala disponível. Crie uma!</li>"
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
            roomsList.appendChild(li)
        })
    })

    socket.on("user-joined", (data) => {
        displayMessage({ message: data.message, isSystem: true })
    })

    socket.on("user-left", (data) => {
        displayMessage({ message: data.message, isSystem: true })
    })

    socket.on("join-error", (data) => {
        alert(`Erro ao entrar na sala: ${data.message}`)
    })

    socket.on("join-success", (data) => {
        document.getElementById("participant-container").style.display = "block"
        enterChatRoom(data.roomName)
    })

    socket.on("update-participants", (participants) => {
        participantsList.innerHTML = ""
        participants.forEach((p) => {
            const li = document.createElement("li")

            if (p.king) {
                li.textContent = "👑 " + p.name
            } else {
                li.textContent = "👥 " + p.name
            }

            if (p.id === socket.id) {
                li.textContent += " (Você)"
                li.style.fontWeight = "bold"
            }
            participantsList.appendChild(li)
        })
    })

    socket.on("new-message", (data) => {
        displayMessage(data)
    })

    // ----------------- Helper Functions -----------------

    function validateUsername() {
        userName = usernameInput.value.trim()
        if (userName.length < 3 || userName.length > 15) {
            alert("O nome de usuário deve ter entre 3 e 15 caracteres.")
            userName = setUserName
            usernameInput.value = setUserName
            return false
        } else if (!/^[a-zA-Z0-9_]+$/.test(userName)) {
            alert("O nome de usuário só pode conter letras, números e underscores.")
            userName = setUserName
            usernameInput.value = setUserName
            return false
        }

        return userName !== ""
    }

    function sendMessage() {
        const message = messageInput.value.trim()
        if (message) {
            const urlRegex = /(https?:\/\/[^\s]+)/g
            const isLink = urlRegex.test(message)

            socket.emit("send-message", {
                roomName: currentRoom,
                message,
                type: isLink ? "link" : "text",
                userName,
            })
            messageInput.value = ""
        }
    }

    function displayHistory(messagesArray) {
        messagesArray.forEach((msg) => {
            displayMessage(msg)
        })
        messages.scrollTop = messages.scrollHeight
    }

    function createMessageContent(data) {
        const { message, type = "text" } = data
        const imageRegex = /\.(jpeg|jpg|gif|png|webp)$/i

        if (type === "image") {
            return `<img src="${message}" alt="Imagem enviada" class="chat-image">`
        }

        const urlRegex = /(https?:\/\/[^\s]+)/g
        return message.replace(urlRegex, (url) => {
            if (imageRegex.test(url)) {
                return `<a href="${url}" target="_blank" rel="noopener noreferrer"><img src="${url}" alt="Imagem de um link" class="chat-image"></a>`
            } else {
                return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
            }
        })
    }

    function displayMessage(data) {
        const { name, message, isSystem = false } = data
        const messageElement = document.createElement("div")
        messageElement.classList.add("message")

        const contentHTML = createMessageContent(data)
        messageElement.innerHTML = `<span class="sender">${name}</span><span class="content">${contentHTML}</span>`

        if (isSystem) {
            messageElement.classList.add("system-message")
            messageElement.innerHTML = `<em>${message}</em>`
        } else {
            if (userName === name) {
                messageElement.classList.add("sent")
            } else {
                messageElement.classList.add("received")
            }
        }

        messages.appendChild(messageElement)
        messages.scrollTop = messages.scrollHeight
    }

    function enterLobby() {
        lobby.style.display = "block"
        chatContainer.style.display = "none"
        currentRoom = ""
        chatRoomName.textContent = ""
        messages.innerHTML = ""
        participantsList.innerHTML = ""
        document.getElementById("participant-container").style.display = "none"
    }

    function enterChatRoom(roomName) {
        currentRoom = roomName
        chatRoomName.textContent = roomName
        lobby.style.display = "none"
        chatContainer.style.display = "flex"
        messages.scrollTop = messages.scrollHeight
        messageInput.focus()
    }
})
