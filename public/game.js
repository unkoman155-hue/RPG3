// ========================================
// 勇者の懸賞金RPG
// game.js
// オンライン + 公開チャット対応版
// ========================================

"use strict";

// ========================================
// 基本設定
// ========================================

const SAVE_KEY = "yuusha_bounty_rpg_online_v5";

const socket =
  typeof io === "function"
    ? io()
    : null;

let online = false;
let currentRoomCode = "";
let currentPlayerId = "";
let onlinePlayerName = "";
let remotePlayers = {};
let chatHistory = [];

// ========================================
// DOM取得
// ========================================

function $(id) {
  return document.getElementById(id);
}

function show(id) {
  const el = $(id);
  if (el) {
    el.classList.remove("hidden");
  }
}

function hide(id) {
  const el = $(id);
  if (el) {
    el.classList.add("hidden");
  }
}

function setText(id, text) {
  const el = $(id);
  if (el) {
    el.textContent = text;
  }
}

// ========================================
// セーブデータ
// ========================================

const defaultPlayer = {
  name: "勇者",
  level: 1,
  xp: 0,
  money: 0,

  attack: 10,

  maxHp: 30,
  hp: 30,

  weapon: "タガー",

  skills: ["斬撃"],

  area: "草原",

  monstersDefeated: 0,

  day: 1
};

let player = loadPlayer();

function loadPlayer() {
  try {
    const saved = localStorage.getItem(SAVE_KEY);

    if (!saved) {
      return structuredClone(defaultPlayer);
    }

    const data = JSON.parse(saved);

    return {
      ...structuredClone(defaultPlayer),
      ...data
    };
  } catch (e) {
    console.warn("セーブデータ読み込み失敗", e);
    return structuredClone(defaultPlayer);
  }
}

function savePlayer() {
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify(player)
    );
  } catch (e) {
    console.warn("セーブ失敗", e);
  }
}

// ========================================
// 職業
// ========================================

const JOBS = {
  勇者: {
    name: "勇者",
    maxHp: 30,
    attack: 10,
    skill: "斬撃"
  },

  ヒーラー: {
    name: "ヒーラー",
    maxHp: 35,
    attack: 7,
    skill: "ヒール"
  },

  剣士: {
    name: "剣士",
    maxHp: 30,
    attack: 14,
    skill: "強斬り"
  }
};

// ========================================
// スキル
// ========================================

const SKILLS = {
  斬撃: 35,
  ヒール: 25,
  強斬り: 50,
  高速切り: 65,
  回転斬り: 80,
  超斬撃: 120
};

// ========================================
// 武器
// ========================================

const WEAPON_BONUSES = {
  タガー: 15,
  剣: 5,
  強化剣: 25
};

// ========================================
// モンスター
// ========================================

