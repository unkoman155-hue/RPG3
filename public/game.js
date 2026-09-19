const SAVE_KEY = "yuusha_bounty_rpg_online_v2";

/* =========================================
   Socket.IO
========================================= */

let socket = null;
let online = false;
let roomCode = "";
let onlinePlayers = {};
let myServerPlayer = null;


/* =========================================
   基本
========================================= */

const $ = (id) => document.getElementById(id);

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================
   プレイヤー
========================================= */

let player = {
  started: false,
  gameOver: false,

  name: "",
  job: "",

  level: 1,
  xp: 0,

  maxHp: 30,
  hp: 30,

  attack: 10,

  money: 250,
  bounty: 0,

  weapon: "タガー",

  skills: ["斬撃"],

  inventory: {
    "タガー": 1
  },

  defeats: 0,

  townUnlocked: false,
  townTrust: 0,

  cityUnlocked: false,
  cityTrust: 0,

  encyclopedia: {},

  x: 0,
  y: 0
};


/* =========================================
   職業
========================================= */

const JOBS = {
  "勇者": {
    maxHp: 30,
    attack: 10,
    skill: "斬撃"
  },

  "ヒーラー": {
    maxHp: 35,
    attack: 7,
    skill: "ヒール"
  },

  "剣士": {
    maxHp: 30,
    attack: 14,
    skill: "強斬り"
  }
};


/* =========================================
   スキル
========================================= */

const SKILLS = {
  "斬撃": {
    type: "attack",
    power: 35
  },

  "ヒール": {
    type: "heal",
    power: 25
  },

  "強斬り": {
    type: "attack",
    power: 50
  },

  "高速切り": {
    type: "attack",
    power: 65
  },

  "回転斬り": {
    type: "attack",
    power: 80
  },

  "超斬撃": {
    type: "attack",
    power: 120
  }
};


/* =========================================
   敵
========================================= */

const ENEMIES = [
  {
    name: "怪物猫",
    minLevel: 1,
    maxLevel: 5,
    hp: 20,
    attack: 6,
    xp: 25,
    money: 20,
    area: "草原"
  },

  {
    name: "スライム",
    minLevel: 1,
    maxLevel: 5,
    hp: 25,
    attack: 7,
    xp: 30,
    money: 25,
    area: "草原"
  },

  {
    name: "ゴブリン",
    minLevel: 2,
    maxLevel: 8,
    hp: 35,
    attack: 10,
    xp: 45,
    money: 40,
    area: "草原"
  },

  {
    name: "オオカミ",
    minLevel: 3,
    maxLevel: 10,
    hp: 45,
    attack: 13,
    xp: 60,
    money: 55,
    area: "草原"
  },

  {
    name: "闇の騎士",
    minLevel: 5,
    maxLevel: 20,
    hp: 80,
    attack: 20,
    xp: 100,
    money: 100,
    area: "都市周辺"
  }
];


const BOSS = {
  name: "懸賞金王",
  hp: 500,
  attack: 45,
  xp: 1000,
  money: 1000
};


let currentEnemy = null;
let currentEnemyHp = 0;
let defending = false;
let battleActive = false;
let selectedSkill = null;


/* =========================================
   DOM
========================================= */

function clearScreen() {
  $("screen").innerHTML = "";
}


function showScreen(html) {
  $("screen").innerHTML = html;
}


function addBattleMessage(message) {
  const log = $("log");

  if (!log) return;

  log.innerHTML += `<div>${escapeHtml(message)}</div>`;

  log.scrollTop = log.scrollHeight;
}


function writeLog(message) {
  addBattleMessage(message);
}


function clearLog() {
  if ($("log")) {
    $("log").innerHTML = "";
  }
}


function updateBattleLog() {
  const log = $("log");

  if (!log) return;

  log.scrollTop = log.scrollHeight;
}


/* =========================================
   ステータス
========================================= */

function updateStatus() {
  const status = $("status");

  if (!status) return;

  if (!player.started) {
    status.innerHTML = "ゲーム開始前";
    return;
  }

  status.innerHTML =
    `👤 ${escapeHtml(player.name)}　` +
    `Lv.${player.level}　` +
    `❤️ ${player.hp}/${player.maxHp}　` +
    `💰 ${player.money}　` +
    `💰懸賞金 ${player.bounty}`;
}


/* =========================================
   保存
========================================= */

function saveGame() {
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify(player)
    );
  } catch (e) {
    console.log("保存失敗", e);
  }

  syncPlayerToServer();
}


function loadGame() {
  try {
    const data = localStorage.getItem(SAVE_KEY);

    if (!data) return false;

    const saved = JSON.parse(data);

    player = {
      ...player,
      ...saved
    };

    if (!player.inventory) {
      player.inventory = {};
    }

    if (!player.skills) {
      player.skills = [];
    }

    return true;

  } catch (e) {
    console.log("読み込み失敗", e);
    return false;
  }
}


function deleteSave() {
  localStorage.removeItem(SAVE_KEY);

  resetPlayer();

  showStart();
}


