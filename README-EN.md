# FreeChat

FreeChat is a dynamic and feature-rich web chat application designed for real-time communication. Built with a modern, modular architecture using Node.js and Socket.IO, it provides a seamless and interactive user experience.

---

## ✨ Features

- **Real-Time Messaging**: Instant text-based communication between users.
- **Chat Rooms**: Users can create new chat rooms or join existing ones from a lobby.
- **Public & Private Rooms**: Ability to create rooms with an optional password for private access.
- **Participant List**: View all users currently in a chat room.
- **"User is Typing" Indicator**: See when other users are actively typing a message.
- **Live Mouse Pointer Tracking**: See the mouse cursors of other participants in real-time within the chat room.
- **Image & Link Sharing**: Share images by uploading or sending links, with previews directly in the chat.
- **Image Modal**: Click on a shared image to view it in a full-screen modal with zoom capabilities.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js, Socket.IO
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6 Modules), Socket.IO Client
- **UI Enhancements**: Lenis for smooth scrolling effects.

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.x or higher recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

### Installation & Running

1.  **Clone the repository:**

    ```sh
    git clone https://github.com/PabloBarcellos-0522/FreeChat.git
    ```

2.  **Navigate to the project directory:**

    ```sh
    cd FreeChat
    ```

3.  **Install dependencies:**

    ```sh
    npm install
    ```

4.  **Start the server:**

    ```sh
    npm start
    ```

5.  Open your browser and navigate to `http://localhost:3000`.

---

## 📂 Project Structure

The project uses a modular architecture on both the backend and frontend to ensure clean, scalable, and maintainable code.

```
FreeChat/
├── node_modules/
├── public/                # All frontend static assets
│   ├── js/                # Modular client-side JavaScript
│   │   ├── listeners.js   # DOM event listeners
│   │   ├── main.js        # Main entry point for the client
│   │   ├── socket.js      # Client-side socket event handling
│   │   ├── state.js       # Client-side state management
│   │   └── ui.js          # UI manipulation functions
│   ├── resources/
│   ├── index.html
│   └── style.css
├── sockets/               # Modular backend Socket.IO logic
│   ├── events/            # Specific event handlers (chat, room, user)
│   ├── socketHandler.js   # Main socket connection orchestrator
│   └── utils.js           # Shared utility functions
├── .gitignore
├── LICENSE
├── package.json
└── server.js              # Main server entry point
```

---

## 🤝 Contributing

Contributions are welcome! If you have ideas for new features or improvements, feel free to open an issue or submit a pull request.

---

## 📜 License

This project is licensed under the **Apache License 2.0**. See the [LICENSE](LICENSE) file for more details.