const ENEMIES = [
  {
    name: "怪物猫",
    min: 1,
    max: 5,
    hp: 50,
    attack: 6,
    xp: 25,
    money: 20,
    area: "草原"
  },

  {
    name: "スライム",
    min: 1,
    max: 6,
    hp: 60,
    attack: 7,
    xp: 30,
    money: 25,
    area: "草原"
  },

  {
    name: "ゴブリン",
    min: 2,
    max: 8,
    hp: 80,
    attack: 10,
    xp: 45,
    money: 40,
    area: "草原"
  },

  {
    name: "オオカミ",
    min: 3,
    max: 10,
    hp: 100,
    attack: 13,
    xp: 60,
    money: 55,
    area: "草原"
  },

  {
    name: "スケルトン",
    min: 4,
    max: 12,
    hp: 120,
    attack: 15,
    xp: 75,
    money: 70,
    area: "遺跡"
  },

  {
    name: "オーク",
    min: 6,
    max: 15,
    hp: 150,
    attack: 18,
    xp: 100,
    money: 90,
    area: "山道"
  },

  {
    name: "闇の騎士",
    min: 7,
    max: 20,
    hp: 180,
    attack: 20,
    xp: 130,
    money: 120,
    area: "都市周辺"
  },

  {
    name: "吸血鬼",
    min: 10,
    max: 25,
    hp: 220,
    attack: 25,
    xp: 180,
    money: 180,
    area: "都市周辺"
  },

  {
    name: "魔法使い",
    min: 12,
    max: 30,
    hp: 250,
    attack: 30,
    xp: 220,
    money: 230,
    area: "魔境"
  },

  {
    name: "ドラゴン",
    min: 15,
    max: 35,
    hp: 300,
    attack: 35,
    xp: 350,
    money: 400,
    area: "魔境"
  },

  {
    name: "魔王",
    min: 20,
    max: 50,
    hp: 400,
    attack: 40,
    xp: 500,
    money: 600,
    area: "魔王城"
  },

  {
    name: "ゴブリンキング",
    min: 8,
    max: 20,
    hp: 230,
    attack: 24,
    xp: 200,
    money: 220,
    area: "山道"
  },

  {
    name: "ミノタウロス",
    min: 10,
    max: 25,
    hp: 280,
    attack: 30,
    xp: 260,
    money: 300,
    area: "遺跡"
  },

  {
    name: "デーモン",
    min: 15,
    max: 35,
    hp: 350,
    attack: 38,
    xp: 400,
    money: 500,
    area: "魔境"
  },

  {
    name: "古代竜",
    min: 20,
    max: 50,
    hp: 450,
    attack: 48,
    xp: 650,
    money: 800,
    area: "魔王城"
  }
];

// ========================================
// ボス
// ※HP500から変更なし
// ========================================

const BOSS = {
  name: "懸賞金王",
  hp: 500,
  attack: 45,
  xp: 1000,
  money: 1000
};

// ========================================
// 経験値
// ========================================

function xpRequired(level) {
  return level * 100;
}

function gainXP(amount) {
  amount = Number(amount) || 0;

  player.xp += amount;

  let leveledUp = false;

  while (
    player.xp >= xpRequired(player.level)
  ) {
    player.xp -= xpRequired(player.level);

    player.level++;

    player.maxHp += 5;
    player.hp = player.maxHp;

    player.attack += 2;

    leveledUp = true;
  }

  if (leveledUp) {
    logMessage(
      `レベルアップ！ Lv.${player.level}`
    );
  }
}

// ========================================
// 攻撃ダメージ計算
// ========================================

function calculateAttackDamage(skillPower = 0) {
  const weaponBonus =
    WEAPON_BONUSES[player.weapon] || 0;

  let damage =
    player.attack +
    skillPower +
    weaponBonus;

  // 15%クリティカル
  if (Math.random() < 0.15) {
    damage += 5;

    logMessage("クリティカル！");
  }

  // タガーの追加ダメージ
  if (
    player.weapon === "タガー" &&
    Math.random() < 0.25
  ) {
    damage += 5;

    logMessage("タガーの出血攻撃！");
  }

  return Math.max(
    1,
    Math.floor(damage)
  );
}

// ========================================
// ログ
// ========================================

function logMessage(message) {
  console.log(message);

  const candidates = [
    $("log"),
    $("battleLog"),
    $("message"),
    $("status")
  ];

  const target =
    candidates.find(Boolean);

  if (target) {
    target.textContent = message;
  }
}

// ========================================
// RPGステータス表示
// ========================================

function updatePlayerStatus() {
  setText(
    "playerName",
    player.name
  );

  setText(
    "playerLevel",
    `Lv.${player.level}`
  );

  setText(
    "playerHp",
    `${player.hp}/${player.maxHp}`
  );

  setText(
    "playerAttack",
    player.attack
  );

  setText(
    "playerMoney",
    `${player.money}G`
  );

  setText(
    "playerWeapon",
    player.weapon
  );

  setText(
    "playerXP",
    `${player.xp}/${xpRequired(player.level)}`
  );
}

// ========================================
// 画面切り替え
// ========================================

function showHome() {
  hide("gameScreen");
  hide("onlineScreen");
  hide("roomScreen");

  show("homeScreen");

  updatePlayerStatus();
}

