let rooms = {}
let users = {}

function getRoomHistory(roomName) {
    return rooms[roomName]?.history || []
}

function addMessageToRoom(roomName, message) {
    if (rooms[roomName]) {
        rooms[roomName].history.push(message)
    }
}

function updateParticipants(io, roomName) {
    if (!roomName) return

    let participants = []
    const clientsInRoom = io.sockets.adapter.rooms.get(roomName)

    if (clientsInRoom) {
        clientsInRoom.forEach((socketId) => {
            const clientSocket = io.sockets.sockets.get(socketId)
            if (clientSocket && clientSocket.userName && rooms[roomName]) {
                const isKing = rooms[roomName].user === clientSocket.userName
                participants.push({
                    id: socketId,
                    name: clientSocket.userName,
                    king: isKing,
                })
            }
        })
    }
    io.to(roomName).emit("update-participants", participants)
}

export function initializeSocketHandler(io) {
    io.on("connection", (socket) => {
        console.log("Usuário conectado:", socket.id)
        socket.emit("update-rooms-list", Object.values(rooms))
        users[socket.id] = {
            name: "",
            roomsCreated: [],
        }

        socket.on("validade-username", (data) => {
            const userName = data.userName?.trim().toLowerCase()

            if (
                !userName ||
                userName.length < 3 ||
                userName.length > 15 ||
                !/^[a-zA-Z0-9_]+$/.test(userName)
            ) {
                return socket.emit("username-validation", { isFree: false })
            }

            const isFree = !Object.values(users).some(
                (user) => user.name.toLowerCase() === userName,
            )

            socket.emit("username-validation", { isFree })
            if (isFree) {
                users[socket.id].name = userName
            }
        })

        socket.on("create-room", (data) => {
            const roomName = data.roomName
            const roomPassword = data.roomPassword
            const username = data.userName
            const isPrivate = roomPassword && roomPassword.length > 0

            console.log(username, "está criando a sala:", roomName)

            if (rooms[roomName]) {
                socket.emit("room-creation-error", {
                    message: "Nome de sala já existe. Escolha outro.",
                })
                return
            }
            users[socket.id].roomsCreated.push(roomName)
            rooms[roomName] = {
                name: roomName,
                isPrivate: isPrivate,
                password: roomPassword,
                participantCount: 0,
                user: username,
                history: [],
            }
            socket.emit("room-created", data.roomName)
        })

        socket.on("join-room", (data) => {
            socket.join(data.roomName)
            socket.userName = data.userName
            socket.room = data.roomName

            console.log(`${socket.userName} está tentando entrar na sala: ${socket.room}`)

            if (rooms[socket.room]) {
                if (rooms[socket.room].password != data.roomPassword) {
                    // Senha correta
                    socket.emit("join-error", { message: "Senha incorreta." })
                    console.log(
                        "Senha incorreta:",
                        socket.room,
                        data.roomPassword,
                        rooms[socket.room].password,
                    )
                    return
                }
                updateParticipants(io, data.roomName)
                console.log(`${socket.userName} está entrando na sala: ${socket.room}`)

                socket.emit("room-history", {
                    messages: getRoomHistory(socket.room), // Função personalizada
                })

                addMessageToRoom(socket.room, {
                    isSystem: true,
                    message: `${socket.userName} entrou na sala.`,
                    time: new Date().toISOString(),
                })
                io.to(socket.room).emit("user-joined", {
                    message: `${socket.userName} entrou na sala.`,
                    userCount: io.sockets.adapter.rooms.get(socket.room)?.size || 1,
                })

                rooms[data.roomName].participantCount =
                    io.sockets.adapter.rooms.get(data.roomName)?.size || 1

                socket.emit("join-success", { roomName: socket.room })
            } else {
                socket.emit("join-error", { message: "Sala não encontrada." })
            }
            io.emit("update-rooms-list", Object.values(rooms))
        })

        socket.on("send-message", (data) => {
            const payload = {
                name: data.userName,
                message: data.message,
                time: new Date().toISOString(),
                type: data.type || "text", // Can be 'text', 'image', or 'link'
            }
            addMessageToRoom(socket.room, payload)

            io.to(socket.room).emit("new-message", payload)
        })

        socket.on("typing:start", ({ roomName, userName }) => {
            socket.broadcast.to(roomName).emit("user:typing:start", { userName })
        })

        socket.on("typing:stop", ({ roomName, userName }) => {
            socket.broadcast.to(roomName).emit("user:typing:stop", { userName })
        })

        socket.on("leave-room", () => {
            const roomToUpdate = socket.room

            if (roomToUpdate) {
                socket.broadcast
                    .to(roomToUpdate)
                    .emit("user:typing:stop", { userName: socket.userName })
                socket.leave(roomToUpdate)
                socket.room = null

                rooms[roomToUpdate].participantCount =
                    io.sockets.adapter.rooms.get(roomToUpdate)?.size || 0

                addMessageToRoom(roomToUpdate, {
                    isSystem: true,
                    message: `${socket.userName} saiu da sala.`,
                    time: new Date().toISOString(),
                })
                io.to(roomToUpdate).emit("user-left", {
                    message: `${socket.userName} saiu da sala.`,
                    userCount: io.sockets.adapter.rooms.get(roomToUpdate)?.size || 0,
                })

                updateParticipants(io, roomToUpdate)
                io.emit("update-rooms-list", Object.values(rooms))
            }
        })

        socket.on("mousemove", (data) => {
            socket.broadcast.to(socket.room).emit("user-mousemove", {
                userName: socket.userName,
                // userName: "Pablo",
                x: data.x,
                y: data.y,
            })
            // socket.broadcast.emit("user-mousemove", {
            //     // userName: socket.userName,
            //     userName: "Pablo",
            //     x: data.x,
            //     y: data.y,
            // })
        })

        socket.on("mouseleave", () => {
            socket.broadcast.to(socket.room).emit("user-mouseleave", {
                userName: socket.userName,
            })
        })

        socket.on("disconnect", () => {
            const roomToUpdate = socket.room
            if (roomToUpdate) {
                socket.broadcast
                    .to(roomToUpdate)
                    .emit("user:typing:stop", { userName: socket.userName })
                io.to(roomToUpdate).emit("user-disconnected", {
                    message: `${socket.userName} foi desconectado.`,
                    userCount: io.sockets.adapter.rooms.get(roomToUpdate)?.size || 0,
                })

                addMessageToRoom(roomToUpdate, {
                    isSystem: true,
                    message: `${socket.userName} saiu da sala.`,
                    time: new Date().toISOString(),
                })
                io.to(roomToUpdate).emit("user-left", {
                    message: `${socket.userName} saiu da sala.`,
                    userCount: io.sockets.adapter.rooms.get(roomToUpdate)?.size || 0,
                })

                rooms[roomToUpdate].participantCount =
                    io.sockets.adapter.rooms.get(roomToUpdate)?.size || 0

                io.emit("update-rooms-list", Object.values(rooms))
            }

            updateParticipants(io, roomToUpdate)
            delete users[socket.id]
            console.log("Usuário desconectado:", socket.id)
        })
    })
}