function resetPlayer() {
  player = {
    started: false,
    gameOver: false,

    name: "",
    job: "",

    level: 1,
    xp: 0,

    maxHp: 30,
    hp: 30,

    attack: 10,

    money: 250,
    bounty: 0,

    weapon: "タガー",

    skills: ["斬撃"],

    inventory: {
      "タガー": 1
    },

    defeats: 0,

    townUnlocked: false,
    townTrust: 0,

    cityUnlocked: false,
    cityTrust: 0,

    encyclopedia: {},

    x: 0,
    y: 0
  };

  currentEnemy = null;
  currentEnemyHp = 0;
  battleActive = false;
}


/* =========================================
   オンライン接続
========================================= */

function connectOnline() {
  if (typeof io !== "function") {
    $("onlineMessage").textContent =
      "Socket.IOを読み込めませんでした。";

    return;
  }

  socket = io();

  socket.on("connect", () => {

    online = true;

    $("onlineMessage").textContent =
      "サーバーに接続しました。";

    $("onlineError").textContent = "";

    if (player.name) {
      $("onlineName").value = player.name;
    }
  });


  socket.on("disconnect", () => {

    online = false;

    $("onlineMessage").textContent =
      "サーバーとの接続が切れました。";
  });


  socket.on("connect_error", () => {

    online = false;

    $("onlineMessage").textContent =
      "サーバーに接続できません。";
  });


  socket.on("roomCreated", (data) => {

    roomCode = data.roomCode;

    if (data.player) {
      myServerPlayer = data.player;
    }

    showOnlineRoom();
  });


  socket.on("roomJoined", (data) => {

    roomCode = data.roomCode;

    if (data.player) {
      myServerPlayer = data.player;
    }

    showOnlineRoom();
  });


  socket.on("onlineError", (message) => {

    $("onlineError").textContent =
      message || "エラーが発生しました。";
  });


  socket.on("roomState", (data) => {

    if (!data) return;

    roomCode = data.roomCode || roomCode;

    onlinePlayers = {};

    if (Array.isArray(data.players)) {

      data.players.forEach((p) => {
        onlinePlayers[p.id] = p;
      });

    }

    renderOnlinePlayers();

    updatePlayerList();

    updateStatus();
  });


  socket.on("playerMoved", (data) => {

    if (!data) return;

    if (onlinePlayers[data.id]) {

      onlinePlayers[data.id].x = data.x;
      onlinePlayers[data.id].y = data.y;

      renderOnlinePlayers();
    }
  });


  socket.on("playerDamaged", (data) => {

    if (!data) return;

    const target = onlinePlayers[data.targetId];

    if (target) {
      target.hp = data.hp;
    }

    if (data.targetId === socket.id) {

      player.hp = Math.max(
        0,
        Number(data.hp) || 0
      );

      addBattleMessage(
        `⚔️ オンライン攻撃で ${data.damage} ダメージ！`
      );

      updateStatus();
      saveGame();
    }

    renderOnlinePlayers();
  });


  socket.on("playerDefeated", (data) => {

    if (!data) return;

    addBattleMessage(
      `💥 ${data.attackerName} が ${data.targetName} を倒した！`
    );

    if (
      socket &&
      data.attackerId === socket.id
    ) {

      player.defeats += 1;
      player.bounty += 50;

      addBattleMessage(
        "🏆 撃破報酬！懸賞金 +50"
      );

      saveGame();
    }

    if (
      socket &&
      data.targetId === socket.id
    ) {

      player.hp = player.maxHp;

      addBattleMessage(
        "💀 倒されました！HPが全回復しました。"
      );

      saveGame();
    }

    renderOnlinePlayers();
  });
}


/* =========================================
   オンライン画面
========================================= */

function showOnlineOverlay() {

  const overlay = $("onlineOverlay");

  if (!overlay) return;

  overlay.classList.remove("hidden");

  $("onlineError").textContent = "";

  if (player.name) {
    $("onlineName").value = player.name;
  }
}


function closeOnlineOverlay() {

  const overlay = $("onlineOverlay");

  if (!overlay) return;

  overlay.classList.add("hidden");
}


function createOnlineRoom() {

  if (!socket || !online) {

    $("onlineError").textContent =
      "まだサーバーに接続できていません。";

    return;
  }

  const input = $("onlineName");

  const name =
    input.value.trim() || "名無し";

  player.name = name;

  socket.emit("createRoom", {
    name
  });
}


function joinOnlineRoom() {

  if (!socket || !online) {

    $("onlineError").textContent =
      "まだサーバーに接続できていません。";

    return;
  }

  const name =
    $("onlineName").value.trim() || "名無し";

  const code =
    $("roomCodeInput").value
      .trim()
      .toUpperCase();

  if (!code) {

    $("onlineError").textContent =
      "ルームコードを入力してください。";

    return;
  }

  player.name = name;

  socket.emit("joinRoom", {
    name,
    roomCode: code
  });
}


