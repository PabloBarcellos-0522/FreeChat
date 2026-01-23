// sockets/utils.js
const { rooms } = require("./state").default

function updateParticipants(io, roomName) {
    if (!roomName || !rooms[roomName]) return

    let participants = []
    const clientsInRoom = io.sockets.adapter.rooms.get(roomName)

    if (clientsInRoom) {
        clientsInRoom.forEach((socketId) => {
            const clientSocket = io.sockets.sockets.get(socketId)
            if (clientSocket && clientSocket.userName) {
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

module.exports = { updateParticipants }
