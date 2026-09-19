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

/* =========================
   ルーム管理
========================= */

const rooms = new Map();

function makeRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "";

  do {
    code = "";

    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  } while (rooms.has(code));

  return code;
}

function createPlayer(socket, name) {
  return {
    id: socket.id,

    name: name || "名無し",
    job: "勇者",

    level: 1,
    xp: 0,

    maxHp: 30,
    hp: 30,

    attack: 10,

    money: 250,
    bounty: 0,

    weapon: "タガー",
    skills: ["斬撃"],

    defeats: 0,

    townUnlocked: false,
    townTrust: 0,

    cityUnlocked: false,
    cityTrust: 0,

    x: 0,
    y: 0,

    online: true
  };
}

function getRoomPlayers(room) {
  return Array.from(room.players.values());
}

function sendRoomState(roomCode) {
  const room = rooms.get(roomCode);

  if (!room) return;

  const players = getRoomPlayers(room);

  io.to(roomCode).emit("roomState", {
    roomCode,
    players
  });
}

/* =========================
   接続
========================= */

io.on("connection", (socket) => {
  console.log("接続:", socket.id);

  /* =========================
     ルーム作成
  ========================= */

  socket.on("createRoom", (data) => {
    const name =
      data && typeof data.name === "string"
        ? data.name.trim().slice(0, 20)
        : "名無し";

    const roomCode = makeRoomCode();

    const room = {
      code: roomCode,
      players: new Map(),
      createdAt: Date.now()
    };

    const player = createPlayer(socket, name);

    room.players.set(socket.id, player);

    rooms.set(roomCode, room);

    socket.join(roomCode);

    socket.roomCode = roomCode;

    socket.emit("roomCreated", {
      roomCode,
      player
    });

    sendRoomState(roomCode);

    console.log(
      `ルーム作成: ${roomCode} / ${player.name}`
    );
  });

  /* =========================
     ルーム参加
  ========================= */

  socket.on("joinRoom", (data) => {
    const roomCode =
      data && typeof data.roomCode === "string"
        ? data.roomCode.trim().toUpperCase()
        : "";

    const name =
      data && typeof data.name === "string"
        ? data.name.trim().slice(0, 20)
        : "名無し";

    if (!roomCode) {
      socket.emit("onlineError", "ルームコードを入力してください。");
      return;
    }

    const room = rooms.get(roomCode);

    if (!room) {
      socket.emit(
        "onlineError",
        "そのルームは存在しません。"
      );
      return;
    }

    if (room.players.size >= 20) {
      socket.emit(
        "onlineError",
        "このルームは満員です。"
      );
      return;
    }

    const player = createPlayer(socket, name);

    room.players.set(socket.id, player);

    socket.join(roomCode);

    socket.roomCode = roomCode;

    socket.emit("roomJoined", {
      roomCode,
      player
    });

    sendRoomState(roomCode);

    console.log(
      `ルーム参加: ${roomCode} / ${player.name}`
    );
  });

  /* =========================
     プレイヤー情報更新
  ========================= */

  socket.on("updatePlayer", (data) => {
    const roomCode = socket.roomCode;

    if (!roomCode) return;

    const room = rooms.get(roomCode);

    if (!room) return;

    const player = room.players.get(socket.id);

    if (!player) return;

    if (!data || typeof data !== "object") {
      return;
    }

    /*
      クライアントから送られてきた
      プレイヤー情報を更新する。

      最大値などはサーバー側でも制限する。
    */

    if (typeof data.name === "string") {
      player.name = data.name
        .trim()
        .slice(0, 20) || "名無し";
    }

    if (typeof data.job === "string") {
      player.job = data.job.slice(0, 20);
    }

    if (Number.isFinite(data.level)) {
      player.level = Math.max(
        1,
        Math.min(999, Math.floor(data.level))
      );
    }

    if (Number.isFinite(data.xp)) {
      player.xp = Math.max(
        0,
        Math.floor(data.xp)
      );
    }

    if (Number.isFinite(data.maxHp)) {
      player.maxHp = Math.max(
        1,
        Math.min(99999, Math.floor(data.maxHp))
      );
    }

    if (Number.isFinite(data.hp)) {
      player.hp = Math.max(
        0,
        Math.min(player.maxHp, Math.floor(data.hp))
      );
    }

    if (Number.isFinite(data.attack)) {
      player.attack = Math.max(
        1,
        Math.min(99999, Math.floor(data.attack))
      );
    }

    if (Number.isFinite(data.money)) {
      player.money = Math.max(
        0,
        Math.min(999999999, Math.floor(data.money))
      );
    }

    if (Number.isFinite(data.bounty)) {
      player.bounty = Math.max(
        0,
        Math.min(999999999, Math.floor(data.bounty))
      );
    }

    if (typeof data.weapon === "string") {
      player.weapon = data.weapon.slice(0, 30);
    }

    if (Array.isArray(data.skills)) {
      player.skills = data.skills
        .filter(v => typeof v === "string")
        .slice(0, 20);
    }

    if (Number.isFinite(data.defeats)) {
      player.defeats = Math.max(
        0,
        Math.min(999999, Math.floor(data.defeats))
      );
    }

    if (Number.isFinite(data.x)) {
      player.x = Math.max(
        -100000,
        Math.min(100000, data.x)
      );
    }

    if (Number.isFinite(data.y)) {
      player.y = Math.max(
        -100000,
        Math.min(100000, data.y)
      );
    }

    sendRoomState(roomCode);
  });

  /* =========================
     移動
  ========================= */

  socket.on("move", (data) => {
    const roomCode = socket.roomCode;

    if (!roomCode) return;

    const room = rooms.get(roomCode);

    if (!room) return;

    const player = room.players.get(socket.id);

    if (!player) return;

    if (!data || typeof data !== "object") {
      return;
    }

    if (Number.isFinite(data.x)) {
      player.x = Math.max(
        -100000,
        Math.min(100000, data.x)
      );
    }

    if (Number.isFinite(data.y)) {
      player.y = Math.max(
        -100000,
        Math.min(100000, data.y)
      );
    }

    socket.to(roomCode).emit("playerMoved", {
      id: player.id,
      x: player.x,
      y: player.y
    });
  });

  /* =========================
     PvP攻撃
  ========================= */

  socket.on("attackPlayer", (targetId) => {
    const roomCode = socket.roomCode;

    if (!roomCode) return;

    const room = rooms.get(roomCode);

    if (!room) return;

    const attacker = room.players.get(socket.id);
    const target = room.players.get(targetId);

    if (!attacker || !target) return;

    if (attacker.id === target.id) return;

    const dx = attacker.x - target.x;
    const dy = attacker.y - target.y;

    const distance = Math.sqrt(
      dx * dx + dy * dy
    );

    const ATTACK_RANGE = 180;

    if (distance > ATTACK_RANGE) {
      socket.emit(
        "onlineError",
        "相手が遠すぎます。"
      );
      return;
    }

    let damage = attacker.attack;

    if (attacker.weapon === "タガー") {
      damage += 15;
    }

    if (attacker.weapon === "剣") {
      damage += 5;
    }

    if (attacker.weapon === "強化剣") {
      damage += 25;
    }

    if (Math.random() < 0.15) {
      damage += 5;
    }

    damage = Math.max(
      1,
      Math.floor(damage)
    );

    target.hp -= damage;

    if (target.hp < 0) {
      target.hp = 0;
    }

    io.to(roomCode).emit("playerDamaged", {
      attackerId: attacker.id,
      targetId: target.id,
      damage,
      hp: target.hp,
      maxHp: target.maxHp
    });

    /* =========================
       撃破
    ========================= */

    if (target.hp <= 0) {
      attacker.defeats += 1;
      attacker.bounty += 50;

      target.hp = target.maxHp;

      io.to(roomCode).emit("playerDefeated", {
        attackerId: attacker.id,
        targetId: target.id,
        attackerName: attacker.name,
        targetName: target.name,
        bounty: attacker.bounty
      });
    }

    sendRoomState(roomCode);
  });

  /* =========================
     プレイヤー一覧要求
  ========================= */

  socket.on("requestPlayers", () => {
    const roomCode = socket.roomCode;

    if (!roomCode) return;

    const room = rooms.get(roomCode);

    if (!room) return;

    socket.emit("roomState", {
      roomCode,
      players: getRoomPlayers(room)
    });
  });

  /* =========================
     切断
  ========================= */

  socket.on("disconnect", () => {
    console.log("切断:", socket.id);

    const roomCode = socket.roomCode;

    if (!roomCode) return;

    const room = rooms.get(roomCode);

    if (!room) return;

    room.players.delete(socket.id);

    if (room.players.size === 0) {
      rooms.delete(roomCode);

      console.log(
        `ルーム削除: ${roomCode}`
      );

      return;
    }

    sendRoomState(roomCode);
  });
});

/* =========================
   サーバー起動
========================= */

server.listen(PORT, "0.0.0.0", () => {
  console.log(
    `勇者の懸賞金RPG ONLINE SERVER`
  );

  console.log(
    `PORT: ${PORT}`
  );
});
