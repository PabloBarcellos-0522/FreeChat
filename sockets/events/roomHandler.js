const { rooms } = require("../state").default
const { updateParticipants } = require("../utils")

function getRoomHistory(roomName) {
    return rooms[roomName]?.history || []
}

function addMessageToRoom(roomName, message) {
    if (rooms[roomName]) {
        rooms[roomName].history.push(message)
    }
}

module.exports = (io, socket) => {
    const createRoom = (data) => {
        const { roomName, roomPassword, userName } = data
        const isPrivate = roomPassword && roomPassword.length > 0

        console.log(userName, "está criando a sala:", roomName)

        if (rooms[roomName]) {
            return socket.emit("room-creation-error", {
                message: "Nome de sala já existe. Escolha outro.",
            })
        }

        rooms[roomName] = {
            name: roomName,
            isPrivate: isPrivate,
            password: roomPassword,
            participantCount: 0,
            user: userName,
            history: [],
        }
        socket.emit("room-created", roomName)
        // Automatically update the list for everyone
        io.emit("update-rooms-list", Object.values(rooms))
    }

    const joinRoom = (data) => {
        const { roomName, roomPassword, userName } = data
        const room = rooms[roomName]

        console.log(`${userName} está tentando entrar na sala: ${roomName}`)

        if (!room) {
            return socket.emit("join-error", { message: "Sala não encontrada." })
        }

        if (room.password && room.password !== roomPassword) {
            return socket.emit("join-error", { message: "Senha incorreta." })
        }

        socket.join(roomName)
        socket.userName = userName
        socket.room = roomName

        console.log(`${userName} entrou na sala: ${roomName}`)

        room.participantCount = io.sockets.adapter.rooms.get(roomName)?.size || 0

        socket.emit("join-success", { roomName })
        socket.emit("room-history", { messages: getRoomHistory(roomName) })

        const joinMessage = {
            isSystem: true,
            message: `${userName} entrou na sala.`,
            time: new Date().toISOString(),
        }
        addMessageToRoom(roomName, joinMessage)
        io.to(roomName).emit("user-joined", { message: joinMessage.message })

        updateParticipants(io, roomName)
        io.emit("update-rooms-list", Object.values(rooms))
    }

    const leaveRoom = () => {
        const roomName = socket.room
        if (!roomName || !rooms[roomName]) return

        console.log(`${socket.userName} saiu da sala: ${roomName}`)
        socket.leave(roomName)

        rooms[roomName].participantCount = io.sockets.adapter.rooms.get(roomName)?.size || 0

        const leaveMessage = {
            isSystem: true,
            message: `${socket.userName} saiu da sala.`,
            time: new Date().toISOString(),
        }
        addMessageToRoom(roomName, leaveMessage)
        io.to(roomName).emit("user-left", { message: leaveMessage.message })

        socket.broadcast.to(roomName).emit("user:typing:stop", { userName: socket.userName })

        updateParticipants(io, roomName)
        io.emit("update-rooms-list", Object.values(rooms))

        socket.room = null
    }

    socket.on("create-room", createRoom)
    socket.on("join-room", joinRoom)
    socket.on("leave-room", leaveRoom)
}
