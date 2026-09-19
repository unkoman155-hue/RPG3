// ==========================================
// 勇者の懸賞金RPG
// 完全版 game.js
// オンライン + 公開チャット対応
// ==========================================

"use strict";

// ==========================================
// セーブ
// ==========================================

const SAVE_KEY = "yuusha_bounty_rpg_online_v5";

// ==========================================
// Socket.IO
// ==========================================

let socket = null;
let onlineMode = false;
let currentRoomCode = null;
let onlinePlayers = new Map();
let chatHistory = [];

if (typeof io === "function") {
  socket = io();
}

// ==========================================
// プレイヤー
// ==========================================

let player = {
  name: "勇者",

  job: "勇者",

  level: 1,
  xp: 0,

  attack: 10,

  maxHp: 30,
  hp: 30,

  money: 250,
  bounty: 0,

  weapon: "タガー",

  skills: ["斬撃"],

  inventory: ["タガー"],

  defeats: 0,

  day: 1,

  area: "草原",

  townEventDay: 0
};

// ==========================================
// ジョブ
// ==========================================

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

// ==========================================
// スキル
// ==========================================

const SKILLS = {
  "斬撃": 35,
  "ヒール": 25,
  "強斬り": 50,
  "高速切り": 65,
  "回転斬り": 80,
  "超斬撃": 120
};

// ==========================================
// 武器
// ==========================================

const WEAPON_BONUSES = {
  "タガー": 15,
  "剣": 5,
  "強化剣": 25
};

// ==========================================
// ボス
// ※HP500から変更しない
// ==========================================

const BOSS = {
  name: "懸賞金王",
  hp: 500,
  attack: 45,
  xp: 1000,
  money: 1000
};

// ==========================================
// 敵
// ==========================================

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
    min: 5,
    max: 20,
    hp: 230,
    attack: 24,
    xp: 200,
    money: 220,
    area: "山道"
  },

  {
    name: "ミノタウロス",
    min: 7,
    max: 25,
    hp: 280,
    attack: 30,
    xp: 260,
    money: 300,
    area: "遺跡"
  },

  {
    name: "デーモン",
    min: 10,
    max: 30,
    hp: 350,
    attack: 38,
    xp: 400,
    money: 500,
    area: "魔境"
  },

  {
    name: "古代竜",
    min: 15,
    max: 40,
    hp: 450,
    attack: 48,
    xp: 650,
    money: 800,
    area: "魔王城"
  }
];

// ==========================================
// 敵関連
// ==========================================

let currentEnemy = null;
let enemyHp = 0;
let enemyMaxHp = 0;

// ==========================================
// DOM
// ==========================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas ? canvas.getContext("2d") : null;

const gameScreen = document.getElementById("gameScreen");
const homeScreen = document.getElementById("homeScreen");
const onlineScreen = document.getElementById("onlineScreen");
const roomScreen = document.getElementById("roomScreen");
const inventoryScreen = document.getElementById("inventoryScreen");
const jobScreen = document.getElementById("jobScreen");
const weaponScreen = document.getElementById("weaponScreen");
const rankingScreen = document.getElementById("rankingScreen");

const playerName = document.getElementById("playerName");
const hpText = document.getElementById("hpText");
const attackText = document.getElementById("attackText");
const moneyText = document.getElementById("moneyText");
const bountyText = document.getElementById("bountyText");

const onlineName = document.getElementById("onlineName");
const roomCodeInput = document.getElementById("roomCodeInput");
const onlineStatus = document.getElementById("onlineStatus");

const roomCodeText = document.getElementById("roomCodeText");
const roomPlayers = document.getElementById("roomPlayers");

const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const chatSendBtn = document.getElementById("chatSendBtn");

const inventoryList = document.getElementById("inventoryList");
const rankingList = document.getElementById("rankingList");

// ==========================================
// 画面
// ==========================================

function hideAllScreens() {
  [
    homeScreen,
    onlineScreen,
    roomScreen,
    inventoryScreen,
    jobScreen,
    weaponScreen,
    rankingScreen
  ].forEach(screen => {
    if (screen) {
      screen.style.display = "none";
    }
  });
}

function showHome() {
  hideAllScreens();

  if (homeScreen) {
    homeScreen.style.display = "flex";
  }
}