function showOnlineRoom() {

  $("roomInfo").classList.remove("hidden");

  $("onlinePlayers").classList.remove("hidden");

  $("closeOnlineButton").classList.remove("hidden");

  $("roomCodeDisplay").textContent =
    roomCode;

  $("onlineMessage").textContent =
    "ルームに接続しました！";

  $("onlineError").textContent = "";

  updatePlayerList();

  if (socket) {
    socket.emit("requestPlayers");
  }

  syncPlayerToServer();
}


function updatePlayerList() {

  const list = $("playerList");

  if (!list) return;

  const players =
    Object.values(onlinePlayers);

  if (!players.length) {

    list.innerHTML =
      "<div>まだプレイヤーがいません。</div>";

    return;
  }

  list.innerHTML =
    players.map((p) => {

      const isMe =
        socket && p.id === socket.id;

      return `
        <div class="player-list-item">
          ${isMe ? "⭐ " : "👤 "}
          <b>${escapeHtml(p.name)}</b>
          <br>
          <small>
            ${escapeHtml(p.job || "勇者")}
            / Lv.${p.level}
            / HP ${p.hp}/${p.maxHp}
            / 💰 ${p.bounty}
          </small>
        </div>
      `;

    }).join("");
}


/* =========================================
   オンラインプレイヤー表示
========================================= */

function renderOnlinePlayers() {

  const container =
    $("remotePlayers");

  if (!container) return;

  container.innerHTML = "";

  Object.values(onlinePlayers)
    .forEach((p) => {

      if (socket && p.id === socket.id) {
        return;
      }

      const div =
        document.createElement("div");

      div.className =
        "remote-player";

      /*
        ゲーム内座標を画面座標へ
      */

      const x =
        50 + Number(p.x || 0) / 10;

      const y =
        45 + Number(p.y || 0) / 10;

      div.style.left =
        `${Math.max(5, Math.min(95, x))}%`;

      div.style.top =
        `${Math.max(10, Math.min(85, y))}%`;

      div.innerHTML = `
        <div class="remote-player-name">
          👤 ${escapeHtml(p.name)}
        </div>

        <div class="remote-player-info">
          Lv.${p.level}
          ❤️ ${p.hp}/${p.maxHp}
        </div>
      `;

      container.appendChild(div);
    });
}


/* =========================================
   サーバーへ同期
========================================= */

function syncPlayerToServer() {

  if (!socket || !online) return;

  socket.emit("updatePlayer", {

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
  });
}


/* =========================================
   移動
========================================= */

function moveOnline(x, y) {

  player.x = x;
  player.y = y;

  if (socket && online) {

    socket.emit("move", {
      x,
      y
    });
  }
}


/* =========================================
   オンラインPvP
========================================= */

function showOnlineTargetSelect() {

  if (!online) {

    addBattleMessage(
      "オンラインに接続していません。"
    );

    return;
  }

  const targets =
    Object.values(onlinePlayers)
      .filter((p) =>
        socket && p.id !== socket.id
      );

  if (!targets.length) {

    showScreen(`
      <div class="battle-screen">
        <h2>⚔️ オンライン戦闘</h2>

        <p>
          現在、戦える他プレイヤーがいません。
        </p>

        <button onclick="showBattle()">
          戻る
        </button>
      </div>
    `);

    return;
  }

  showScreen(`
    <div class="battle-screen">

      <h2>⚔️ プレイヤーを選択</h2>

      ${targets.map((p) => `

        <button
          onclick="attackOnlinePlayer('${p.id}')"
        >
          ⚔️ ${escapeHtml(p.name)}
          <br>
          Lv.${p.level}
          / ❤️ ${p.hp}/${p.maxHp}
        </button>

      `).join("")}

      <button onclick="showBattle()">
        戻る
      </button>

    </div>
  `);
}


function attackOnlinePlayer(targetId) {

  if (!socket || !online) return;

  socket.emit(
    "attackPlayer",
    targetId
  );
}


/* =========================================
   スタート
========================================= */

function showStart() {

  clearLog();

  showScreen(`
    <div class="start-screen">

      <h2 class="screen-title">
        ⚔️ 勇者の懸賞金RPG ONLINE
      </h2>

      <p class="description">
        モンスターを倒して強くなり、
        懸賞金を集めよう！
      </p>

      <button onclick="showCreatePlayer()">
        ▶️ 新しく始める
      </button>

      ${
        player.started
          ? `
            <button onclick="continueGame()">
              🔄 続きから
            </button>
          `
          : ""
      }

    </div>
  `);

  updateStatus();
}


function showCreatePlayer() {

  showScreen(`
    <div class="create-screen">

      <h2>👤 プレイヤー作成</h2>

      <input
        id="playerName"
        type="text"
        maxlength="20"
        placeholder="名前を入力"
      >

      <button onclick="chooseJob()">
        次へ
      </button>

    </div>
  `);
}


