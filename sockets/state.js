// sockets/state.js
// Mantém o estado compartilhado da aplicação para ser usado pelos diferentes handlers.

let rooms = {}
let users = {}
const roomTimers = {}

function addMessageToRoom(roomName, message) {
    if (rooms[roomName]) {
        rooms[roomName].history.push(message)
    }
}

module.exports = {
    rooms,
    users,
    roomTimers,
    addMessageToRoom,
}