function showOnline() {
  hideAllScreens();

  if (onlineScreen) {
    onlineScreen.style.display = "flex";
  }

  if (onlineName && !onlineName.value) {
    onlineName.value = player.name;
  }
}

function showRoom() {
  hideAllScreens();

  if (roomScreen) {
    roomScreen.style.display = "flex";
  }
}

function showInventory() {
  hideAllScreens();

  if (inventoryScreen) {
    inventoryScreen.style.display = "flex";
  }

  renderInventory();
}

function showJob() {
  hideAllScreens();

  if (jobScreen) {
    jobScreen.style.display = "flex";
  }
}

function showWeapon() {
  hideAllScreens();

  if (weaponScreen) {
    weaponScreen.style.display = "flex";
  }
}

function showRanking() {
  hideAllScreens();

  if (rankingScreen) {
    rankingScreen.style.display = "flex";
  }

  renderRanking();
}

// ==========================================
// セーブ
// ==========================================

function saveGame() {
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify(player)
    );
  } catch (error) {
    console.warn("セーブ失敗", error);
  }
}

function loadGame() {
  try {
    const saved = localStorage.getItem(SAVE_KEY);

    if (!saved) return;

    const data = JSON.parse(saved);

    if (!data || typeof data !== "object") {
      return;
    }

    player = {
      ...player,
      ...data
    };

    if (!Array.isArray(player.skills)) {
      player.skills = ["斬撃"];
    }

    if (!Array.isArray(player.inventory)) {
      player.inventory = ["タガー"];
    }

  } catch (error) {
    console.warn("ロード失敗", error);
  }
}

// ==========================================
// UI更新
// ==========================================

function updateUI() {
  if (playerName) {
    playerName.textContent = player.name;
  }

  if (hpText) {
    hpText.textContent =
      `${Math.max(0, player.hp)} / ${player.maxHp}`;
  }

  if (attackText) {
    attackText.textContent =
      player.attack;
  }

  if (moneyText) {
    moneyText.textContent =
      player.money;
  }

  if (bountyText) {
    bountyText.textContent =
      player.bounty;
  }
}

// ==========================================
// レベル
// ==========================================

function requiredXp() {
  return 100 + (player.level - 1) * 50;
}

function gainXp(amount) {
  player.xp += amount;

  while (player.xp >= requiredXp()) {
    player.xp -= requiredXp();

    player.level++;

    player.maxHp += 5;
    player.hp = player.maxHp;

    player.attack += 2;

    alert(`レベルアップ！\nLv.${player.level}`);
  }
}

// ==========================================
// 攻撃力
// ==========================================

function calculateAttackDamage(skillPower = 0) {
  let damage =
    player.attack +
    skillPower +
    (WEAPON_BONUSES[player.weapon] || 0);

  // クリティカル
  if (Math.random() < 0.15) {
    damage += 5;
  }

  // タガーの出血
  if (
    player.weapon === "タガー" &&
    Math.random() < 0.25
  ) {
    damage += 5;
  }

  return Math.max(1, damage);
}

// ==========================================
// 敵選択
// ==========================================

function getAvailableEnemies() {
  const list = ENEMIES.filter(enemy => {
    return (
      player.level >= enemy.min &&
      player.level <= enemy.max &&
      enemy.area === player.area
    );
  });

  if (list.length > 0) {
    return list;
  }

  return ENEMIES.filter(enemy => {
    return enemy.area === player.area;
  });
}

function spawnEnemy() {
  const available = getAvailableEnemies();

  if (available.length === 0) {
    currentEnemy = null;
    enemyHp = 0;
    enemyMaxHp = 0;
    return;
  }

  currentEnemy =
    available[
      Math.floor(Math.random() * available.length)
    ];

  enemyMaxHp = currentEnemy.hp;
  enemyHp = enemyMaxHp;
}

// ==========================================
// 戦闘
// ==========================================

function attackEnemy(skillName = "通常攻撃") {
  if (!currentEnemy) {
    spawnEnemy();
  }

  if (!currentEnemy) return;

  let skillPower = 0;

  if (skillName && SKILLS[skillName]) {
    skillPower = SKILLS[skillName];
  }

  // ヒール
  if (skillName === "ヒール") {
    player.hp = Math.min(
      player.maxHp,
      player.hp + SKILLS["ヒール"]
    );

    updateUI();
    saveGame();

    return;
  }

  const damage =
    calculateAttackDamage(skillPower);

  enemyHp -= damage;

  if (enemyHp <= 0) {
    enemyDefeated();
    return;
  }

  enemyAttack();
}

