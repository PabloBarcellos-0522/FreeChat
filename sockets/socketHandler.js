const { rooms, users } = require("./state").default
const chatHandler = require("./events/chatHandler")
const roomHandler = require("./events/roomHandler")
const userHandler = require("./events/userHandler")

const initializeSocketHandler = (io) => {
    io.on("connection", (socket) => {
        console.log("Usuário conectado:", socket.id)

        users[socket.id] = { name: "" }
        socket.emit("update-rooms-list", Object.values(rooms))

        chatHandler(io, socket)
        roomHandler(io, socket)
        userHandler(io, socket)
    })
}

module.exports = { initializeSocketHandler }