function showGame() {
  hide("homeScreen");
  hide("onlineScreen");
  hide("roomScreen");

  show("gameScreen");

  updatePlayerStatus();
}

function showOnlineMenu() {
  hide("homeScreen");
  hide("gameScreen");
  hide("roomScreen");

  show("onlineScreen");

  const input = $("onlineName");

  if (input && !input.value) {
    input.value = player.name;
  }
}

function showRoomScreen() {
  hide("homeScreen");
  hide("gameScreen");
  hide("onlineScreen");

  show("roomScreen");

  renderOnlinePlayers();
  renderChatMessages();
}

// ========================================
// RPG攻撃
// ========================================

function normalAttack(enemy) {
  if (!enemy) return;

  const damage =
    calculateAttackDamage(0);

  enemy.hp -= damage;

  logMessage(
    `${enemy.name}に${damage}ダメージ！`
  );

  if (enemy.hp <= 0) {
    defeatEnemy(enemy);
  }
}

function skillAttack(enemy, skillName) {
  if (!enemy) return;

  const skillPower =
    SKILLS[skillName] || 0;

  if (skillName === "ヒール") {
    const before = player.hp;

    player.hp = Math.min(
      player.maxHp,
      player.hp + skillPower
    );

    const healed =
      player.hp - before;

    logMessage(
      `${healed}回復した！`
    );

    savePlayer();
    updatePlayerStatus();

    return;
  }

  const damage =
    calculateAttackDamage(skillPower);

  enemy.hp -= damage;

  logMessage(
    `${skillName}！ ${damage}ダメージ！`
  );

  if (enemy.hp <= 0) {
    defeatEnemy(enemy);
  }

  updatePlayerStatus();
}

// ========================================
// モンスター撃破
// ========================================

function defeatEnemy(enemy) {
  player.monstersDefeated++;

  player.money += enemy.money;

  gainXP(enemy.xp);

  logMessage(
    `${enemy.name}を倒した！ +${enemy.xp}XP +${enemy.money}G`
  );

  savePlayer();
  updatePlayerStatus();
}

// ========================================
// 回復
// ========================================

function healAtTown() {
  const cost = 30;

  if (player.hp >= player.maxHp) {
    logMessage(
      "HPは満タンです。"
    );

    return;
  }

  if (player.money < cost) {
    logMessage(
      "回復には30G必要です。"
    );

    return;
  }

  player.money -= cost;

  player.hp = player.maxHp;

  logMessage(
    "HPを全回復した！ -30G"
  );

  savePlayer();
  updatePlayerStatus();
}

// ========================================
// ランダムモンスター
// ========================================

function getRandomEnemy() {
  const available =
    ENEMIES.filter(enemy => {
      return (
        player.level >= enemy.min &&
        player.level <= enemy.max
      );
    });

  if (available.length === 0) {
    return ENEMIES[0];
  }

  return available[
    Math.floor(
      Math.random() *
      available.length
    )
  ];
}

// ========================================
// モンスター戦闘開始
// ========================================

let currentEnemy = null;

function startBattle() {
  currentEnemy =
    structuredClone(
      getRandomEnemy()
    );

  logMessage(
    `${currentEnemy.name}が現れた！`
  );

  updateEnemyStatus();
}

function updateEnemyStatus() {
  if (!currentEnemy) return;

  setText(
    "enemyName",
    currentEnemy.name
  );

  setText(
    "enemyHp",
    `${Math.max(
      0,
      currentEnemy.hp
    )}/${currentEnemy._maxHp || currentEnemy.hp}`
  );
}

// ========================================
// オンライン
// ========================================

