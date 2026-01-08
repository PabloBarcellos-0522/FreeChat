const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const app = express()
const server = http.createServer(app)
const socketHandler = require("./sockets/socketHandler")

const io = new Server(server, {
    cors: {
        origin: "*", // Ajuste para seu domínio em produção
        methods: ["GET", "POST"],
    },
})

app.use(express.static("public"))

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`)
})

socketHandler.initializeSocketHandler(io)
