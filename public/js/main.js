// public/js/main.js
import { elements, initializeQueuedPlayers } from "./ui.js"
import { registerSocketEvents, socket } from "./socket.js"
import { registerDomEvents } from "./listeners.js"

document.addEventListener("DOMContentLoaded", () => {
    // Initialize Lenis for smooth scrolling
    const messagesLenis = new Lenis({ wrapper: elements.messages, content: elements.messages })
    const participantsLenis = new Lenis({
        wrapper: elements.participantsContainer,
        content: elements.participantsContainer,
    })

    function raf(time) {
        messagesLenis.raf(time)
        participantsLenis.raf(time)
        requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    if (!window.YT) {
        var tag = document.createElement("script")
        tag.src = "https://www.youtube.com/iframe_api"
        var firstScriptTag = document.getElementsByTagName("script")[0]
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
    }

    window.onYouTubeIframeAPIReady = function () {
        console.log("API do YouTube carregada e pronta.")
        initializeQueuedPlayers()
    }

    const savedUserName = localStorage.getItem("userName")
    console.log(savedUserName)
    if (savedUserName) {
        socket.emit("validade-username", { userName: savedUserName })
    }

    // Register all event handlers
    registerSocketEvents()
    registerDomEvents()
})
