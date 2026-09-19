const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

const PORT = process.env.PORT || 3000;


/* =========================================
   静的ファイル
========================================= */

app.use(
  express.static(
    path.join(__dirname, "public")
  )
);


/* =========================================
   ルーム
========================================= */

const rooms = new Map();


/*
  rooms:

  roomCode => {
    players: Map
  }
*/


/* =========================================
   ルームコード生成
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
   プレイヤー作成
========================================= */

function createServerPlayer(
  socketId,
  data = {}
) {

  return {

    id: socketId,

    name:
      String(data.name || "プレイヤー")
        .slice(0, 20),

    job:
      data.job || "勇者",

    level:
      Number(data.level) || 1,

    xp:
      Number(data.xp) || 0,

    maxHp:
      Math.max(
        1,
        Number(data.maxHp) || 30
      ),

    hp:
      Math.max(
        0,
        Number(data.hp) || 30
      ),

    attack:
      Math.max(
        0,
        Number(data.attack) || 10
      ),

    money:
      Math.max(
        0,
        Number(data.money) || 0
      ),

    bounty:
      Math.max(
        0,
        Number(data.bounty) || 0
      ),

    weapon:
      data.weapon || "タガー",

    skills:
      Array.isArray(data.skills)
        ? data.skills.slice(0, 20)
        : ["斬撃"],

    defeats:
      Math.max(
        0,
        Number(data.defeats) || 0
      ),

    x:
      Number(data.x) || 0,

    y:
      Number(data.y) || 0

  };

}


/* =========================================
   安全なプレイヤーデータ
========================================= */

function publicPlayer(player) {

  if (!player) return null;

  return {

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

    skills: player.skills,

    defeats: player.defeats,

    x: player.x,

    y: player.y

  };

}


/* =========================================
   ルーム状態送信
========================================= */

function sendRoomState(roomCode) {

  const room =
    rooms.get(roomCode);

  if (!room) return;

  const players =
    Array.from(
      room.players.values()
    ).map(publicPlayer);

  io.to(roomCode).emit(
    "roomState",
    {
      roomCode,
      players
    }
  );

}


/* =========================================
   ルーム削除
========================================= */

function cleanupRoom(roomCode) {

  const room =
    rooms.get(roomCode);

  if (!room) return;

  if (room.players.size === 0) {

    rooms.delete(roomCode);

  }

}


/* =========================================
   Socket.IO
========================================= */

