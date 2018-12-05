const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080 });

// Utility methods
wss.broadcast = function broadcast(data, clients = undefined) {
  wss.clients.forEach(function each(client) {
    const includeClient = !clients || clients.indexOf(client.id) >= 0;

    if (client.readyState === WebSocket.OPEN && includeClient) {
      const payload = {
        time: Date.now(),
        ...data
      };

      client.send(JSON.stringify(payload));
    }
  });
};

const uniqueId = () => {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + "-" + s4();
};

// Server state
const clients = [];

wss.on("connection", function connection(ws, args) {
  const urlParams = new URLSearchParams(args.url.replace("/?", ""));
  const userName = urlParams.get("user");

  // Create new connection
  const id = uniqueId();
  ws.id = id;
  ws.userName = userName;
  clients.push(ws);

  ws.on("message", function incoming(data) {
    console.log(`web sockets received message ${data}`);
    const parsedData = JSON.parse(data);

    // HANDLE THE INCOMING MESSAGE
    if (parsedData.type === "CHAT_SUBMIT") {
      const clientsToMessage = clients
        .filter(c => c.id !== ws.id)
        .map(a => a.id);

      wss.broadcast(
        {
          type: "CHAT_UPDATE",
          data: parsedData.message,
          submittedById: this.id,
          submittedByName: this.userName
        },
        clientsToMessage
      );
    }
  });

  // Update active users list when people connect
  const activeUsers = [...new Set(clients.map(c => c.userName))]; // way to dedupe the usernames
  wss.broadcast({
    type: "USERS_LIST",
    data: activeUsers
  });
});
