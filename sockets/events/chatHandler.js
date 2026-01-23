const { rooms } = require("../state").default

function addMessageToRoom(roomName, message) {
    if (rooms[roomName]) {
        rooms[roomName].history.push(message)
    }
}

module.exports = (io, socket) => {
    const sendMessage = (data) => {
        const payload = {
            name: data.userName,
            message: data.message,
            time: new Date().toISOString(),
            type: data.type || "text",
        }
        addMessageToRoom(socket.room, payload)
        io.to(socket.room).emit("new-message", payload)
    }

    const startTyping = ({ roomName, userName }) => {
        socket.broadcast.to(roomName).emit("user:typing:start", { userName })
    }

    const stopTyping = ({ roomName, userName }) => {
        socket.broadcast.to(roomName).emit("user:typing:stop", { userName })
    }

    socket.on("send-message", sendMessage)
    socket.on("typing:start", startTyping)
    socket.on("typing:stop", stopTyping)
}
