// sockets/utils.js
const { rooms } = require("./state")

function participantsList(io, roomName) {
    console.log("Obtendo lista de participantes para a sala:", roomName)
    if (!roomName || !rooms[roomName]) return []

    let participants = []
    const clientsInRoom = io.sockets.adapter.rooms.get(roomName)

    if (clientsInRoom) {
        clientsInRoom.forEach((socketId) => {
            const clientSocket = io.sockets.sockets.get(socketId)
            if (clientSocket && clientSocket.userName) {
                const isKing = rooms[roomName].owner === clientSocket.userName
                participants.push({
                    id: socketId,
                    name: clientSocket.userName,
                    king: isKing,
                })
            }
        })
    }
    return participants
}

function updateParticipants(io, roomName) {
    const participants = participantsList(io, roomName)
    if (participants.length === 0) {
        // Remove the room after 30 minutes of inactivity
        setTimeout(() => {
            const participantsFinal = participantsList(io, roomName)
            if (participantsFinal.length === 0) {
                delete rooms[roomName]
                io.emit("update-rooms-list", Object.values(rooms))
            }
        }, 1800000)
        return
    }
    io.to(roomName).emit("update-participants", participants)
}

module.exports = { updateParticipants, participantsList }