function chooseJob() {

  const nameInput =
    $("playerName");

  const name =
    nameInput
      ? nameInput.value.trim()
      : "";

  if (!name) {

    alert("名前を入力してください。");
    return;
  }

  player.name = name;

  showScreen(`
    <div class="create-screen">

      <h2>⚔️ 職業を選択</h2>

      <button onclick="createPlayer('勇者')">
        ⚔️ 勇者
        <br>
        HP 30 / 攻撃 10
      </button>

      <button onclick="createPlayer('ヒーラー')">
        ❤️ ヒーラー
        <br>
        HP 35 / 攻撃 7
      </button>

      <button onclick="createPlayer('剣士')">
        🗡️ 剣士
        <br>
        HP 30 / 攻撃 14
      </button>

    </div>
  `);
}


function createPlayer(job) {

  const data = JOBS[job];

  if (!data) return;

  player.started = true;
  player.gameOver = false;

  player.job = job;

  player.level = 1;
  player.xp = 0;

  player.maxHp = data.maxHp;
  player.hp = data.maxHp;

  player.attack = data.attack;

  player.money = 250;
  player.bounty = 0;

  player.weapon = "タガー";

  player.skills = [data.skill];

  player.inventory = {
    "タガー": 1
  };

  player.defeats = 0;

  player.townUnlocked = false;
  player.townTrust = 0;

  player.cityUnlocked = false;
  player.cityTrust = 0;

  player.encyclopedia = {};

  player.x = 0;
  player.y = 0;

  saveGame();

  showHome();
}


/* =========================================
   ホーム
========================================= */

function showHome() {

  if (!player.started) {
    showStart();
    return;
  }

  updateStatus();

  const requiredXp =
    50 + player.level * 50;

  const xpPercent =
    Math.min(
      100,
      (player.xp / requiredXp) * 100
    );

  showScreen(`
    <div class="home-screen">

      <h2 class="screen-title">
        🏠 ホーム
      </h2>

      <div class="info-box">

        <h3>
          👤 ${escapeHtml(player.name)}
        </h3>

        <p>
          職業：${escapeHtml(player.job)}
        </p>

        <p>
          Lv.${player.level}
        </p>

        <div class="xp-bar">
          <div
            class="xp-bar-inner"
            style="width:${xpPercent}%"
          ></div>
        </div>

        <p>
          XP ${player.xp} / ${requiredXp}
        </p>

      </div>

      <div class="stat-grid">

        <div class="stat">
          <div class="stat-title">❤️ HP</div>
          <div class="stat-value">
            ${player.hp}/${player.maxHp}
          </div>
        </div>

        <div class="stat">
          <div class="stat-title">⚔️ 攻撃</div>
          <div class="stat-value">
            ${player.attack}
          </div>
        </div>

        <div class="stat">
          <div class="stat-title">💰 お金</div>
          <div class="stat-value">
            ${player.money}
          </div>
        </div>

        <div class="stat">
          <div class="stat-title">🏆 懸賞金</div>
          <div class="stat-value">
            ${player.bounty}
          </div>
        </div>

      </div>

      <button onclick="showBattle()">
        ⚔️ モンスターと戦う
      </button>

      <button onclick="showOnlineTargetSelect()">
        🌐 プレイヤーと戦う
      </button>

      <button onclick="showBoss()">
        👑 懸賞金王に挑む
      </button>

    </div>
  `);
}


/* =========================================
   戦闘
========================================= */

function showBattle() {

  if (!player.started) {
    showStart();
    return;
  }

  showScreen(`
    <div class="battle-screen">

      <h2>⚔️ 戦う</h2>

      <p class="description">
        モンスターを選んで戦おう。
      </p>

      <button onclick="startBattle()">
        🎲 敵を探す
      </button>

      <button onclick="showOnlineTargetSelect()">
        🌐 プレイヤーと戦う
      </button>

    </div>
  `);
}


function startBattle() {

  const available =
    ENEMIES.filter((enemy) => {

      return (
        player.level >= enemy.minLevel &&
        player.level <= enemy.maxLevel + 5
      );

    });

  const pool =
    available.length
      ? available
      : ENEMIES;

  currentEnemy =
    pool[Math.floor(
      Math.random() * pool.length
    )];

  currentEnemyHp =
    currentEnemy.hp;

  battleActive = true;
  defending = false;

  player.hp =
    Math.min(
      player.maxHp,
      player.hp
    );

  player.encyclopedia[currentEnemy.name] = true;

  saveGame();

  showBattleScreen();
}


