import e from "express"

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

export function initializeSocketHandler(io) {
    io.on("connection", (socket) => {
        console.log("Usuário conectado:", socket.id)
        socket.emit("update-rooms-list", Object.values(rooms))
        users[socket.id] = {
            name: "",
            roomsCreated: [],
        }

        socket.on("validade-username", (data) => {
            console.log("Validando nome de usuário:", data.userName)
            const userName = data.userName
            const isFree = !Object.values(users).some((user) => {
                if (user.name === userName) {
                    console.log("Nome de usuário já está em uso:", userName)
                    return true
                }
            })

            // console.log(users, isFree)

            socket.emit("username-validation", { isFree })
            if (isFree) {
                users[socket.id].name = userName
            }
        })

        socket.on("create-room", (data) => {
            console.log("Criando sala com dados:", data)

            const roomName = data.roomName
            const roomPassword = data.roomPassword
            const username = data.userName
            const isPrivate = roomPassword && roomPassword.length > 0

            console.log(username, "está criando a sala:", roomName)

            users[socket.id].roomsCreated.push(roomName)
            rooms[roomName] = {
                name: roomName,
                isPrivate: isPrivate,
                password: roomPassword,
                participants: [],
                participantCount: 0,
                user: username,
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

            // rooms[socket.room].participants.push(users[socket.id])
            // console.log("Participantes da sala:", rooms[socket.room].participants)

            let participants = []
            const clientsInRoom = io.sockets.adapter.rooms.get(socket.room)

            if (clientsInRoom) {
                clientsInRoom.forEach((socketId) => {
                    const socket = io.sockets.sockets.get(socketId)
                    if (socket && socket.userName) {
                        if (rooms[socket.room].user === socket.userName) {
                            participants.push({ id: socketId, name: socket.userName, king: true })
                        } else {
                            participants.push({ id: socketId, name: socket.userName, king: false })
                        }
                    }
                })
            }
            io.to(socket.room).emit("update-participants", participants)

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

                let participants = []
                const clientsInRoom = io.sockets.adapter.rooms.get(socket.room)

                if (clientsInRoom) {
                    clientsInRoom.forEach((socketId) => {
                        const socket = io.sockets.sockets.get(socketId)
                        if (socket && socket.userName) {
                            participants.push({ id: socketId, name: socket.userName })
                        }
                    })
                }
                io.to(socket.room).emit("update-participants", participants)

                socket.emit("update-participants", rooms[socket.room].participants)
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

            let participants = []
            const clientsInRoom = io.sockets.adapter.rooms.get(socket.room)

            if (clientsInRoom) {
                clientsInRoom.forEach((socketId) => {
                    const socket = io.sockets.sockets.get(socketId)
                    if (socket && socket.userName) {
                        if (rooms[socket.room].user === socket.userName) {
                            participants.push({ id: socketId, name: socket.userName, king: true })
                        } else {
                            participants.push({ id: socketId, name: socket.userName, king: false })
                        }
                    }
                })
            }
            io.to(socket.room).emit("update-participants", participants)

            delete users[socket.id]
            console.log("Usuário desconectado:", socket.id)
        })
    })
}
