const express = require("express");
const path = require("path");

const http = require("http");
const { WebSocketServer } = require("ws");

const url = require("url");
const uuidv4 = require("uuid").v4;

// Express app stuff
const app = express();
const port = process.env.PORT || 8000;

const buildPath = path.join(__dirname, "..", "frontend", "dist");
app.use(express.static(buildPath));

app.get("/*", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

const server = http.createServer(app);

// Websocket stuff
const wsServer = new WebSocketServer({ noServer: true });
const connections = {};
const rooms = {};

const handleMessage = (bytes, uuid) => {
  const message = JSON.parse(bytes.toString());
  const user = rooms[connections[uuid].room].users[uuid];

  user.state = message;

  broadcast();

  // console.log(
  //   `${user.username} updated their state: ${JSON.stringify(user.state)}`
  // );
};

const handleClose = (uuid) => {
  const roomID = connections[uuid].room;

  console.log(`User ${rooms[roomID].users[uuid].username} has disconnected`);

  delete connections[uuid];
  delete rooms[roomID].users[uuid];
  // If room is empty, delete it
  if (Object.keys(rooms[roomID].users).length == 0) {
    delete rooms[roomID];
  }

  broadcast();
};

const broadcast = () => {
  Object.keys(rooms).forEach((roomID) => {
    Object.keys(rooms[roomID].users).forEach((uuid) => {
      const connection = connections[uuid];
      const message = JSON.stringify(rooms[roomID].users);

      connection.send(message);
    });
  });
};

wsServer.on("connection", (connection, request) => {
  console.log(url.parse(request.url, true).query);

  const { username, roomID } = url.parse(request.url, true).query;
  const uuid = uuidv4();
  console.log(`[${roomID}] New connection from ${username}`);

  connections[uuid] = connection;
  connections[uuid].room = roomID;

  // If room doesn't exist, create it
  if (rooms[roomID] === undefined) {
    console.log(`Created new room [${roomID}]!`);
    rooms[roomID] = new Object();
    rooms[roomID].users = new Object();
  }

  rooms[roomID].users[uuid] = {
    username: username,
    state: {
      cursorX: -1,
      cursorY: -1,
    },
  };

  console.log(`Room [${roomID}]: ${JSON.stringify(rooms[roomID])}`);

  connection.on("message", (message) => handleMessage(message, uuid));
  connection.on("close", () => handleClose(uuid));
});

server.on("upgrade", (request, socket, head) => {
  const pathname = url.parse(request.url).pathname;

  // Handle websocket requests
  if (pathname === "/ws") {
    wsServer.handleUpgrade(request, socket, head, (websocket) => {
      wsServer.emit("connection", websocket, request);
    });
  } else {
    socket.destroy;
  }
});

server.listen(port, () => {
  console.log(`Websocket is running on port ${port}`);
});
