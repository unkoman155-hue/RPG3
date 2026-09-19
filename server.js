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


/* =========================================
   データ
========================================= */

const rooms = new Map();


/* =========================================
   ルームコード
========================================= */

function generateRoomCode() {

  let code;

  do {

    code =
      Math.floor(
        100000 +
        Math.random() * 900000
      ).toString();

  } while (rooms.has(code));

  return code;

}


/* =========================================
   プレイヤー情報
========================================= */

function createServerPlayer(socketId, name) {

  return {

    id: socketId,

    name:
      String(name || "プレイヤー")
        .slice(0, 20),

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

    x: 0,

    y: 0

  };

}


/* =========================================
   ルーム状態
========================================= */

function getRoomState(roomCode) {

  const room =
    rooms.get(roomCode);

  if (!room) {

    return null;

  }


  return {

    roomCode,

    players:
      Array.from(
        room.players.values()
      )

  };

}


/* =========================================
   チャット履歴
========================================= */

function getChatHistory(room) {

  if (!room.chat) {

    room.chat = [];

  }


  return room.chat;

}


/* =========================================
   Socket.IO
========================================= */

io.on("connection", (socket) => {

  console.log(
    "接続:",
    socket.id
  );


  /* =====================================
     ルーム作成
  ===================================== */

  socket.on(
    "createRoom",
    ({ name }) => {

      const roomCode =
        generateRoomCode();


      const player =
        createServerPlayer(
          socket.id,
          name
        );


      const room = {

        players: new Map(),

        chat: []

      };


      room.players.set(
        socket.id,
        player
      );


      rooms.set(
        roomCode,
        room
      );


      socket.join(
        roomCode
      );


      socket.roomCode =
        roomCode;


      socket.playerId =
        socket.id;


      socket.emit(
        "roomCreated",
        {
          roomCode,
          player
        }
      );


      io.to(roomCode).emit(
        "roomState",
        getRoomState(roomCode)
      );


      console.log(
        `ルーム作成: ${roomCode}`
      );

    }
  );


  /* =====================================
     ルーム参加
  ===================================== */

  socket.on(
    "joinRoom",
    ({ name, roomCode }) => {

      const code =
        String(roomCode || "")
          .trim()
          .toUpperCase();


      const room =
        rooms.get(code);


      if (!room) {

        socket.emit(
          "onlineError",
          "そのルームは存在しません。"
        );

        return;

      }


      if (
        room.players.size >= 20
      ) {

        socket.emit(
          "onlineError",
          "このルームは満員です。"
        );

        return;

      }


      const player =
        createServerPlayer(
          socket.id,
          name
        );


      room.players.set(
        socket.id,
        player
      );


      socket.join(
        code
      );


      socket.roomCode =
        code;


      socket.playerId =
        socket.id;


      socket.emit(
        "roomJoined",
        {
          roomCode: code,
          player
        }
      );


      io.to(code).emit(
        "roomState",
        getRoomState(code)
      );


      /* チャット履歴を新規参加者に送信 */

      socket.emit(
        "chatHistory",
        getChatHistory(room)
      );


      /* 参加通知 */

      const joinMessage = {

        id:
          `system-${Date.now()}`,

        name: "システム",

        message:
          `${player.name} がルームに参加しました。`,

        system: true,

        time:
          Date.now()

      };


      room.chat.push(
        joinMessage
      );


      /* 履歴が増えすぎないようにする */

      if (room.chat.length > 100) {

        room.chat =
          room.chat.slice(-100);

      }


      io.to(code).emit(
        "chatMessage",
        joinMessage
      );


      console.log(
        `${player.name} が ${code} に参加`
      );

    }
  );


  /* =====================================
     プレイヤー一覧要求
  ===================================== */

  socket.on(
    "requestPlayers",
    () => {

      const roomCode =
        socket.roomCode;


      if (!roomCode) return;


      const state =
        getRoomState(roomCode);


      if (!state) return;


      socket.emit(
        "roomState",
        state
      );


      const room =
        rooms.get(roomCode);


      if (room) {

        socket.emit(
          "chatHistory",
          getChatHistory(room)
        );

      }

    }
  );


  /* =====================================
     プレイヤー情報更新
  ===================================== */

  socket.on(
    "updatePlayer",
    (data) => {

      const roomCode =
        socket.roomCode;


      if (!roomCode) return;


      const room =
        rooms.get(roomCode);


      if (!room) return;


      const player =
        room.players.get(
          socket.id
        );


      if (!player) return;


      const allowedFields = [

        "name",
        "job",
        "level",
        "xp",
        "maxHp",
        "hp",
        "attack",
        "money",
        "bounty",
        "weapon",
        "skills",
        "defeats",
        "x",
        "y"

      ];


      for (
        const field
        of allowedFields
      ) {

        if (
          data &&
          data[field] !== undefined
        ) {

          player[field] =
            data[field];

        }

      }


      io.to(roomCode).emit(
        "roomState",
        getRoomState(roomCode)
      );

    }
  );


  /* =====================================
     移動
  ===================================== */

  socket.on(
    "movePlayer",
    ({ x, y }) => {

      const roomCode =
        socket.roomCode;


      if (!roomCode) return;


      const room =
        rooms.get(roomCode);


      if (!room) return;


      const player =
        room.players.get(
          socket.id
        );


      if (!player) return;


      player.x =
        Number(x) || 0;

      player.y =
        Number(y) || 0;


      socket.to(roomCode).emit(
        "playerMoved",
        {

          id:
            socket.id,

          x:
            player.x,

          y:
            player.y

        }
      );

    }
  );


  /* =====================================
     PvP攻撃
  ===================================== */

  socket.on(
    "attackPlayer",
    (targetId) => {

      const roomCode =
        socket.roomCode;


      if (!roomCode) return;


      const room =
        rooms.get(roomCode);


      if (!room) return;


      const attacker =
        room.players.get(
          socket.id
        );


      const target =
        room.players.get(
          targetId
        );


      if (
        !attacker ||
        !target ||
        attacker.id === target.id
      ) {

        return;

      }


      const damage =
        Math.max(
          1,
          Number(attacker.attack) || 1
        );


      target.hp =
        Math.max(
          0,
          target.hp - damage
        );


      io.to(roomCode).emit(
        "playerDamaged",
        {

          attackerId:
            attacker.id,

          attackerName:
            attacker.name,

          targetId:
            target.id,

          targetName:
            target.name,

          damage,

          hp:
            target.hp

        }
      );


      if (target.hp <= 0) {

        attacker.defeats += 1;

        attacker.bounty += 50;


        io.to(roomCode).emit(
          "playerDefeated",
          {

            attackerId:
              attacker.id,

            attackerName:
              attacker.name,

            targetId:
              target.id,

            targetName:
              target.name

          }
        );


        target.hp =
          target.maxHp;

      }


      io.to(roomCode).emit(
        "roomState",
        getRoomState(roomCode)
      );

    }
  );


  /* =====================================
     💬 公開チャット送信
  ===================================== */

  socket.on(
    "chatMessage",
    (message) => {

      const roomCode =
        socket.roomCode;


      if (!roomCode) {

        return;

      }


      const room =
        rooms.get(roomCode);


      if (!room) {

        return;

      }


      const player =
        room.players.get(
          socket.id
        );


      if (!player) {

        return;

      }


      /* 文字列にする */

      let text =
        String(message ?? "")
          .trim();


      /* 空メッセージ禁止 */

      if (!text) {

        return;

      }


      /* 長すぎる文章を防止 */

      if (text.length > 200) {

        text =
          text.slice(0, 200);

      }


      const chatData = {

        id:
          `chat-${Date.now()}-${Math.random()}`,

        name:
          player.name,

        message:
          text,

        system: false,

        time:
          Date.now()

      };


      /* ルームの履歴に保存 */

      room.chat.push(
        chatData
      );


      /* 最大100件 */

      if (room.chat.length > 100) {

        room.chat =
          room.chat.slice(-100);

      }


      /* 同じルーム全員へ送信 */

      io.to(roomCode).emit(
        "chatMessage",
        chatData
      );

    }
  );


  /* =====================================
     切断
  ===================================== */

  socket.on(
    "disconnect",
    () => {

      const roomCode =
        socket.roomCode;


      if (!roomCode) {

        console.log(
          "切断:",
          socket.id
        );

        return;

      }


      const room =
        rooms.get(roomCode);


      if (!room) {

        return;

      }


      const player =
        room.players.get(
          socket.id
        );


      room.players.delete(
        socket.id
      );


      /* 退出メッセージ */

      if (player) {

        const leaveMessage = {

          id:
            `system-${Date.now()}`,

          name:
            "システム",

          message:
            `${player.name} がルームから退出しました。`,

          system: true,

          time:
            Date.now()

        };


        room.chat.push(
          leaveMessage
        );


        if (room.chat.length > 100) {

          room.chat =
            room.chat.slice(-100);

        }


        io.to(roomCode).emit(
          "chatMessage",
          leaveMessage
        );

      }


      /* まだ人がいる */

      if (room.players.size > 0) {

        io.to(roomCode).emit(
          "roomState",
          getRoomState(roomCode)
        );

      }

      /* 誰もいなくなった */

      else {

        rooms.delete(
          roomCode
        );


        console.log(
          `ルーム削除: ${roomCode}`
        );

      }


      console.log(
        "切断:",
        socket.id
      );

    }
  );

});


/* =========================================
   サーバー起動
========================================= */

server.listen(
  PORT,
  () => {

    console.log(
      `サーバー起動: ${PORT}`
    );

  }
);
