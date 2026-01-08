const socket = io("http://localhost:3000")

socket.on("connect", () => {
    console.log("Conectado ao servidor Socket.io com ID:", socket.id)
})

socket.on("new-message", (data) => {
    console.log("Mensagem recebida do servidor: ", data.message)
})

socket.on("disconnect", () => {
    console.log("Desconectado")
})