function connectOnline() {
  if (!socket) {
    showOnlineError(
      "サーバーに接続できません。"
    );

    return;
  }

  if (online) {
    return;
  }

  socket.connect();

  socket.on(
    "connect",
    () => {
      online = true;
      currentPlayerId =
        socket.id;

      console.log(
        "オンライン接続:",
        socket.id
      );
    }
  );

  socket.on(
    "disconnect",
    () => {
      online = false;
      currentPlayerId = "";
      remotePlayers = {};

      renderOnlinePlayers();

      console.log(
        "サーバーから切断されました"
      );
    }
  );

  // ------------------------------
  // ルーム作成
  // ------------------------------

  socket.on(
    "roomCreated",
    data => {
      if (!data) return;

      currentRoomCode =
        data.roomCode ||
        data.code ||
        "";

      showRoomScreen();

      setText(
        "roomCodeDisplay",
        currentRoomCode
      );

      setText(
        "roomInfo",
        `ルーム: ${currentRoomCode}`
      );
    }
  );

  // ------------------------------
  // ルーム参加
  // ------------------------------

  socket.on(
    "roomJoined",
    data => {
      if (!data) return;

      currentRoomCode =
        data.roomCode ||
        data.code ||
        currentRoomCode;

      showRoomScreen();

      setText(
        "roomCodeDisplay",
        currentRoomCode
      );

      setText(
        "roomInfo",
        `ルーム: ${currentRoomCode}`
      );
    }
  );

  // ------------------------------
  // エラー
  // ------------------------------

  socket.on(
    "roomError",
    message => {
      showOnlineError(
        message ||
        "ルームエラー"
      );
    }
  );

  socket.on(
    "errorMessage",
    message => {
      showOnlineError(
        message ||
        "エラーが発生しました"
      );
    }
  );

  // ------------------------------
  // プレイヤー一覧
  // ------------------------------

  socket.on(
    "players",
    players => {
      remotePlayers = {};

      if (Array.isArray(players)) {
        players.forEach(p => {
          if (!p) return;

          const id =
            p.id ||
            p.socketId ||
            p.playerId;

          if (!id) return;

          remotePlayers[id] = p;
        });
      } else if (
        players &&
        typeof players === "object"
      ) {
        remotePlayers =
          players;
      }

      renderOnlinePlayers();
    }
  );

  socket.on(
    "playerList",
    players => {
      remotePlayers = {};

      if (Array.isArray(players)) {
        players.forEach(p => {
          if (!p) return;

          const id =
            p.id ||
            p.socketId ||
            p.playerId;

          if (id) {
            remotePlayers[id] = p;
          }
        });
      }

      renderOnlinePlayers();
    }
  );

  // ------------------------------
  // プレイヤー移動
  // ------------------------------

  socket.on(
    "playerMoved",
    data => {
      if (!data) return;

      const id =
        data.id ||
        data.playerId;

      if (!id) return;

      remotePlayers[id] = {
        ...(remotePlayers[id] || {}),
        ...data
      };

      renderOnlinePlayers();
    }
  );

  socket.on(
    "playerUpdated",
    data => {
      if (!data) return;

      const id =
        data.id ||
        data.playerId;

      if (!id) return;

      remotePlayers[id] = {
        ...(remotePlayers[id] || {}),
        ...data
      };

      renderOnlinePlayers();
    }
  );

  // ------------------------------
  // 攻撃
  // ------------------------------

  socket.on(
    "playerAttacked",
    data => {
      if (!data) return;

      logMessage(
        `${data.name || "プレイヤー"}から攻撃を受けた！`
      );
    }
  );

  // ------------------------------
  // 公開チャット履歴
  // ------------------------------

  socket.on(
    "chatHistory",
    messages => {
      if (Array.isArray(messages)) {
        chatHistory =
          messages.slice(-100);
      } else {
        chatHistory = [];
      }

      renderChatMessages();
    }
  );

  // ------------------------------
  // 公開チャット
  // ------------------------------

  socket.on(
    "chatMessage",
    data => {
      if (!data) return;

      chatHistory.push({
        name:
          data.name ||
          "名無し",

        text:
          data.text ||
          "",

        time:
          data.time ||
          Date.now(),

        system:
          !!data.system
      });

      if (chatHistory.length > 100) {
        chatHistory =
          chatHistory.slice(-100);
      }

      renderChatMessages();
    }
  );
}

// ========================================
// オンラインルーム作成
// ========================================

