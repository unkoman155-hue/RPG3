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

// ==============================
// 静的ファイル
// ==============================

app.use(express.static(path.join(__dirname, "public")));

// ==============================
// ルーム管理
// ==============================

const rooms = new Map();

function makeRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code;

  do {
    code = "";

    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  } while (rooms.has(code));

  return code;
}

// ==============================
// プレイヤー情報
// ==============================

function createPlayer(socket, data = {}) {
  return {
    id: socket.id,

    name:
      typeof data.name === "string" && data.name.trim()
        ? data.name.trim().slice(0, 20)
        : "勇者",

    job:
      typeof data.job === "string" && data.job.trim()
        ? data.job.trim().slice(0, 20)
        : "勇者",

    level: Number(data.level) || 1,
    xp: Number(data.xp) || 0,

    maxHp: Number(data.maxHp) || 30,
    hp: Number(data.hp) || 30,

    attack: Number(data.attack) || 10,

    money: Number(data.money) || 250,
    bounty: Number(data.bounty) || 0,

    weapon:
      typeof data.weapon === "string"
        ? data.weapon.slice(0, 30)
        : "タガー",

    defeats: Number(data.defeats) || 0,

    x:
      Number.isFinite(Number(data.x))
        ? Number(data.x)
        : Math.floor(Math.random() * 700) + 100,

    y:
      Number.isFinite(Number(data.y))
        ? Number(data.y)
        : Math.floor(Math.random() * 400) + 100,

    online: true
  };
}

// ==============================
// ルーム情報をクライアントへ送る
// ==============================

function getPublicRoom(room) {
  return {
    code: room.code,

    players: [...room.players.values()].map((player) => ({
      id: player.id,
      name: player.name,
      job: player.job,
      level: player.level,
      xp: player.xp,
      maxHp: player.maxHp,
      hp: player.hp,
      attack: player.attack,
      money: player.money,
      bounty: player.bounty,
      weapon: player.weapon,
      defeats: player.defeats,
      x: player.x,
      y: player.y,
      online: player.online
    }))
  };
}

function broadcastRoom(room) {
  io.to(room.code).emit("roomState", getPublicRoom(room));
}

// ==============================
// 接続
// ==============================

