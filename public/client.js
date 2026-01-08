document.addEventListener("DOMContentLoaded", () => {
    const socket = io("http://localhost:3000")

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
    const sendMessageBtn = document.getElementById("send-message-btn")
    const leaveRoomBtn = document.getElementById("leave-room-btn")

    let userName = ""
    let currentRoom = ""

    // ----------------- Event Listeners -----------------

    createRoomBtn.addEventListener("click", () => {
        const roomName = roomNameInput.value.trim()
        console.log("Tentando criar sala:", roomName)
        if (!validateUsername() || !roomName) {
            alert("Por favor, escolha um nome de usuário e um nome de sala.")
            return
        }
        const roomPassword = roomPasswordInput.value
        socket.emit("create-room", {
            roomName,
            roomPassword,
            userName: userName,
        })

        socket.emit("join-room", { roomName, roomPassword, userName })
    })

    roomsList.addEventListener("click", (e) => {
        if (e.target.tagName === "LI" || e.target.closest("li")) {
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

            socket.emit("join-room", { roomName, password, userName })
        }
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
        enterLobby()
    })

    // ----------------- Socket Event Handlers -----------------

    socket.on("connect", () => {
        console.log("Conectado ao servidor com ID:", socket.id)
    })

    socket.on("disconnect", () => {
        console.log("Desconectado do servidor.")
        alert("Você foi desconectado. Por favor, atualize a página.")
        enterLobby()
    })

    socket.on("update-rooms-list", (rooms) => {
        roomsList.innerHTML = ""
        if (rooms.length === 0) {
            roomsList.innerHTML = "<li>Nenhuma sala disponível. Crie uma!</li>"
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

    socket.on("join-error", (data) => {
        alert(`Erro ao entrar na sala: ${data.message}`)
    })

    socket.on("join-success", (data) => {
        enterChatRoom(data.roomName)
    })

    socket.on("update-participants", (participants) => {
        participantsList.innerHTML = ""
        participants.forEach((p) => {
            const li = document.createElement("li")
            li.textContent = p.username
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
        return userName !== ""
    }

    function sendMessage() {
        const message = messageInput.value.trim()
        if (message) {
            socket.emit("send-message", {
                roomName: currentRoom,
                message,
                userName,
            })
            displayMessage({ userName, message }, true) // Optimistically display message
            messageInput.value = ""
        }
    }

    function displayMessage({ userName, message, isSystem = false }, isSentByMe = false) {
        const messageElement = document.createElement("div")
        messageElement.classList.add("message")

        if (isSystem) {
            messageElement.classList.add("system-message")
            messageElement.textContent = message
        } else {
            messageElement.innerHTML = `<span class="sender">${userName}</span><span class="content">${message}</span>`
            if (isSentByMe || userName === userName) {
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
    }

    function enterChatRoom(roomName) {
        currentRoom = roomName
        chatRoomName.textContent = roomName
        lobby.style.display = "none"
        chatContainer.style.display = "flex"
        messageInput.focus()
    }
})
