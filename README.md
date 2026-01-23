# FreeChat

FreeChat é uma aplicação web de chat dinâmica e rica em recursos, projetada para comunicação em tempo real. Construída com uma arquitetura moderna e modular usando Node.js e Socket.IO, ela oferece uma experiência de usuário fluida e interativa.

---

## ✨ Funcionalidades

- **Mensagens em Tempo Real**: Comunicação instantânea baseada em texto entre usuários.
- **Salas de Chat**: Usuários podem criar novas salas de chat ou entrar em salas existentes a partir de um lobby.
- **Salas Públicas e Privadas**: Capacidade de criar salas com uma senha opcional para acesso privado.
- **Lista de Participantes**: Visualize todos os usuários atualmente em uma sala de chat.
- **Indicador "Usuário Digitandor..."**: Veja quando outros usuários estão digitando uma mensagem ativamente.
- **Rastreamento de Cursor do Mouse ao Vivo**: Veja os cursores do mouse de outros participantes em tempo real dentro da sala de chat.
- **Compartilhamento de Imagens e Links**: Compartilhe imagens fazendo upload ou enviando links, com pré-visualizações diretamente no chat.
- **Modal de Imagem**: Clique em uma imagem compartilhada para visualizá-la em tela cheia com recursos de zoom.

---

## 🛠️ Pilha de Tecnologias

- **Backend**: Node.js, Express.js, Socket.IO
- **Frontend**: HTML5, CSS3, JavaScript Puro (Módulos ES6), Cliente Socket.IO
- **Melhorias na UI**: Lenis para efeitos de rolagem suave.

---

## 🚀 Primeiros Passos

Siga estas instruções para obter uma cópia do projeto funcionando em sua máquina local.

### Pré-requisitos

- [Node.js](https://nodejs.org/) (v18.x ou superior recomendado)
- [npm](https://www.npmjs.com/) (geralmente vem com o Node.js)

### Instalação e Execução

1.  **Clone o repositório:**

    ```sh
    git clone https://github.com/PabloBarcellos-0522/FreeChat.git
    ```

2.  **Navegue até o diretório do projeto:**

    ```sh
    cd FreeChat
    ```

3.  **Instale as dependências:**

    ```sh
    npm install
    ```

4.  **Inicie o servidor:**

    ```sh
    npm start
    ```

5.  Abra seu navegador e navegue para `http://localhost:3000`.

---

## 📂 Estrutura do Projeto

O projeto utiliza uma arquitetura modular tanto no backend quanto no frontend para garantir um código limpo, escalável e de fácil manutenção.

```
FreeChat/
├── node_modules/
├── public/                # Todos os recursos estáticos do frontend
│   ├── js/                # JavaScript modular do lado do cliente
│   │   ├── listeners.js   # Listeners de eventos DOM
│   │   ├── main.js        # Ponto de entrada principal para o cliente
│   │   ├── socket.js      # Manipulação de eventos de socket do lado do cliente
│   │   ├── state.js       # Gerenciamento de estado do lado do cliente
│   │   └── ui.js          # Funções de manipulação da UI
│   ├── resources/
│   ├── index.html
│   └── style.css
├── sockets/               # Lógica modular do Socket.IO do backend
│   ├── events/            # Manipuladores de eventos específicos (chat, sala, usuário)
│   ├── socketHandler.js   # Orquestrador principal da conexão de socket
│   └── utils.js           # Funções utilitárias compartilhadas
├── .gitignore
├── LICENSE
├── package.json
└── server.js              # Ponto de entrada principal do servidor
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Se você tem ideias para novas funcionalidades ou melhorias, sinta-se à vontade para abrir uma issue ou enviar um pull request.

---

## 📜 Licença

Este projeto está licenciado sob a **Licença Apache 2.0**. Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.