function showBattleScreen() {

  if (!currentEnemy) {
    showBattle();
    return;
  }

  const hpPercent =
    Math.max(
      0,
      (currentEnemyHp / currentEnemy.hp) * 100
    );

  showScreen(`
    <div class="battle-screen">

      <h2>⚔️ 戦闘中</h2>

      <div class="enemy-box">

        <h3>
          👹 ${escapeHtml(currentEnemy.name)}
        </h3>

        <p>
          HP ${currentEnemyHp}/${currentEnemy.hp}
        </p>

        <div class="hp-bar">
          <div
            class="hp-bar-inner"
            style="width:${hpPercent}%"
          ></div>
        </div>

        <p>
          攻撃力：${currentEnemy.attack}
        </p>

      </div>

      <div class="info-box">

        ❤️ 自分
        ${player.hp}/${player.maxHp}

        <div class="hp-bar">
          <div
            class="hp-bar-inner"
            style="width:${
              Math.max(
                0,
                player.hp / player.maxHp * 100
              )
            }%"
          ></div>
        </div>

      </div>

      <div class="battle-actions">

        <button onclick="attackEnemy()">
          ⚔️ 攻撃
        </button>

        <button onclick="defend()">
          🛡️ 防御
        </button>

        <button onclick="showSkillSelect()">
          ✨ スキル
        </button>

        <button onclick="inspectEnemy()">
          🔎 調べる
        </button>

        <button onclick="flee()">
          🏃 逃げる
        </button>

      </div>

    </div>
  `);

  updateStatus();
}


function attackEnemy() {

  if (!battleActive || !currentEnemy) {
    return;
  }

  let damage =
    player.attack;

  if (player.weapon === "タガー") {
    damage += 15;
  }

  if (player.weapon === "剣") {
    damage += 5;
  }

  if (player.weapon === "強化剣") {
    damage += 25;
  }

  if (Math.random() < 0.15) {

    damage += 5;

    addBattleMessage(
      "💥 クリティカル！"
    );
  }

  if (
    player.weapon === "タガー" &&
    Math.random() < 0.25
  ) {

    damage += 5;

    addBattleMessage(
      "🩸 タガーの出血効果！"
    );
  }

  damage =
    Math.max(
      1,
      Math.floor(damage)
    );

  currentEnemyHp -= damage;

  addBattleMessage(
    `⚔️ ${currentEnemy.name} に ${damage} ダメージ！`
  );

  if (currentEnemyHp <= 0) {

    currentEnemyHp = 0;

    victory();

    return;
  }

  showBattleScreen();

  setTimeout(() => {

    if (battleActive) {
      enemyAttack();
    }

  }, 500);
}


function defend() {

  if (!battleActive) return;

  defending = true;

  addBattleMessage(
    "🛡️ 防御態勢！"
  );

  setTimeout(() => {

    if (battleActive) {
      enemyAttack();
    }

  }, 400);
}


function showSkillSelect() {

  if (!battleActive) return;

  selectedSkill = null;

  showScreen(`
    <div class="skill-screen">

      <h2>✨ スキル選択</h2>

      <div class="skill-list">

        ${player.skills.map((skill) => {

          const info = SKILLS[skill];

          return `
            <button
              onclick="useSelectedSkill('${skill}')"
            >
              ✨ ${escapeHtml(skill)}
              <br>
              ${
                info.type === "heal"
                  ? `回復 ${info.power}`
                  : `攻撃 ${info.power}`
              }
            </button>
          `;

        }).join("")}

      </div>

      <button onclick="showBattleScreen()">
        戻る
      </button>

    </div>
  `);
}


function useSkill(skill) {
  useSelectedSkill(skill);
}


function useSelectedSkill(skill) {

  if (!battleActive || !currentEnemy) {
    return;
  }

  const info = SKILLS[skill];

  if (!info) return;

  if (info.type === "heal") {

    const before = player.hp;

    player.hp =
      Math.min(
        player.maxHp,
        player.hp + info.power
      );

    addBattleMessage(
      `❤️ ${skill}！HPが ${player.hp - before} 回復！`
    );

  } else {

    const damage =
      Math.max(
        1,
        info.power + Math.floor(player.attack / 3)
      );

    currentEnemyHp -= damage;

    addBattleMessage(
      `✨ ${skill}！${damage} ダメージ！`
    );

    if (currentEnemyHp <= 0) {

      currentEnemyHp = 0;

      victory();

      return;
    }
  }

  showBattleScreen();

  setTimeout(() => {

    if (battleActive) {
      enemyAttack();
    }

  }, 500);
}


function enemyAttack() {

  if (!battleActive || !currentEnemy) {
    return;
  }

  let damage =
    currentEnemy.attack;

  if (defending) {

    damage =
      Math.ceil(damage / 2);

    defending = false;

    addBattleMessage(
      "🛡️ 防御でダメージ半減！"
    );
  }

  player.hp -= damage;

  player.hp =
    Math.max(
      0,
      player.hp
    );

  addBattleMessage(
    `👹 ${currentEnemy.name} の攻撃！ ${damage} ダメージ！`
  );

  updateStatus();

  if (player.hp <= 0) {

    gameOver();

    return;
  }

  showBattleScreen();

  saveGame();
}


function inspectEnemy() {

  if (!currentEnemy) return;

  addBattleMessage(
    `${currentEnemy.name}：HP ${currentEnemyHp} / 攻撃 ${currentEnemy.attack}`
  );
}


function flee() {

  if (!battleActive) return;

  battleActive = false;

  currentEnemy = null;
  currentEnemyHp = 0;

  addBattleMessage(
    "🏃 戦闘から逃げた！"
  );

  showBattle();
}