function enemyAttack() {
  if (!currentEnemy) return;

  player.hp -= currentEnemy.attack;

  if (player.hp <= 0) {
    player.hp = 0;

    player.defeats++;

    // 死亡時の処理
    player.money = 0;
    player.bounty = 0;
    player.xp = 0;
    player.level = 1;

    const job = JOBS[player.job] || JOBS["勇者"];

    player.maxHp = job.maxHp;
    player.hp = player.maxHp;
    player.attack = job.attack;

    alert("倒されてしまった……\n最初からやり直しです。");
  }

  updateUI();
  saveGame();
}

function enemyDefeated() {
  if (!currentEnemy) return;

  player.money += currentEnemy.money;
  player.bounty += Math.floor(
    currentEnemy.money / 2
  );

  gainXp(currentEnemy.xp);

  alert(
    `${currentEnemy.name}を倒した！\n` +
    `💰 ${currentEnemy.money}G\n` +
    `XP +${currentEnemy.xp}`
  );

  spawnEnemy();

  updateUI();
  saveGame();
}

// ==========================================
// ボス戦
// ==========================================

function startBossBattle() {
  currentEnemy = {
    ...BOSS
  };

  enemyMaxHp = BOSS.hp;
  enemyHp = BOSS.hp;
}

function attackBoss(skillName = "通常攻撃") {
  if (
    !currentEnemy ||
    currentEnemy.name !== BOSS.name
  ) {
    startBossBattle();
  }

  let skillPower = 0;

  if (SKILLS[skillName]) {
    skillPower = SKILLS[skillName];
  }

  if (skillName === "ヒール") {
    player.hp = Math.min(
      player.maxHp,
      player.hp + SKILLS["ヒール"]
    );

    updateUI();
    saveGame();

    return;
  }

  const damage =
    calculateAttackDamage(skillPower);

  enemyHp -= damage;

  if (enemyHp <= 0) {
    player.money += BOSS.money;
    player.bounty += BOSS.money;

    gainXp(BOSS.xp);

    alert(
      "懸賞金王を撃破！\n" +
      "🏆 大量の懸賞金を獲得！"
    );

    currentEnemy = null;
    enemyHp = 0;
    enemyMaxHp = 0;

    updateUI();
    saveGame();

    return;
  }

  player.hp -= BOSS.attack;

  if (player.hp <= 0) {
    player.hp = 0;

    player.money = 0;
    player.bounty = 0;
    player.xp = 0;
    player.level = 1;

    const job = JOBS[player.job] || JOBS["勇者"];

    player.maxHp = job.maxHp;
    player.hp = player.maxHp;
    player.attack = job.attack;

    alert("懸賞金王に敗北……");
  }

  updateUI();
  saveGame();
}

// ==========================================
// ジョブ
// ==========================================

function changeJob(jobName) {
  if (!JOBS[jobName]) return;

  player.job = jobName;

  const job = JOBS[jobName];

  player.maxHp = job.maxHp;
  player.hp = Math.min(
    player.hp,
    player.maxHp
  );

  player.attack = job.attack;

  if (!player.skills.includes(job.skill)) {
    player.skills.push(job.skill);
  }

  updateUI();
  saveGame();

  alert(`${jobName}に変更しました！`);

  showHome();
}

// ==========================================
// 武器
// ==========================================

function changeWeapon(weaponName) {
  if (!(weaponName in WEAPON_BONUSES)) {
    return;
  }

  if (!player.inventory.includes(weaponName)) {
    player.inventory.push(weaponName);
  }

  player.weapon = weaponName;

  updateUI();
  saveGame();

  alert(`${weaponName}を装備しました！`);

  showHome();
}

// ==========================================
// インベントリ
// ==========================================

function renderInventory() {
  if (!inventoryList) return;

  inventoryList.innerHTML = "";

  if (
    !player.inventory ||
    player.inventory.length === 0
  ) {
    inventoryList.textContent =
      "アイテムはありません。";

    return;
  }

  player.inventory.forEach(item => {
    const div = document.createElement("div");

    div.textContent =
      item === player.weapon
        ? `⚔️ ${item}（装備中）`
        : `📦 ${item}`;

    inventoryList.appendChild(div);
  });
}

