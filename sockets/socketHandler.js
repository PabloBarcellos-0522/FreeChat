let rooms = {}

function getRoomHistory(roomName) {
    return rooms[roomName]?.history || []
}

function addMessageToRoom(roomName, message) {
    if (rooms[roomName]) {
        rooms[roomName].history.push(message)
    }
}

export function initializeSocketHandler(io) {
    io.on("connection", (socket) => {
        console.log("Usuário conectado:", socket.id)
        socket.emit("update-rooms-list", Object.values(rooms))

        socket.on("create-room", (data) => {
            console.log("Criando sala com dados:", data)

            const roomName = data.roomName
            const roomPassword = data.roomPassword
            const username = data.username
            const isPrivate = roomPassword && roomPassword.length > 0

            rooms[roomName] = {
                name: roomName,
                isPrivate: isPrivate,
                password: roomPassword,
                participantCount: 0,
                history: [],
            }
            socket.emit("room-created", data.roomName)
        })

        // Entrar em uma sala
        socket.on("join-room", (data) => {
            socket.join(data.roomName)
            socket.userName = data.userName
            socket.room = data.roomName

            console.log(`${socket.userName} está entrando na sala: ${socket.room}`)

            socket.emit("room-history", {
                messages: getRoomHistory(socket.room), // Função personalizada
            })

            addMessageToRoom(socket.room, {
                isSystem: true,
                message: `${socket.userName} entrou na sala.`,
                time: new Date().toISOString(),
            })

            // Notificar outros usuários na sala
            io.to(socket.room).emit("user-joined", {
                message: `${socket.userName} entrou na sala.`,
                userCount: io.sockets.adapter.rooms.get(socket.room)?.size || 1,
            })

            rooms[data.roomName].participantCount =
                io.sockets.adapter.rooms.get(data.roomName)?.size || 1

            socket.emit("join-success", { roomName: socket.room })
            io.emit("update-rooms-list", Object.values(rooms))
        })

        // Enviar mensagem na sala
        socket.on("send-message", (data) => {
            const payload = {
                name: data.userName,
                message: data.message,
                time: new Date().toISOString(),
            }

            // Salvar no histórico
            addMessageToRoom(socket.room, payload)

            // Enviar para todos na sala, exceto o remetente
            io.to(socket.room).emit("new-message", payload)
        })

        // Sair da sala
        socket.on("leave-room", () => {
            if (socket.room) {
                socket.leave(socket.room)
                rooms[socket.room].participantCount =
                    io.sockets.adapter.rooms.get(socket.room)?.size || 0

                // io.to(socket.room).emit("user-left", {
                //     message: `${socket.userName} saiu da sala.`,
                //     userCount: io.sockets.adapter.rooms.get(socket.room)?.size || 0,
                // })
                // socket.room = null

                console.log(
                    "Saindo da sala:",
                    socket.room,
                    io.sockets.adapter.rooms.get(socket.room)?.size || 0
                )
                io.emit("update-rooms-list", Object.values(rooms))
            }
        })

        // Desconexão
        socket.on("disconnect", () => {
            if (socket.room) {
                io.to(socket.room).emit("user-disconnected", {
                    message: `${socket.userName} foi desconectado.`,
                    userCount: io.sockets.adapter.rooms.get(socket.room)?.size || 0,
                })
            }
            console.log("Usuário desconectado:", socket.id)
        })
    })
}