/* =========================================
   勝利
========================================= */

function victory() {

  battleActive = false;

  const enemy = currentEnemy;

  player.defeats += 1;

  player.xp += enemy.xp;

  player.money += enemy.money;

  player.bounty += 10;

  if (player.defeats >= 3) {

    player.townUnlocked = true;
  }

  if (player.defeats >= 8) {

    player.cityUnlocked = true;
  }

  addBattleMessage(
    `🎉 ${enemy.name} を倒した！`
  );

  addBattleMessage(
    `✨ XP +${enemy.xp}`
  );

  addBattleMessage(
    `💰 お金 +${enemy.money}`
  );

  addBattleMessage(
    `🏆 懸賞金 +10`
  );

  currentEnemy = null;
  currentEnemyHp = 0;

  saveGame();

  showVictoryScreen();

  setTimeout(() => {

    checkLevelUp();

  }, 1500);
}


function showVictoryScreen() {

  showScreen(`
    <div class="victory-screen">

      <h2>🎉 勝利！</h2>

      <p>
        敵を倒しました！
      </p>

      <p>
        撃破数：${player.defeats}
      </p>

      <button onclick="showBattle()">
        ⚔️ 次の戦い
      </button>

      <button onclick="showHome()">
        🏠 ホーム
      </button>

    </div>
  `);

  updateStatus();
}


/* =========================================
   レベルアップ
========================================= */

function checkLevelUp() {

  const required =
    50 + player.level * 50;

  if (player.xp < required) {
    return;
  }

  player.xp -= required;

  player.level += 1;

  addBattleMessage(
    `🎉 Lv.${player.level} に上がった！`
  );

  showLevelUpChoice();

  saveGame();
}


function showLevelUpChoice() {

  showScreen(`
    <div class="levelup-screen">

      <h2>⬆️ レベルアップ！</h2>

      <p>
        強化する項目を選択してください。
      </p>

      <button onclick="levelUpHp()">
        ❤️ 最大HP +5
      </button>

      <button onclick="levelUpAttack()">
        ⚔️ 攻撃力 +20
      </button>

      <button onclick="unlockSkill()">
        ✨ 新しいスキル
      </button>

    </div>
  `);
}


function levelUpHp() {

  player.maxHp += 5;

  player.hp =
    player.maxHp;

  addBattleMessage(
    "❤️ 最大HP +5！"
  );

  saveGame();

  showHome();
}


function levelUpAttack() {

  player.attack += 20;

  addBattleMessage(
    "⚔️ 攻撃力 +20！"
  );

  saveGame();

  showHome();
}


function unlockSkill() {

  const available =
    Object.keys(SKILLS)
      .filter((skill) =>
        !player.skills.includes(skill)
      );

  if (!available.length) {

    player.attack += 10;

    addBattleMessage(
      "✨ 全スキル取得済み！攻撃力 +10"
    );

    saveGame();

    showHome();

    return;
  }

  const skill =
    available[
      Math.floor(
        Math.random() * available.length
      )
    ];

  player.skills.push(skill);

  addBattleMessage(
    `✨ 新スキル「${skill}」を覚えた！`
  );

  saveGame();

  showHome();
}


/* =========================================
   ゲームオーバー
========================================= */

function gameOver() {

  battleActive = false;

  player.gameOver = true;

  player.hp = 0;

  saveGame();

  showScreen(`
    <div class="gameover-screen">

      <h2>💀 GAME OVER</h2>

      <p>
        あなたは倒れてしまった……
      </p>

      <button onclick="restartAfterDeath()">
        🔄 最初からやり直す
      </button>

    </div>
  `);
}


function restartAfterDeath() {

  resetPlayer();

  showStart();
}


/* =========================================
   町
========================================= */

function showTown() {

  if (!player.townUnlocked) {

    showScreen(`
      <div class="locked-screen">

        <div class="lock">
          🔒
        </div>

        <h2>🏘️ 町</h2>

        <p>
          モンスターを3体倒すと解放されます。
        </p>

        <p>
          現在：${player.defeats} / 3
        </p>

      </div>
    `);

    return;
  }

  showScreen(`
    <div class="town-screen">

      <h2>🏘️ 町</h2>

      <p>
        信頼度：${player.townTrust}
      </p>

      <button onclick="townHeal()">
        ❤️ 回復する（30G）
      </button>

      <button onclick="townShop()">
        🛒 町のショップ
      </button>

      <button onclick="townEvent()">
        🎁 町イベント
      </button>

    </div>
  `);
}


function townHeal() {

  if (player.money < 30) {

    addBattleMessage(
      "💰 お金が足りません。"
    );

    return;
  }

  player.money -= 30;

  player.hp =
    player.maxHp;

  addBattleMessage(
    "❤️ HPが全回復しました！"
  );

  saveGame();

  showTown();
}


function townShop() {

  showScreen(`
    <div class="shop-screen">

      <h2>🛒 町のショップ</h2>

      <button onclick="buySword()">
        🗡️ 剣（100G）
      </button>

      <button onclick="buyDagger()">
        🗡️ タガー（50G）
      </button>

      <button onclick="showTown()">
        戻る
      </button>

    </div>
  `);
}