// ==========================================
// ランキング
// ==========================================

function renderRanking() {
  if (!rankingList) return;

  rankingList.innerHTML = "";

  const players = [
    {
      name: player.name,
      bounty: player.bounty
    }
  ];

  onlinePlayers.forEach(p => {
    if (p.id === getSocketId()) return;

    players.push({
      name: p.name,
      bounty: p.bounty || 0
    });
  });

  players.sort((a, b) => {
    return b.bounty - a.bounty;
  });

  players.forEach((p, index) => {
    const div = document.createElement("div");

    div.textContent =
      `${index + 1}位　${p.name}　🏆 ${p.bounty}`;

    rankingList.appendChild(div);
  });
}

// ==========================================
// オンライン
// ==========================================

function getSocketId() {
  return socket ? socket.id : null;
}

function setOnlineStatus(text) {
  if (onlineStatus) {
    onlineStatus.textContent = text;
  }
}

function updateOnlinePlayerList() {
  if (!roomPlayers) return;

  roomPlayers.innerHTML = "";

  onlinePlayers.forEach(p => {
    const div = document.createElement("div");

    div.textContent =
      `👤 ${p.name}　❤️ ${p.hp}/${p.maxHp}`;

    roomPlayers.appendChild(div);
  });
}

// ==========================================
// チャット
// ==========================================

function renderChatMessages() {
  if (!chatMessages) return;

  chatMessages.innerHTML = "";

  chatHistory.forEach(message => {
    const div = document.createElement("div");

    if (message.type === "system") {
      div.textContent =
        `【SYSTEM】${message.text}`;
    } else {
      div.textContent =
        `${message.name}: ${message.text}`;
    }

    chatMessages.appendChild(div);
  });

  chatMessages.scrollTop =
    chatMessages.scrollHeight;
}

function sendChatMessage() {
  if (!socket) return;

  if (!currentRoomCode) return;

  if (!chatInput) return;

  const text =
    chatInput.value.trim();

  if (!text) return;

  socket.emit("chatMessage", {
    text: text.slice(0, 200)
  });

  chatInput.value = "";
}

if (chatSendBtn) {
  chatSendBtn.addEventListener(
    "click",
    sendChatMessage
  );
}

if (chatInput) {
  chatInput.addEventListener(
    "keydown",
    event => {
      if (event.key === "Enter") {
        event.preventDefault();
        sendChatMessage();
      }
    }
  );
}

// ==========================================
// Socket.IOイベント
// ==========================================

if (socket) {

  socket.on("roomCreated", data => {
    currentRoomCode = data.code;

    onlineMode = true;

    if (roomCodeText) {
      roomCodeText.textContent =
        currentRoomCode;
    }

    showRoom();

    socket.emit("requestPlayers");
  });

  socket.on("roomJoined", data => {
    currentRoomCode = data.code;

    onlineMode = true;

    if (roomCodeText) {
      roomCodeText.textContent =
        currentRoomCode;
    }

    showRoom();

    socket.emit("requestPlayers");
  });

  socket.on("onlineError", message => {
    setOnlineStatus(
      `❌ ${message}`
    );
  });

  socket.on("players", players => {
    onlinePlayers.clear();

    players.forEach(p => {
      onlinePlayers.set(p.id, p);
    });

    updateOnlinePlayerList();
    renderRanking();
  });

  socket.on("playerUpdated", p => {
    onlinePlayers.set(p.id, p);

    updateOnlinePlayerList();
  });

  socket.on("playerMoved", data => {
    const p =
      onlinePlayers.get(data.id);

    if (!p) return;

    p.x = data.x;
    p.y = data.y;

    onlinePlayers.set(
      data.id,
      p
    );
  });

  socket.on("playerAttacked", data => {
    const target =
      onlinePlayers.get(data.targetId);

    if (!target) return;

    target.hp = data.hp;

    onlinePlayers.set(
      data.targetId,
      target
    );

    updateOnlinePlayerList();
  });

  socket.on("playerRespawned", data => {
    const target =
      onlinePlayers.get(data.id);

    if (!target) return;

    target.x = data.x;
    target.y = data.y;
    target.hp = data.hp;

    onlinePlayers.set(
      data.id,
      target
    );

    updateOnlinePlayerList();
  });

  socket.on("chatHistory", messages => {
    if (!Array.isArray(messages)) {
      chatHistory = [];
      return;
    }

    chatHistory = messages.slice(-100);

    renderChatMessages();
  });

  socket.on("chatMessage", message => {
    chatHistory.push(message);

    if (chatHistory.length > 100) {
      chatHistory.shift();
    }

    renderChatMessages();
  });
}