function createOnlineRoom() {
  if (!socket) {
    showOnlineError(
      "サーバーに接続できません。"
    );

    return;
  }

  const nameInput =
    $("onlineName");

  onlinePlayerName =
    (
      nameInput?.value ||
      player.name ||
      "名無し"
    ).trim();

  if (!onlinePlayerName) {
    onlinePlayerName =
      "名無し";
  }

  player.name =
    onlinePlayerName;

  savePlayer();

  if (!socket.connected) {
    socket.connect();

    setTimeout(
      createOnlineRoom,
      500
    );

    return;
  }

  socket.emit(
    "createRoom",
    {
      name: onlinePlayerName
    }
  );
}

// ========================================
// オンラインルーム参加
// ========================================

function joinOnlineRoom() {
  if (!socket) {
    showOnlineError(
      "サーバーに接続できません。"
    );

    return;
  }

  const nameInput =
    $("onlineName");

  const codeInput =
    $("roomCodeInput");

  onlinePlayerName =
    (
      nameInput?.value ||
      player.name ||
      "名無し"
    ).trim();

  const roomCode =
    (
      codeInput?.value ||
      ""
    ).trim();

  if (!onlinePlayerName) {
    showOnlineError(
      "名前を入力してください。"
    );

    return;
  }

  if (!roomCode) {
    showOnlineError(
      "ルームコードを入力してください。"
    );

    return;
  }

  player.name =
    onlinePlayerName;

  savePlayer();

  currentRoomCode =
    roomCode;

  if (!socket.connected) {
    socket.connect();

    setTimeout(
      joinOnlineRoom,
      500
    );

    return;
  }

  socket.emit(
    "joinRoom",
    {
      roomCode,
      code: roomCode,
      name: onlinePlayerName
    }
  );
}

// ========================================
// オンライン終了
// ========================================

function leaveOnlineRoom() {
  currentRoomCode = "";
  remotePlayers = {};
  chatHistory = [];

  renderOnlinePlayers();
  renderChatMessages();

  showOnlineMenu();
}

// ========================================
// プレイヤー一覧表示
// ========================================

function renderOnlinePlayers() {
  const container =
    $("onlinePlayers") ||
    $("playerList");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  const players =
    Object.values(
      remotePlayers || {}
    );

  if (
    currentPlayerId &&
    !remotePlayers[currentPlayerId]
  ) {
    players.unshift({
      id: currentPlayerId,
      name:
        onlinePlayerName ||
        player.name ||
        "自分",
      self: true
    });
  }

  if (players.length === 0) {
    const div =
      document.createElement("div");

    div.textContent =
      "プレイヤーはいません";

    container.appendChild(div);

    return;
  }

  players.forEach(p => {
    const div =
      document.createElement("div");

    const isSelf =
      p.self ||
      p.id === currentPlayerId;

    div.className =
      isSelf
        ? "online-player self"
        : "online-player";

    div.textContent =
      isSelf
        ? `🟢 ${p.name || "自分"}（自分）`
        : `👤 ${p.name || "名無し"}`;

    container.appendChild(div);
  });
}

// ========================================
// 公開チャット
// ========================================

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatChatTime(time) {
  if (!time) {
    return "";
  }

  const date =
    new Date(time);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleTimeString(
    "ja-JP",
    {
      hour: "2-digit",
      minute: "2-digit"
    }
  );
}

function renderChatMessages() {
  const container =
    $("chatMessages");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  chatHistory.forEach(message => {
    if (!message) return;

    const div =
      document.createElement("div");

    if (message.system) {
      div.className =
        "chat-message chat-system";

      div.textContent =
        message.text || "";

      container.appendChild(div);

      return;
    }

    div.className =
      "chat-message";

    const name =
      escapeHtml(
        message.name ||
        "名無し"
      );

    const text =
      escapeHtml(
        message.text ||
        ""
      );

    const time =
      escapeHtml(
        formatChatTime(
          message.time
        )
      );

    div.innerHTML =
      `<span class="chat-name">${name}</span>` +
      `<span class="chat-text">${text}</span>` +
      `<span class="chat-time">${time}</span>`;

    container.appendChild(div);
  });

  container.scrollTop =
    container.scrollHeight;
}