function buySword() {

  if (player.money < 100) {

    addBattleMessage(
      "💰 お金が足りません。"
    );

    return;
  }

  player.money -= 100;

  player.inventory["剣"] =
    (player.inventory["剣"] || 0) + 1;

  player.weapon = "剣";

  addBattleMessage(
    "🗡️ 剣を購入しました！"
  );

  saveGame();

  showTown();
}


function buyDagger() {

  if (player.money < 50) {

    addBattleMessage(
      "💰 お金が足りません。"
    );

    return;
  }

  player.money -= 50;

  player.inventory["タガー"] =
    (player.inventory["タガー"] || 0) + 1;

  player.weapon = "タガー";

  addBattleMessage(
    "🗡️ タガーを購入しました！"
  );

  saveGame();

  showTown();
}


function townEvent() {

  const r =
    Math.random();

  if (r < 0.33) {

    player.inventory["薬草"] =
      (player.inventory["薬草"] || 0) + 1;

    addBattleMessage(
      "🌿 薬草をもらった！"
    );

  } else if (r < 0.66) {

    player.inventory["タガー"] =
      (player.inventory["タガー"] || 0) + 1;

    addBattleMessage(
      "🗡️ タガーをもらった！"
    );

  } else {

    player.money += 100;

    addBattleMessage(
      "💰 100Gもらった！"
    );
  }

  player.townTrust += 1;

  saveGame();

  showTown();
}


/* =========================================
   都市
========================================= */

function showCity() {

  if (!player.cityUnlocked) {

    showScreen(`
      <div class="locked-screen">

        <div class="lock">
          🔒
        </div>

        <h2>🏙️ 都市</h2>

        <p>
          モンスターを8体倒すと解放されます。
        </p>

        <p>
          現在：${player.defeats} / 8
        </p>

      </div>
    `);

    return;
  }

  showScreen(`
    <div class="city-screen">

      <h2>🏙️ 都市</h2>

      <p>
        信頼度：${player.cityTrust}
      </p>

      <button onclick="cityHeal()">
        ❤️ 完全回復（80G）
      </button>

      <button onclick="cityShop()">
        🛒 都市ショップ
      </button>

      <button onclick="cityEvent()">
        🎉 都市イベント
      </button>

    </div>
  `);
}


function cityHeal() {

  if (player.money < 80) {

    addBattleMessage(
      "💰 お金が足りません。"
    );

    return;
  }

  player.money -= 80;

  player.hp =
    player.maxHp;

  addBattleMessage(
    "❤️ HPが全回復しました！"
  );

  saveGame();

  showCity();
}


function cityShop() {

  showScreen(`
    <div class="shop-screen">

      <h2>🛒 都市ショップ</h2>

      <button onclick="buyCityWeapon()">
        ⚔️ 強化剣（300G）
      </button>

      <button onclick="buyPotion()">
        🧪 ポーション（50G）
      </button>

      <button onclick="showCity()">
        戻る
      </button>

    </div>
  `);
}


function buyCityWeapon() {

  if (player.money < 300) {

    addBattleMessage(
      "💰 お金が足りません。"
    );

    return;
  }

  player.money -= 300;

  player.inventory["強化剣"] =
    (player.inventory["強化剣"] || 0) + 1;

  player.weapon = "強化剣";

  addBattleMessage(
    "⚔️ 強化剣を購入しました！"
  );

  saveGame();

  showCity();
}


function buyPotion() {

  if (player.money < 50) {

    addBattleMessage(
      "💰 お金が足りません。"
    );

    return;
  }

  player.money -= 50;

  player.inventory["ポーション"] =
    (player.inventory["ポーション"] || 0) + 1;

  addBattleMessage(
    "🧪 ポーションを購入しました！"
  );

  saveGame();

  showCity();
}


function cityEvent() {

  player.money += 150;

  player.cityTrust += 1;

  addBattleMessage(
    "🎉 都市イベントで150G獲得！"
  );

  saveGame();

  showCity();
}


/* =========================================
   ガチャ
========================================= */

function showGacha() {

  showScreen(`
    <div class="gacha-screen">

      <h2>🎰 ガチャ</h2>

      <p>
        1回 50G
      </p>

      <button onclick="gacha()">
        🎰 ガチャを回す
      </button>

    </div>
  `);
}


function gacha() {

  if (player.money < 50) {

    addBattleMessage(
      "💰 お金が足りません。"
    );

    return;
  }

  player.money -= 50;

  const item =
    Math.random() < 0.5
      ? "タガー"
      : "剣";

  player.inventory[item] =
    (player.inventory[item] || 0) + 1;

  saveGame();

  showGachaResult(item);
}


function showGachaResult(item) {

  showScreen(`
    <div class="gacha-result">

      <h2>🎉 ガチャ結果</h2>

      <div class="result-item">
        ${escapeHtml(item)}
      </div>

      <button onclick="equipWeapon('${item}')">
        ⚔️ 装備する
      </button>

      <button onclick="showGacha()">
        🎰 もう一度
      </button>

    </div>
  `);
}