// ==========================================
// ルーム作成
// ==========================================

function createOnlineRoom() {
  if (!socket) {
    setOnlineStatus(
      "❌ サーバーに接続できません"
    );

    return;
  }

  const name =
    onlineName?.value.trim() ||
    "勇者";

  player.name =
    name.slice(0, 20);

  saveGame();

  setOnlineStatus(
    "ルームを作成しています..."
  );

  socket.emit(
    "createRoom",
    {
      name: player.name
    }
  );
}

// ==========================================
// ルーム参加
// ==========================================

function joinOnlineRoom() {
  if (!socket) {
    setOnlineStatus(
      "❌ サーバーに接続できません"
    );

    return;
  }

  const name =
    onlineName?.value.trim() ||
    "勇者";

  const code =
    roomCodeInput?.value.trim();

  if (!code) {
    setOnlineStatus(
      "ルームコードを入力してください"
    );

    return;
  }

  player.name =
    name.slice(0, 20);

  saveGame();

  setOnlineStatus(
    "ルームに参加しています..."
  );

  socket.emit(
    "joinRoom",
    {
      name: player.name,
      code
    }
  );
}

// ==========================================
// ルーム退出
// ==========================================

function leaveOnlineRoom() {
  if (socket && currentRoomCode) {
    socket.emit("leaveRoom");
  }

  currentRoomCode = null;
  onlineMode = false;

  onlinePlayers.clear();

  chatHistory = [];

  showOnline();
}

// ==========================================
// オンラインゲームへ
// ==========================================

function enterOnlineGame() {
  if (!currentRoomCode) {
    return;
  }

  hideAllScreens();

  if (gameScreen) {
    gameScreen.style.display = "block";
  }

  updateUI();

  sendPlayerUpdate();
}

// ==========================================
// プレイヤー同期
// ==========================================

function sendPlayerUpdate() {
  if (!socket) return;

  if (!currentRoomCode) return;

  socket.emit("updatePlayer", {
    name: player.name,
    x: worldPlayer.x,
    y: worldPlayer.y,

    hp: player.hp,
    maxHp: player.maxHp,

    bounty: player.bounty,

    job: player.job,
    weapon: player.weapon
  });
}

// ==========================================
// ゲームワールド
// ==========================================

const world = {
  width: 2400,
  height: 1600
};

const worldPlayer = {
  x: 400,
  y: 300,
  speed: 4
};

let keys = {};

window.addEventListener(
  "keydown",
  event => {
    keys[event.key.toLowerCase()] = true;

    if (
      [
        "arrowup",
        "arrowdown",
        "arrowleft",
        "arrowright",
        " "
      ].includes(event.key.toLowerCase())
    ) {
      event.preventDefault();
    }
  }
);

window.addEventListener(
  "keyup",
  event => {
    keys[event.key.toLowerCase()] = false;
  }
);

// ==========================================
// タッチスティック
// ==========================================

const stick = document.getElementById("stick");
const stickKnob =
  document.getElementById("stickKnob");

let stickActive = false;
let stickX = 0;
let stickY = 0;

if (stick) {

  stick.addEventListener(
    "touchstart",
    event => {
      event.preventDefault();

      stickActive = true;

      updateStick(
        event.touches[0]
      );
    },
    {
      passive: false
    }
  );

  stick.addEventListener(
    "touchmove",
    event => {
      event.preventDefault();

      if (!stickActive) return;

      updateStick(
        event.touches[0]
      );
    },
    {
      passive: false
    }
  );

  stick.addEventListener(
    "touchend",
    event => {
      event.preventDefault();

      stickActive = false;

      stickX = 0;
      stickY = 0;

      if (stickKnob) {
        stickKnob.style.transform =
          "translate(-50%, -50%)";
      }
    },
    {
      passive: false
    }
  );
}

