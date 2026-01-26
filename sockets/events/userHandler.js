const { users, rooms, addMessageToRoom } = require("../state")
const { updateParticipants } = require("../utils")

module.exports = (io, socket) => {
    const validateUsername = (data) => {
        const userName = data.userName?.trim()
        if (
            !userName ||
            userName.length < 3 ||
            userName.length > 15 ||
            !/^[a-zA-Z0-9_]+$/.test(userName)
        ) {
            return socket.emit("username-validation", { isFree: false })
        }

        const isFree = !Object.values(users).some(
            (user) => user.name.toLowerCase() === userName.toLowerCase(),
        )

        if (isFree) {
            users[socket.id].name = userName
            socket.userName = userName // Attach username to the socket for easy access
        }
        socket.emit("username-validation", { isFree, userName: data.userName.trim() })
    }

    const onMouseMove = (data) => {
        if (!socket.room) return
        socket.broadcast.to(socket.room).emit("user-mousemove", {
            userName: socket.userName,
            x: data.x,
            y: data.y,
        })
    }

    const onMouseLeave = () => {
        if (!socket.room) return
        socket.broadcast.to(socket.room).emit("user-mouseleave", {
            userName: socket.userName,
        })
    }

    const onDisconnect = () => {
        console.log("Usuário desconectado:", socket.id, socket.userName)
        const roomName = socket.room
        if (roomName && rooms[roomName]) {
            rooms[roomName].participantCount = io.sockets.adapter.rooms.get(roomName)?.size || 0

            const disconnectMessage = {
                isSystem: true,
                message: `${socket.userName} saiu da sala.`,
                time: new Date().toISOString(),
            }
            addMessageToRoom(roomName, disconnectMessage)
            io.to(roomName).emit("user-left", { message: disconnectMessage.message })

            // Ensure typing indicator is removed
            socket.broadcast.to(roomName).emit("user:typing:stop", { userName: socket.userName })

            updateParticipants(io, roomName)
            io.emit("update-rooms-list", Object.values(rooms))
        }
        delete users[socket.id]
    }

    socket.on("validade-username", validateUsername)
    socket.on("mousemove", onMouseMove)
    socket.on("mouseleave", onMouseLeave)
    socket.on("disconnect", onDisconnect)
}
