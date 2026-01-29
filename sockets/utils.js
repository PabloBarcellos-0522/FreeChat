// sockets/utils.js
const { rooms, roomTimers } = require("./state")

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
    const room = rooms[roomName]
    if (!room) return

    if (participants.length === 0) {
        // Remove the room after 30 minutes of inactivity
        if (!roomTimers[roomName]) {
            roomTimers[roomName] = setTimeout(() => {
                if (rooms[roomName] && participantsList(io, roomName).length === 0) {
                    delete rooms[roomName]
                    delete roomTimers[roomName]
                    io.emit("update-rooms-list", Object.values(rooms))
                }
            }, 1800000)
        }
        return
    } // We need to clear the timers to avoid "race condition" errors.
    else if (roomTimers[roomName]) {
        clearTimeout(roomTimers[roomName])
        delete roomTimers[roomName]
    }
    io.to(roomName).emit("update-participants", participants)
}

module.exports = { updateParticipants, participantsList }
