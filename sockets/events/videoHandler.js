const { users, rooms, addMessageToRoom } = require("../state")
const { participantsList } = require("../utils")

module.exports = (io, socket) => {
    const videoInit = (data) => {
        console.log("Iniciando vídeo com dados:", data)
        const payload = {
            name: data.userName,
            videoID: data.videoID,
            uniqueInstanceId: `${data.videoID}-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // Server generates unique ID
            time: new Date().toISOString(),
            type: "video",
        }
        addMessageToRoom(socket.room, payload)
        io.to(socket.room).emit("new-message", payload)
    }

    const authorizeVideoControl = (videoID) => {
        const room = rooms[socket.room]
        if (!room) return false

        // O dono da sala sempre pode controlar
        console.log(room.owner, socket.id, socket.userName)
        if (socket.userName === room.owner) {
            console.log(
                `Autorização concedida para ${socket.userName} controlar o vídeo ${videoID}. Dono da sala: ${room.owner}`,
            )
            return true
        }

        // Encontra a mensagem original do vídeo no histórico
        const videoMessage = room.history.find(
            (msg) => msg.type === "video" && msg.videoID === videoID,
        )

        // Se o vídeo existe, verifica se o usuário que o adicionou é o mesmo que está tentando controlar
        if (videoMessage && videoMessage.name === socket.userName) {
            return true
        }

        console.log(
            `Autorização negada para ${socket.userName} controlar o vídeo ${videoID}. Dono da sala: ${
                io.sockets.sockets.get(room.owner)?.userName
            }, Dono do vídeo: ${videoMessage?.name}`,
        )
        return false
    }

    const requestVideoInit = (data) => {
        console.log("Requisição de inicialização de vídeo recebida:", data)
        const participant = participantsList(io, socket.room).find(
            (p) => p.name === socket.userName,
        )

        if (participant) {
            if (participant.king) {
                videoInit(data)
            } else {
                // Envia o pedido de autorização para o dono da sala (king)
                const name = rooms[socket.room]?.owner
                const socketId = Object.keys(users).find((key) => users[key].name === name)

                if (socketId) {
                    socket.to(socketId).emit("request-video-init", {
                        userName: socket.userName,
                        videoID: data.videoID,
                    })
                }
            }
        }
    }

    const onVideoControl = (data) => {
        if (authorizeVideoControl(data.videoID)) {
            console.log("Evento 'video-control' autorizado, transmitindo 'video-sync':", data)
            socket.broadcast.to(socket.room).emit("video-sync", data)
        } else {
            console.log(`Evento 'video-control' não autorizado para videoID: ${data.videoID}`)
        }
    }

    socket.on("request-video-init", requestVideoInit)
    socket.on("video-control", onVideoControl)
}
