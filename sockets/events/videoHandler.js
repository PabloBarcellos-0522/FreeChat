const { users, rooms, addMessageToRoom } = require("../state")
const { participantsList } = require("../utils")

module.exports = (io, socket) => {
    const videoInit = (data) => {
        console.log("Iniciando vídeo com dados:", data)
        const payload = {
            name: data.userName,
            videoID: data.videoID,
            time: new Date().toISOString(),
            type: "video",
        }
        addMessageToRoom(socket.room, payload)
        io.to(socket.room).emit("new-message", payload)
    }

    const autorizeVideoControl = (data) => {
        console.log("Autorizando controle de vídeo com dados:", data)
        const { message } = data
        let videoPayload = null
        rooms[socket.room].history.forEach((msg) => {
            if (msg.type === "video" && msg.name === message.name) {
                videoPayload = msg
            }
        })

        // Participantes que não são o dono da sala ou do vídeo não podem controlar o vídeo
        if (socket.userName != rooms[socket.room]?.owner && videoPayload.name != socket.userName) {
            socket.emit("seek-error", {
                message: "Apenas o dono da sala ou vídeo pode controlá-lo.",
            })
            return false
        }
        return true
    }

    const requestVideoInit = (data) => {
        console.log("Requisição de inicialização de vídeo recebida:", data)
        participantsList(io, socket.room).forEach((p) => {
            console.log("Verificando participante para inicialização de vídeo:", p)
            if (socket.userName == p.name) {
                if (p.king) {
                    videoInit(data)
                    return
                }

                socket
                    .to(rooms[socket.room].owner)
                    .emit("request-video-init", { userName: socket.userName })
            }
        })
    }

    const play = (data) => {
        if (autorizeVideoControl(data)) {
            socket.broadcast.to(socket.room).emit("play-video", { videoTime })
        }
    }

    const pause = (data) => {
        if (autorizeVideoControl(data)) {
            socket.broadcast.to(socket.room).emit("pause-video", { videoTime })
        }
    }

    const seekTo = (data) => {
        if (autorizeVideoControl(data)) {
            socket.broadcast.to(socket.room).emit("seek-video", { videoTime: data.videoTime })
        }
    }

    socket.on("request-video-init", requestVideoInit)
    socket.on("play", play)
    socket.on("pause", pause)
    socket.on("seekTo", seekTo)
}
