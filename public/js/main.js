// public/js/main.js
import { elements } from "./ui.js"
import { registerSocketEvents } from "./socket.js"
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

    // Register all event handlers
    registerSocketEvents()
    registerDomEvents()
})
