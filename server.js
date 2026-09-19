const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

const rooms = new Map();

function makeRoomCode() {
  let code;

  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
  } while (rooms.has(code));

  return code;
}

function createRoomData(code) {
  return {
    code,
    players: new Map(),
    chat: []
  };
}

function playerList(room) {
  return [...room.players.values()].map(player => ({
    id: player.id,
    name: player.name,
    x: player.x,
    y: player.y,
    hp: player.hp,
    maxHp: player.maxHp,
    bounty: player.bounty,
    job: player.job,
    weapon: player.weapon
  }));
}

function sendPlayers(roomCode) {
  const room = rooms.get(roomCode);

  if (!room) return;

  io.to(roomCode).emit("players", playerList(room));
}

function addSystemChat(room, text) {
  const message = {
    type: "system",
    name: "SYSTEM",
    text,
    time: Date.now()
  };

  room.chat.push(message);

  if (room.chat.length > 100) {
    room.chat.shift();
  }

  io.to(room.code).emit("chatMessage", message);
}

io.on("connection", socket => {

  socket.on("createRoom", data => {
    const code = makeRoomCode();
    const room = createRoomData(code);

    rooms.set(code, room);

    const player = {
      id: socket.id,
      name: String(data?.name || "勇者").slice(0, 20),
      x: 400,
      y: 300,
      hp: 30,
      maxHp: 30,
      bounty: 0,
      job: "勇者",
      weapon: "タガー"
    };

    room.players.set(socket.id, player);

    socket.join(code);
    socket.roomCode = code;

    socket.emit("roomCreated", {
      code
    });

    socket.emit("chatHistory", room.chat);

    sendPlayers(code);

    addSystemChat(room, `${player.name} がルームを作成しました`);
  });

  socket.on("joinRoom", data => {
    const code = String(data?.code || "").trim();
    const room = rooms.get(code);

    if (!room) {
      socket.emit("onlineError", "ルームが見つかりません");
      return;
    }

    if (room.players.size >= 20) {
      socket.emit("onlineError", "ルームが満員です");
      return;
    }

    const player = {
      id: socket.id,
      name: String(data?.name || "勇者").slice(0, 20),
      x: 400 + Math.random() * 200,
      y: 300 + Math.random() * 200,
      hp: 30,
      maxHp: 30,
      bounty: 0,
      job: "勇者",
      weapon: "タガー"
    };

    room.players.set(socket.id, player);

    socket.join(code);
    socket.roomCode = code;

    socket.emit("roomJoined", {
      code
    });

    socket.emit("chatHistory", room.chat);

    sendPlayers(code);

    addSystemChat(room, `${player.name} が参加しました`);
  });

  socket.on("requestPlayers", () => {
    const code = socket.roomCode;

    if (!code) return;

    const room = rooms.get(code);

    if (!room) return;

    socket.emit("players", playerList(room));
    socket.emit("chatHistory", room.chat);
  });

  socket.on("updatePlayer", data => {
    const code = socket.roomCode;

    if (!code) return;

    const room = rooms.get(code);

    if (!room) return;

    const player = room.players.get(socket.id);

    if (!player) return;

    if (typeof data.x === "number") {
      player.x = Math.max(0, Math.min(2400, data.x));
    }

    if (typeof data.y === "number") {
      player.y = Math.max(0, Math.min(1600, data.y));
    }

    if (typeof data.hp === "number") {
      player.hp = Math.max(
        0,
        Math.min(player.maxHp, data.hp)
      );
    }

    if (typeof data.maxHp === "number") {
      player.maxHp = Math.max(1, data.maxHp);
    }

    if (typeof data.bounty === "number") {
      player.bounty = Math.max(0, data.bounty);
    }

    if (typeof data.job === "string") {
      player.job = data.job.slice(0, 30);
    }

    if (typeof data.weapon === "string") {
      player.weapon = data.weapon.slice(0, 30);
    }

    if (typeof data.name === "string") {
      player.name = data.name.slice(0, 20);
    }

    socket.to(code).emit("playerUpdated", {
      id: player.id,
      name: player.name,
      x: player.x,
      y: player.y,
      hp: player.hp,
      maxHp: player.maxHp,
      bounty: player.bounty,
      job: player.job,
      weapon: player.weapon
    });
  });

  socket.on("movePlayer", data => {
    const code = socket.roomCode;

    if (!code) return;

    const room = rooms.get(code);

    if (!room) return;

    const player = room.players.get(socket.id);

    if (!player) return;

    if (typeof data.x === "number") {
      player.x = Math.max(0, Math.min(2400, data.x));
    }

    if (typeof data.y === "number") {
      player.y = Math.max(0, Math.min(1600, data.y));
    }

    socket.to(code).emit("playerMoved", {
      id: socket.id,
      x: player.x,
      y: player.y
    });
  });

  socket.on("attackPlayer", data => {
    const code = socket.roomCode;

    if (!code) return;

    const room = rooms.get(code);

    if (!room) return;

    const attacker = room.players.get(socket.id);

    if (!attacker) return;

    const target = room.players.get(data?.targetId);

    if (!target) return;

    const damage = Math.max(
      1,
      Number(data?.damage) || 1
    );

    target.hp = Math.max(
      0,
      target.hp - damage
    );

    io.to(code).emit("playerAttacked", {
      attackerId: attacker.id,
      targetId: target.id,
      damage,
      hp: target.hp
    });

    if (target.hp <= 0) {
      target.hp = target.maxHp;

      target.x = 400 + Math.random() * 200;
      target.y = 300 + Math.random() * 200;

      io.to(code).emit("playerRespawned", {
        id: target.id,
        x: target.x,
        y: target.y,
        hp: target.hp
      });
    }
  });

  // =========================
  // 公開チャット
  // =========================

  socket.on("chatMessage", data => {
    const code = socket.roomCode;

    if (!code) return;

    const room = rooms.get(code);

    if (!room) return;

    const player = room.players.get(socket.id);

    if (!player) return;

    let text = String(data?.text || "").trim();

    if (!text) return;

    if (text.length > 200) {
      text = text.slice(0, 200);
    }

    const message = {
      type: "user",
      id: socket.id,
      name: player.name,
      text,
      time: Date.now()
    };

    room.chat.push(message);

    if (room.chat.length > 100) {
      room.chat.shift();
    }

    io.to(code).emit("chatMessage", message);
  });

  // =========================
  // ルーム退出
  // =========================

  socket.on("leaveRoom", () => {
    leaveRoom(socket);
  });

  // =========================
  // 切断
  // =========================

  socket.on("disconnect", () => {
    leaveRoom(socket);
  });
});

function leaveRoom(socket) {
  const code = socket.roomCode;

  if (!code) return;

  const room = rooms.get(code);

  if (!room) {
    socket.roomCode = null;
    return;
  }

  const player = room.players.get(socket.id);

  if (player) {
    room.players.delete(socket.id);

    addSystemChat(
      room,
      `${player.name} が退出しました`
    );
  }

  socket.leave(code);
  socket.roomCode = null;

  if (room.players.size === 0) {
    rooms.delete(code);
  } else {
    sendPlayers(code);
  }
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