io.on("connection", (socket) => {
  console.log("接続:", socket.id);

  // ============================
  // ルーム作成
  // ============================

  socket.on("createRoom", (data = {}) => {
    // すでにルームにいる場合
    if (socket.roomCode) {
      socket.emit("roomError", "すでにルームに参加しています。");
      return;
    }

    const code = makeRoomCode();

    const room = {
      code,
      players: new Map(),
      createdAt: Date.now()
    };

    const player = createPlayer(socket, data);

    room.players.set(socket.id, player);
    rooms.set(code, room);

    socket.join(code);
    socket.roomCode = code;

    socket.emit("roomCreated", {
      code,
      playerId: socket.id
    });

    broadcastRoom(room);

    console.log("ルーム作成:", code);
  });

  // ============================
  // ルーム参加
  // ============================

  socket.on("joinRoom", (data = {}) => {
    // すでにルームにいる場合
    if (socket.roomCode) {
      socket.emit("roomError", "すでにルームに参加しています。");
      return;
    }

    const code =
      typeof data.code === "string"
        ? data.code.trim().toUpperCase()
        : "";

    if (!code) {
      socket.emit("roomError", "ルームコードを入力してください。");
      return;
    }

    const room = rooms.get(code);

    if (!room) {
      socket.emit("roomError", "そのルームは存在しません。");
      return;
    }

    if (room.players.size >= 20) {
      socket.emit("roomError", "このルームは満員です。");
      return;
    }

    const player = createPlayer(socket, data);

    room.players.set(socket.id, player);

    socket.join(code);
    socket.roomCode = code;

    socket.emit("roomJoined", {
      code,
      playerId: socket.id
    });

    socket.to(code).emit("playerJoined", {
      id: socket.id,
      name: player.name
    });

    broadcastRoom(room);

    console.log("ルーム参加:", socket.id, "→", code);
  });

  // ============================
  // プレイヤー情報更新
  // ============================

  socket.on("updatePlayer", (data = {}) => {
    const code = socket.roomCode;

    if (!code) return;

    const room = rooms.get(code);

    if (!room) return;

    const player = room.players.get(socket.id);

    if (!player) return;

    // 名前
    if (typeof data.name === "string") {
      player.name = data.name.trim().slice(0, 20) || player.name;
    }

    // 職業
    if (typeof data.job === "string") {
      player.job = data.job.trim().slice(0, 20) || player.job;
    }

    // 数値
    const numberFields = [
      "level",
      "xp",
      "maxHp",
      "hp",
      "attack",
      "money",
      "bounty",
      "defeats",
      "x",
      "y"
    ];

    for (const field of numberFields) {
      if (Number.isFinite(Number(data[field]))) {
        player[field] = Number(data[field]);
      }
    }

    // HPの安全処理
    player.maxHp = Math.max(1, player.maxHp);
    player.hp = Math.max(0, Math.min(player.hp, player.maxHp));

    // 装備
    if (typeof data.weapon === "string") {
      player.weapon = data.weapon.slice(0, 30);
    }

    broadcastRoom(room);
  });

  // ============================
  // 移動
  // ============================

  socket.on("move", (data = {}) => {
    const code = socket.roomCode;

    if (!code) return;

    const room = rooms.get(code);

    if (!room) return;

    const player = room.players.get(socket.id);

    if (!player) return;

    const x = Number(data.x);
    const y = Number(data.y);

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return;
    }

    // マップ範囲
    player.x = Math.max(0, Math.min(2000, x));
    player.y = Math.max(0, Math.min(1400, y));

    // 自分以外へ送信
    socket.to(code).emit("playerMoved", {
      id: socket.id,
      x: player.x,
      y: player.y
    });
  });

  // ============================
  // PvP攻撃
  // ============================

  socket.on("attackPlayer", (data = {}) => {
    const code = socket.roomCode;

    if (!code) return;

    const room = rooms.get(code);

    if (!room) return;

    const attacker = room.players.get(socket.id);

    if (!attacker) return;

    const targetId =
      typeof data.targetId === "string"
        ? data.targetId
        : "";

    const target = room.players.get(targetId);

    if (!target) {
      socket.emit("battleError", "相手が見つかりません。");
      return;
    }

    if (target.id === attacker.id) {
      socket.emit("battleError", "自分自身は攻撃できません。");
      return;
    }

    if (target.hp <= 0) {
      socket.emit("battleError", "そのプレイヤーは戦闘不能です。");
      return;
    }

    const distance = Math.hypot(
      attacker.x - target.x,
      attacker.y - target.y
    );

    // 攻撃範囲
    if (distance > 180) {
      socket.emit("battleError", "相手が遠すぎます。");
      return;
    }

    let damage = Math.max(
      1,
      Math.floor(attacker.attack)
    );

    // 武器補正
    if (attacker.weapon === "タガー") {
      damage += 15;
    } else if (attacker.weapon === "剣") {
      damage += 5;
    } else if (attacker.weapon === "強化武器") {
      damage += 25;
    }

    const critical = Math.random() < 0.15;

    if (critical) {
      damage += 5;
    }

    target.hp = Math.max(0, target.hp - damage);

    io.to(code).emit("playerAttacked", {
      attackerId: attacker.id,
      attackerName: attacker.name,
      targetId: target.id,
      targetName: target.name,
      damage,
      critical,
      targetHp: target.hp,
      targetMaxHp: target.maxHp
    });

    // 撃破
    if (target.hp <= 0) {
      attacker.defeats += 1;
      attacker.bounty += 50;

      target.hp = target.maxHp;

      io.to(code).emit("playerDefeated", {
        attackerId: attacker.id,
        attackerName: attacker.name,
        targetId: target.id,
        targetName: target.name
      });

      broadcastRoom(room);
    } else {
      broadcastRoom(room);
    }
  });

  // ============================
  // プレイヤー情報取得
  // ============================

  socket.on("requestPlayers", () => {
    const code = socket.roomCode;

    if (!code) return;

    const room = rooms.get(code);

    if (!room) return;

    socket.emit("roomState", getPublicRoom(room));
  });

  // ============================
  // 切断
  // ============================

  socket.on("disconnect", () => {
    console.log("切断:", socket.id);

    const code = socket.roomCode;

    if (!code) return;

    const room = rooms.get(code);

    if (!room) return;

    const player = room.players.get(socket.id);

    if (player) {
      room.players.delete(socket.id);

      io.to(code).emit("playerLeft", {
        id: socket.id,
        name: player.name
      });
    }

    // 誰もいなくなったらルーム削除
    if (room.players.size === 0) {
      rooms.delete(code);

      console.log("ルーム削除:", code);
    } else {
      broadcastRoom(room);
    }
  });
});

// ==============================
// 404
// ==============================

app.use((req, res) => {
  res.status(404).send("ページが見つかりません。");
});

// ==============================
// サーバー起動
// ==============================

server.listen(PORT, "0.0.0.0", () => {
  console.log(`勇者の懸賞金RPG ONLINE`);
  console.log(`Server started on port ${PORT}`);
});