// ========================================
// チャット送信
// ========================================

function sendChatMessage() {
  if (!socket) {
    return;
  }

  if (!socket.connected) {
    return;
  }

  if (!currentRoomCode) {
    return;
  }

  const input =
    $("chatInput");

  if (!input) {
    return;
  }

  let text =
    input.value.trim();

  if (!text) {
    return;
  }

  // 200文字制限
  text =
    text.slice(0, 200);

  const name =
    (
      onlinePlayerName ||
      player.name ||
      "名無し"
    ).trim();

  socket.emit(
    "chatMessage",
    {
      text,
      name
    }
  );

  input.value = "";

  input.focus();
}

// ========================================
// チャットUI
// ========================================

function setupChatUI() {
  const sendButton =
    $("chatSendBtn");

  const input =
    $("chatInput");

  if (
    sendButton &&
    sendButton.dataset.ready !== "1"
  ) {
    sendButton.addEventListener(
      "click",
      sendChatMessage
    );

    sendButton.dataset.ready =
      "1";
  }

  if (
    input &&
    input.dataset.ready !== "1"
  ) {
    input.addEventListener(
      "keydown",
      event => {
        if (
          event.key === "Enter" &&
          !event.shiftKey
        ) {
          event.preventDefault();

          sendChatMessage();
        }
      }
    );

    input.dataset.ready =
      "1";
  }
}

// ========================================
// エラー表示
// ========================================

function showOnlineError(message) {
  const error =
    $("onlineError");

  if (error) {
    error.textContent =
      message || "";
    error.classList.remove(
      "hidden"
    );

    return;
  }

  alert(message);
}

// ========================================
// オンライン移動送信
// ========================================

function sendPlayerMove(x, y) {
  if (!socket) return;

  if (!socket.connected) return;

  if (!currentRoomCode) return;

  socket.emit(
    "movePlayer",
    {
      x,
      y
    }
  );
}

// ========================================
// オンラインステータス送信
// ========================================

function sendPlayerUpdate(data = {}) {
  if (!socket) return;

  if (!socket.connected) return;

  if (!currentRoomCode) return;

  socket.emit(
    "updatePlayer",
    {
      ...data,
      name:
        onlinePlayerName ||
        player.name
    }
  );
}

// ========================================
// オンライン攻撃
// ========================================

function attackOnlinePlayer(targetId) {
  if (!socket) return;

  if (!socket.connected) return;

  if (!currentRoomCode) return;

  if (!targetId) return;

  socket.emit(
    "attackPlayer",
    {
      targetId,
      damage:
        calculateAttackDamage(0),
      name:
        onlinePlayerName ||
        player.name
    }
  );
}

// ========================================
// ボタンイベント
// ========================================

