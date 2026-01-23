// sockets/state.js
// Mantém o estado compartilhado da aplicação para ser usado pelos diferentes handlers.

let rooms = {}
let users = {}

module.exports = {
    rooms,
    users,
}