function updateStick(touch) {
  if (!stick) return;

  const rect =
    stick.getBoundingClientRect();

  const centerX =
    rect.left + rect.width / 2;

  const centerY =
    rect.top + rect.height / 2;

  let dx =
    touch.clientX - centerX;

  let dy =
    touch.clientY - centerY;

  const max =
    rect.width * 0.35;

  const length =
    Math.sqrt(dx * dx + dy * dy);

  if (length > max) {
    dx =
      dx / length * max;

    dy =
      dy / length * max;
  }

  stickX = dx / max;
  stickY = dy / max;

  if (stickKnob) {
    stickKnob.style.transform =
      `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  }
}

// ==========================================
// プレイヤー移動
// ==========================================

let lastMoveSend = 0;

function updatePlayerMovement() {
  let dx = 0;
  let dy = 0;

  if (
    keys["arrowleft"] ||
    keys["a"]
  ) {
    dx -= 1;
  }

  if (
    keys["arrowright"] ||
    keys["d"]
  ) {
    dx += 1;
  }

  if (
    keys["arrowup"] ||
    keys["w"]
  ) {
    dy -= 1;
  }

  if (
    keys["arrowdown"] ||
    keys["s"]
  ) {
    dy += 1;
  }

  if (stickActive) {
    dx += stickX;
    dy += stickY;
  }

  const length =
    Math.sqrt(dx * dx + dy * dy);

  if (length > 1) {
    dx /= length;
    dy /= length;
  }

  worldPlayer.x +=
    dx * worldPlayer.speed;

  worldPlayer.y +=
    dy * worldPlayer.speed;

  worldPlayer.x =
    Math.max(
      20,
      Math.min(
        world.width - 20,
        worldPlayer.x
      )
    );

  worldPlayer.y =
    Math.max(
      20,
      Math.min(
        world.height - 20,
        worldPlayer.y
      )
    );

  const now = Date.now();

  if (
    socket &&
    currentRoomCode &&
    now - lastMoveSend > 50
  ) {
    lastMoveSend = now;

    socket.emit(
      "movePlayer",
      {
        x: worldPlayer.x,
        y: worldPlayer.y
      }
    );
  }
}

// ==========================================
// キャンバスサイズ
// ==========================================

function resizeCanvas() {
  if (!canvas) return;

  canvas.width =
    window.innerWidth;

  canvas.height =
    window.innerHeight;
}

window.addEventListener(
  "resize",
  resizeCanvas
);

resizeCanvas();

// ==========================================
// 描画
// ==========================================

function drawGame() {
  if (!ctx || !canvas) return;

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  const cameraX =
    worldPlayer.x -
    canvas.width / 2;

  const cameraY =
    worldPlayer.y -
    canvas.height / 2;

  // 背景
  ctx.fillStyle = "#18251b";

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  // 地面
  ctx.fillStyle = "#315b32";

  ctx.fillRect(
    -cameraX,
    -cameraY,
    world.width,
    world.height
  );

  // オンラインプレイヤー
  onlinePlayers.forEach(p => {

    if (p.id === getSocketId()) {
      return;
    }

    const x =
      p.x - cameraX;

    const y =
      p.y - cameraY;

    ctx.beginPath();

    ctx.arc(
      x,
      y,
      18,
      0,
      Math.PI * 2
    );

    ctx.fillStyle =
      "#4da6ff";

    ctx.fill();

    ctx.fillStyle =
      "#ffffff";

    ctx.textAlign =
      "center";

    ctx.font =
      "14px sans-serif";

    ctx.fillText(
      p.name,
      x,
      y - 25
    );

    ctx.font =
      "11px sans-serif";

    ctx.fillText(
      `❤️${p.hp}`,
      x,
      y + 32
    );
  });

  // 自分
  const px =
    worldPlayer.x - cameraX;

  const py =
    worldPlayer.y - cameraY;

  ctx.beginPath();

  ctx.arc(
    px,
    py,
    20,
    0,
    Math.PI * 2
  );

  ctx.fillStyle =
    "#ffd84d";

  ctx.fill();

  ctx.fillStyle =
    "#000";

  ctx.textAlign =
    "center";

  ctx.font =
    "14px sans-serif";

  ctx.fillText(
    player.name,
    px,
    py - 28
  );
}

// ==========================================
// メインループ
// ==========================================

function gameLoop() {
  updatePlayerMovement();
  drawGame();

  requestAnimationFrame(
    gameLoop
  );
}

// ==========================================
// ボタン
// ==========================================

const startGameBtn =
  document.getElementById(
    "startGameBtn"
  );

if (startGameBtn) {
  startGameBtn.addEventListener(
    "click",
    () => {

      hideAllScreens();

      if (gameScreen) {
        gameScreen.style.display =
          "block";
      }

      updateUI();
    }
  );
}

const onlineHomeBtn =
  document.getElementById(
    "onlineHomeBtn"
  );

const onlineBtn =
  document.getElementById(
    "onlineBtn"
  );

if (onlineHomeBtn) {
  onlineHomeBtn.addEventListener(
    "click",
    showOnline
  );
}

if (onlineBtn) {
  onlineBtn.addEventListener(
    "click",
    showOnline
  );
}

const homeBtn =
  document.getElementById(
    "homeBtn"
  );

if (homeBtn) {
  homeBtn.addEventListener(
    "click",
    showHome
  );
}

const createRoomBtn =
  document.getElementById(
    "createRoomBtn"
  );

if (createRoomBtn) {
  createRoomBtn.addEventListener(
    "click",
    createOnlineRoom
  );
}

const joinRoomBtn =
  document.getElementById(
    "joinRoomBtn"
  );

if (joinRoomBtn) {
  joinRoomBtn.addEventListener(
    "click",
    joinOnlineRoom
  );
}

const backHomeBtn =
  document.getElementById(
    "backHomeBtn"
  );

if (backHomeBtn) {
  backHomeBtn.addEventListener(
    "click",
    showHome
  );
}

const leaveRoomBtn =
  document.getElementById(
    "leaveRoomBtn"
  );

if (leaveRoomBtn) {
  leaveRoomBtn.addEventListener(
    "click",
    leaveOnlineRoom
  );
}

const enterOnlineGameBtn =
  document.getElementById(
    "enterOnlineGameBtn"
  );

if (enterOnlineGameBtn) {
  enterOnlineGameBtn.addEventListener(
    "click",
    enterOnlineGame
  );
}

const inventoryBtn =
  document.getElementById(
    "inventoryBtn"
  );

if (inventoryBtn) {
  inventoryBtn.addEventListener(
    "click",
    showInventory
  );
}

const closeInventoryBtn =
  document.getElementById(
    "closeInventoryBtn"
  );

if (closeInventoryBtn) {
  closeInventoryBtn.addEventListener(
    "click",
    showHome
  );
}

const jobBtn =
  document.getElementById(
    "jobBtn"
  );

if (jobBtn) {
  jobBtn.addEventListener(
    "click",
    showJob
  );
}

const closeJobBtn =
  document.getElementById(
    "closeJobBtn"
  );

if (closeJobBtn) {
  closeJobBtn.addEventListener(
    "click",
    showHome
  );
}

const weaponBtn =
  document.getElementById(
    "weaponBtn"
  );

if (weaponBtn) {
  weaponBtn.addEventListener(
    "click",
    showWeapon
  );
}

const closeWeaponBtn =
  document.getElementById(
    "closeWeaponBtn"
  );

if (closeWeaponBtn) {
  closeWeaponBtn.addEventListener(
    "click",
    showHome
  );
}

const rankingBtn =
  document.getElementById(
    "rankingBtn"
  );

if (rankingBtn) {
  rankingBtn.addEventListener(
    "click",
    showRanking
  );
}

const closeRankingBtn =
  document.getElementById(
    "closeRankingBtn"
  );

if (closeRankingBtn) {
  closeRankingBtn.addEventListener(
    "click",
    showHome
  );
}

// ==========================================
// ジョブボタン
// ==========================================

document
  .querySelectorAll(
    "[data-job]"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {
        changeJob(
          button.dataset.job
        );
      }
    );
  });

// ==========================================
// 武器ボタン
// ==========================================

document
  .querySelectorAll(
    "[data-weapon]"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {
        changeWeapon(
          button.dataset.weapon
        );
      }
    );
  });

// ==========================================
// 初期化
// ==========================================

loadGame();

updateUI();

worldPlayer.x = 400;
worldPlayer.y = 300;

showHome();

gameLoop();

// ==========================================
// 定期同期
// ==========================================

setInterval(
  () => {
    if (
      socket &&
      currentRoomCode
    ) {
      sendPlayerUpdate();
    }
  },
  500
);