/* =========================================
   バッグ
========================================= */

function showBag() {

  const items =
    Object.entries(player.inventory);

  showScreen(`
    <div class="bag-screen">

      <h2>🎒 バック</h2>

      ${
        items.length
          ? `
            <div class="inventory-list">

              ${items.map(([item, count]) => `

                <div class="inventory-item">

                  <span>
                    ${escapeHtml(item)}
                    ×${count}
                  </span>

                  ${
                    [
                      "タガー",
                      "剣",
                      "強化剣"
                    ].includes(item)
                      ? `
                        <button
                          onclick="equipWeapon('${item}')"
                        >
                          装備
                        </button>
                      `
                      : item === "ポーション"
                        ? `
                          <button
                            onclick="usePotion()"
                          >
                            使う
                          </button>
                        `
                        : ""
                  }

                </div>

              `).join("")}

            </div>
          `
          : "<p>アイテムがありません。</p>"
      }

    </div>
  `);
}


function equipWeapon(weapon) {

  if (!player.inventory[weapon]) {
    return;
  }

  player.weapon = weapon;

  addBattleMessage(
    `⚔️ ${weapon}を装備しました！`
  );

  saveGame();

  showBag();
}


function usePotion() {

  if (
    !player.inventory["ポーション"] ||
    player.inventory["ポーション"] <= 0
  ) {

    return;
  }

  player.inventory["ポーション"]--;

  player.hp =
    Math.min(
      player.maxHp,
      player.hp + 30
    );

  addBattleMessage(
    "🧪 ポーションでHP +30！"
  );

  saveGame();

  showBag();
}


/* =========================================
   ボス
========================================= */

function showBoss() {

  showScreen(`
    <div class="boss-screen">

      <h2>👑 懸賞金王</h2>

      <div class="enemy-box">

        <p>
          ❤️ HP ${BOSS.hp}
        </p>

        <p>
          ⚔️ 攻撃 ${BOSS.attack}
        </p>

        <p>
          💰 報酬 ${BOSS.money}G
        </p>

      </div>

      <button onclick="startBossBattle()">
        👑 挑戦する
      </button>

      <button onclick="showHome()">
        戻る
      </button>

    </div>
  `);
}


function startBossBattle() {

  currentEnemy = {
    ...BOSS
  };

  currentEnemyHp =
    BOSS.hp;

  battleActive = true;
  defending = false;

  showBattleScreen();
}


/* =========================================
   設定
========================================= */

function showSettings() {

  showScreen(`
    <div class="settings-screen">

      <h2>⚙️ 設定</h2>

      <button onclick="deleteSaveConfirm()">
        🗑️ セーブデータ削除
      </button>

      <button onclick="showSkillInfo()">
        ✨ スキル一覧
      </button>

      <button onclick="showLevelInfo()">
        ⬆️ レベル情報
      </button>

      <button onclick="showEncyclopedia()">
        📖 図鑑
      </button>

      <button onclick="showHome()">
        戻る
      </button>

    </div>
  `);
}


function deleteSaveConfirm() {

  const ok =
    confirm(
      "本当にセーブデータを削除しますか？"
    );

  if (!ok) return;

  deleteSave();
}


function showSkillInfo() {

  showScreen(`
    <div class="info-screen">

      <h2>✨ スキル一覧</h2>

      ${Object.entries(SKILLS)
        .map(([name, info]) => `

          <div class="info-box">

            <b>
              ${escapeHtml(name)}
            </b>

            <p>
              ${
                info.type === "heal"
                  ? `回復力：${info.power}`
                  : `攻撃力：${info.power}`
              }
            </p>

          </div>

        `)
        .join("")}

      <button onclick="showSettings()">
        戻る
      </button>

    </div>
  `);
}


function showLevelInfo() {

  showScreen(`
    <div class="info-screen">

      <h2>⬆️ レベル情報</h2>

      <p>
        現在レベル：${player.level}
      </p>

      <p>
        現在XP：${player.xp}
      </p>

      <p>
        次のレベルまで：
        ${50 + player.level * 50}
      </p>

      <button onclick="showSettings()">
        戻る
      </button>

    </div>
  `);
}


function showEncyclopedia() {

  const names =
    Object.keys(player.encyclopedia);

  showScreen(`
    <div class="encyclopedia-screen">

      <h2>📖 モンスター図鑑</h2>

      ${
        names.length
          ? names.map((name) => `
              <div class="info-box">
                👹 ${escapeHtml(name)}
              </div>
            `).join("")
          : "<p>まだ登録されていません。</p>"
      }

      <button onclick="showSettings()">
        戻る
      </button>

    </div>
  `);
}


/* =========================================
   起動
========================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadGame();

    updateStatus();

    connectOnline();

    if (player.started) {
      showHome();
    } else {
      showStart();
    }

    showOnlineOverlay();

  }
);