function setupButtons() {
  // ------------------------------------
  // オンライン開始
  // ------------------------------------

  const onlineBtn =
    $("onlineBtn");

  if (
    onlineBtn &&
    onlineBtn.dataset.ready !== "1"
  ) {
    onlineBtn.addEventListener(
      "click",
      showOnlineMenu
    );

    onlineBtn.dataset.ready =
      "1";
  }

  // ------------------------------------
  // オンラインからホーム
  // ------------------------------------

  const onlineHomeBtn =
    $("onlineHomeBtn");

  if (
    onlineHomeBtn &&
    onlineHomeBtn.dataset.ready !== "1"
  ) {
    onlineHomeBtn.addEventListener(
      "click",
      showHome
    );

    onlineHomeBtn.dataset.ready =
      "1";
  }

  const backHomeBtn =
    $("backHomeBtn");

  if (
    backHomeBtn &&
    backHomeBtn.dataset.ready !== "1"
  ) {
    backHomeBtn.addEventListener(
      "click",
      showHome
    );

    backHomeBtn.dataset.ready =
      "1";
  }

  // ------------------------------------
  // ルーム作成
  // ------------------------------------

  const createRoomBtn =
    $("createRoomBtn");

  if (
    createRoomBtn &&
    createRoomBtn.dataset.ready !== "1"
  ) {
    createRoomBtn.addEventListener(
      "click",
      createOnlineRoom
    );

    createRoomBtn.dataset.ready =
      "1";
  }

  // ------------------------------------
  // ルーム参加
  // ------------------------------------

  const joinRoomBtn =
    $("joinRoomBtn");

  if (
    joinRoomBtn &&
    joinRoomBtn.dataset.ready !== "1"
  ) {
    joinRoomBtn.addEventListener(
      "click",
      joinOnlineRoom
    );

    joinRoomBtn.dataset.ready =
      "1";
  }

  // ------------------------------------
  // ルーム退出
  // ------------------------------------

  const leaveRoomBtn =
    $("leaveRoomBtn");

  if (
    leaveRoomBtn &&
    leaveRoomBtn.dataset.ready !== "1"
  ) {
    leaveRoomBtn.addEventListener(
      "click",
      leaveOnlineRoom
    );

    leaveRoomBtn.dataset.ready =
      "1";
  }

  // ------------------------------------
  // ゲーム開始
  // ------------------------------------

  const startGameBtn =
    $("startGameBtn");

  if (
    startGameBtn &&
    startGameBtn.dataset.ready !== "1"
  ) {
    startGameBtn.addEventListener(
      "click",
      () => {
        showGame();
        startBattle();
      }
    );

    startGameBtn.dataset.ready =
      "1";
  }

  // ------------------------------------
  // 回復
  // ------------------------------------

  const healBtn =
    $("healBtn");

  if (
    healBtn &&
    healBtn.dataset.ready !== "1"
  ) {
    healBtn.addEventListener(
      "click",
      healAtTown
    );

    healBtn.dataset.ready =
      "1";
  }

  // ------------------------------------
  // 通常攻撃
  // ------------------------------------

  const attackBtn =
    $("attackBtn");

  if (
    attackBtn &&
    attackBtn.dataset.ready !== "1"
  ) {
    attackBtn.addEventListener(
      "click",
      () => {
        if (!currentEnemy) {
          startBattle();
        }

        if (currentEnemy) {
          normalAttack(
            currentEnemy
          );

          updateEnemyStatus();
        }
      }
    );

    attackBtn.dataset.ready =
      "1";
  }

  // ------------------------------------
  // スキルボタン
  // ------------------------------------

  document
    .querySelectorAll(
      "[data-skill]"
    )
    .forEach(button => {
      if (
        button.dataset.ready === "1"
      ) {
        return;
      }

      button.addEventListener(
        "click",
        () => {
          const skill =
            button.dataset.skill;

          if (!currentEnemy) {
            startBattle();
          }

          if (currentEnemy) {
            skillAttack(
              currentEnemy,
              skill
            );

            updateEnemyStatus();
          }
        }
      );

      button.dataset.ready =
        "1";
    });
}

// ========================================
// 初期化
// ========================================

document.addEventListener(
  "DOMContentLoaded",
  () => {
    setupButtons();
    setupChatUI();

    updatePlayerStatus();

    // 最初はホーム
    showHome();

    // Socket.IO
    if (socket) {
      connectOnline();
    }

    // オンラインボタンが後から生成された場合にも対応
    setTimeout(() => {
      setupButtons();
      setupChatUI();
    }, 100);
  }
);

// ========================================
// 外部から使えるようにする
// ========================================

window.createOnlineRoom =
  createOnlineRoom;

window.joinOnlineRoom =
  joinOnlineRoom;

window.leaveOnlineRoom =
  leaveOnlineRoom;

window.showOnlineMenu =
  showOnlineMenu;

window.showHome =
  showHome;

window.showGame =
  showGame;

window.sendChatMessage =
  sendChatMessage;

window.sendPlayerMove =
  sendPlayerMove;

window.sendPlayerUpdate =
  sendPlayerUpdate;

window.attackOnlinePlayer =
  attackOnlinePlayer;

window.normalAttack =
  normalAttack;

window.skillAttack =
  skillAttack;

window.healAtTown =
  healAtTown;

window.startBattle =
  startBattle;
