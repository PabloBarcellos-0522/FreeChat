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
    io.to(roomName).emit("update-participants", participants)
}

module.exports = { updateParticipants, participantsList }
