export function initializeSocketHandler(io) {
    io.on("connection", (socket) => {
        console.log("Usuário conectado:", socket.id)

        // Entrar em uma sala
        socket.on("join-room", (roomName, userName) => {
            socket.join(roomName)
            socket.userName = userName
            socket.room = roomName

            // Notificar outros usuários na sala
            socket.to(roomName).emit("user-joined", {
                message: `${userName} entrou na sala.`,
                userCount: io.sockets.adapter.rooms.get(roomName)?.size || 1,
            })

            // Enviar histórico (opcional, com Redis ou memória)
            socket.emit("room-history", {
                messages: getRoomHistory(roomName), // Função personalizada
            })
        })

        // Enviar mensagem na sala
        socket.on("send-message", (message) => {
            const payload = {
                user: socket.userName,
                text: message,
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
                io.to(socket.room).emit("user-left", {
                    message: `${socket.userName} saiu da sala.`,
                    userCount: io.sockets.adapter.rooms.get(socket.room)?.size || 0,
                })
                socket.room = null
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