io.on("connection", (socket) => {

  console.log(
    "接続:",
    socket.id
  );


  /* =======================================
     ルーム作成
  ======================================= */

  socket.on(
    "createRoom",
    (data = {}) => {

      const roomCode =
        generateRoomCode();

      const player =
        createServerPlayer(
          socket.id,
          data
        );

      const room = {

        players:
          new Map()

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

      socket.data.roomCode =
        roomCode;

      socket.data.playerId =
        socket.id;


      socket.emit(
        "roomCreated",
        {
          roomCode,
          player:
            publicPlayer(player)
        }
      );


      sendRoomState(
        roomCode
      );


      console.log(
        `ルーム作成: ${roomCode} / ${player.name}`
      );

    }
  );


  /* =======================================
     ルーム参加
  ======================================= */

  socket.on(
    "joinRoom",
    (data = {}) => {

      const roomCode =
        String(
          data.roomCode || ""
        )
        .trim()
        .toUpperCase();

      const room =
        rooms.get(roomCode);


      if (!room) {

        socket.emit(
          "onlineError",
          "そのルームは存在しません。"
        );

        return;

      }


      const player =
        createServerPlayer(
          socket.id,
          data
        );


      room.players.set(
        socket.id,
        player
      );


      socket.join(
        roomCode
      );

      socket.data.roomCode =
        roomCode;

      socket.data.playerId =
        socket.id;


      socket.emit(
        "roomJoined",
        {
          roomCode,
          player:
            publicPlayer(player)
        }
      );


      sendRoomState(
        roomCode
      );


      console.log(
        `ルーム参加: ${roomCode} / ${player.name}`
      );

    }
  );


  /* =======================================
     プレイヤー情報更新
  ======================================= */

  socket.on(
    "updatePlayer",
    (data = {}) => {

      const roomCode =
        socket.data.roomCode;

      if (!roomCode) return;

      const room =
        rooms.get(roomCode);

      if (!room) return;

      const player =
        room.players.get(
          socket.id
        );

      if (!player) return;


      /*
        クライアントから送られた
        プレイヤーデータを更新
      */

      if (
        typeof data.name === "string"
      ) {

        player.name =
          data.name
            .slice(0, 20);

      }


      if (
        typeof data.job === "string"
      ) {

        player.job =
          data.job
            .slice(0, 20);

      }


      if (
        Number.isFinite(
          Number(data.level)
        )
      ) {

        player.level =
          Math.max(
            1,
            Number(data.level)
          );

      }


      if (
        Number.isFinite(
          Number(data.xp)
        )
      ) {

        player.xp =
          Math.max(
            0,
            Number(data.xp)
          );

      }


      if (
        Number.isFinite(
          Number(data.maxHp)
        )
      ) {

        player.maxHp =
          Math.max(
            1,
            Number(data.maxHp)
          );

      }


      if (
        Number.isFinite(
          Number(data.hp)
        )
      ) {

        player.hp =
          Math.max(
            0,
            Math.min(
              player.maxHp,
              Number(data.hp)
            )
          );

      }


      if (
        Number.isFinite(
          Number(data.attack)
        )
      ) {

        player.attack =
          Math.max(
            0,
            Number(data.attack)
          );

      }


      if (
        Number.isFinite(
          Number(data.money)
        )
      ) {

        player.money =
          Math.max(
            0,
            Number(data.money)
          );

      }


      if (
        Number.isFinite(
          Number(data.bounty)
        )
      ) {

        player.bounty =
          Math.max(
            0,
            Number(data.bounty)
          );

      }


      if (
        typeof data.weapon === "string"
      ) {

        player.weapon =
          data.weapon
            .slice(0, 20);

      }


      if (
        Array.isArray(data.skills)
      ) {

        player.skills =
          data.skills
            .slice(0, 20);

      }


      if (
        Number.isFinite(
          Number(data.defeats)
        )
      ) {

        player.defeats =
          Math.max(
            0,
            Number(data.defeats)
          );

      }


      let moved = false;


      if (
        Number.isFinite(
          Number(data.x)
        )
      ) {

        const newX =
          Number(data.x);

        if (
          newX !== player.x
        ) {

          player.x =
            newX;

          moved = true;

        }

      }


      if (
        Number.isFinite(
          Number(data.y)
        )
      ) {

        const newY =
          Number(data.y);

        if (
          newY !== player.y
        ) {

          player.y =
            newY;

          moved = true;

        }

      }


      if (moved) {

        socket.to(roomCode).emit(
          "playerMoved",
          {
            id: player.id,
            x: player.x,
            y: player.y
          }
        );

      }


      sendRoomState(
        roomCode
      );

    }
  );


  /* =======================================
     プレイヤー一覧要求
  ======================================= */

  socket.on(
    "requestPlayers",
    () => {

      const roomCode =
        socket.data.roomCode;

      if (!roomCode) return;

      sendRoomState(
        roomCode
      );

    }
  );


  /* =======================================
     PvP攻撃
  ======================================= */

  socket.on(
    "attackPlayer",
    (targetId) => {

      const roomCode =
        socket.data.roomCode;

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


      if (!attacker) return;

      if (!target) {

        socket.emit(
          "onlineError",
          "対象プレイヤーが見つかりません。"
        );

        return;

      }


      if (
        attacker.id ===
        target.id
      ) {

        socket.emit(
          "onlineError",
          "自分自身は攻撃できません。"
        );

        return;

      }


      if (target.hp <= 0) {

        socket.emit(
          "onlineError",
          "そのプレイヤーは倒れています。"
        );

        return;

      }


      /*
        PvPダメージ

        攻撃力
        +
        武器補正
        +
        クリティカル
      */

      const weaponBonus = {

        "タガー": 15,

        "剣": 5,

        "強化剣": 25

      };


      let damage =
        Math.max(
          1,
          Number(attacker.attack) || 0
        );


      damage +=
        Number(
          weaponBonus[
            attacker.weapon
          ] || 0
        );


      let critical = false;


      if (
        Math.random() < 0.15
      ) {

        damage += 5;

        critical = true;

      }


      damage =
        Math.max(
          1,
          Math.floor(damage)
        );


      target.hp =
        Math.max(
          0,
          target.hp - damage
        );


      /*
        攻撃した本人へ通知
      */

      socket.emit(
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
            target.hp,

          critical

        }
      );


      /*
        攻撃された側へ通知
      */

      io.to(target.id).emit(
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
            target.hp,

          critical

        }
      );


      /*
        全員に撃破通知
      */

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


        /*
          倒されたプレイヤーは
          サーバー側ではHP全回復
        */

        target.hp =
          target.maxHp;

      }


      sendRoomState(
        roomCode
      );

    }
  );


  /* =======================================
     切断
  ======================================= */

  socket.on(
    "disconnect",
    () => {

      const roomCode =
        socket.data.roomCode;

      if (!roomCode) {

        console.log(
          "切断:",
          socket.id
        );

        return;

      }


      const room =
        rooms.get(roomCode);

      if (!room) return;


      const player =
        room.players.get(
          socket.id
        );


      room.players.delete(
        socket.id
      );


      console.log(
        `プレイヤー退出: ${
          player
            ? player.name
            : socket.id
        } / ${roomCode}`
      );


      sendRoomState(
        roomCode
      );


      cleanupRoom(
        roomCode
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
      `NEON EATER / 勇者の懸賞金RPG サーバー起動: ${PORT}`
    );

  }
);
