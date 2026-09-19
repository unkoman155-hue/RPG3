"use strict";

// ========================================
// 勇者の懸賞金RPG
// game.js 完全版
// 既存UI維持 + オンライン + 公開チャット
// ========================================

const socket = io();

const SAVE_KEY = "yuusha_bounty_rpg_online_v5";

// ========================================
// DOM
// ========================================

const gameScreen = document.getElementById("gameScreen");
const homeScreen = document.getElementById("homeScreen");
const onlineScreen = document.getElementById("onlineScreen");
const roomScreen = document.getElementById("roomScreen");
const inventoryScreen = document.getElementById("inventoryScreen");
const jobScreen = document.getElementById("jobScreen");
const weaponScreen = document.getElementById("weaponScreen");
const rankingScreen = document.getElementById("rankingScreen");

const canvas = document.getElementById("gameCanvas");
const ctx = canvas ? canvas.getContext("2d") : null;

const playerNameEl = document.getElementById("playerName");
const hpText = document.getElementById("hpText");
const attackText = document.getElementById("attackText");
const moneyText = document.getElementById("moneyText");
const bountyText = document.getElementById("bountyText");

const onlineName = document.getElementById("onlineName");
const roomCodeInput = document.getElementById("roomCodeInput");
const onlineStatus = document.getElementById("onlineStatus");

const roomCodeText = document.getElementById("roomCodeText");
const roomPlayers = document.getElementById("roomPlayers");

const chatMessagesEl = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const chatSendBtn = document.getElementById("chatSendBtn");

const inventoryList = document.getElementById("inventoryList");
const rankingList = document.getElementById("rankingList");

const stick = document.getElementById("stick");
const stickKnob = document.getElementById("stickKnob");

// ========================================
// プレイヤーデータ
// ========================================

const DEFAULT_PLAYER = {
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

  area: "草原"
};

let player = loadPlayer();

function loadPlayer() {
  try {
    const raw =
      localStorage.getItem(SAVE_KEY);

    if (!raw) {
      return { ...DEFAULT_PLAYER };
    }

    return {
      ...DEFAULT_PLAYER,
      ...JSON.parse(raw)
    };
  } catch (e) {
    console.warn(
      "セーブデータ読み込み失敗",
      e
    );

    return { ...DEFAULT_PLAYER };
  }
}

function savePlayer() {
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify(player)
    );
  } catch (e) {
    console.warn(
      "セーブ失敗",
      e
    );
  }
}

// ========================================
// ジョブ
// ========================================

const JOBS = {
  勇者: {
    maxHp: 30,
    attack: 10,
    skill: "斬撃"
  },

  ヒーラー: {
    maxHp: 35,
    attack: 7,
    skill: "ヒール"
  },

  剣士: {
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
// HP500のまま
// ========================================

const BOSS = {
  name: "懸賞金王",
  hp: 500,
  attack: 45,
  xp: 1000,
  money: 1000
};

// ========================================
// オンライン状態
// ========================================

let onlineState = {
  connected: false,
  inRoom: false,
  roomCode: "",
  players: []
};

let currentPlayerId = null;

// ========================================
// 公開チャット
// ========================================

let chatHistory = [];

// ========================================
// 画面
// ========================================

function hideAllScreens() {
  [
    homeScreen,
    onlineScreen,
    roomScreen,
    inventoryScreen,
    jobScreen,
    weaponScreen,
    rankingScreen
  ].forEach(el => {
    if (el) {
      el.classList.remove("active");
      el.classList.add("hidden");
    }
  });
}

function showScreen(screen) {
  hideAllScreens();

  if (!screen) {
    return;
  }

  screen.classList.remove("hidden");
  screen.classList.add("active");
}

function showHome() {
  showScreen(homeScreen);

  updatePlayerUI();
}

function showOnline() {
  showScreen(onlineScreen);

  if (onlineName) {
    onlineName.value =
      player.name || "勇者";
  }

  setOnlineStatus(
    onlineState.connected
      ? "🟢 サーバー接続中"
      : "🔴 サーバー未接続"
  );
}

function showRoom() {
  showScreen(roomScreen);

  renderRoomPlayers();
  renderChatMessages();
}

function showGame() {
  hideAllScreens();

  if (gameScreen) {
    gameScreen.classList.remove("hidden");
    gameScreen.style.display = "block";
  }

  updatePlayerUI();
}

function showInventory() {
  showScreen(inventoryScreen);

  renderInventory();
}

function showJobs() {
  showScreen(jobScreen);
}

function showWeapons() {
  showScreen(weaponScreen);
}

function showRanking() {
  showScreen(rankingScreen);

  renderRanking();
}

// ========================================
// ゲーム画面表示
// ========================================

function updatePlayerUI() {
  if (playerNameEl) {
    playerNameEl.textContent =
      player.name;
  }

  if (hpText) {
    hpText.textContent =
      `${player.hp} / ${player.maxHp}`;
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

// ========================================
// レベル
// ========================================

function xpRequired() {
  return player.level * 100;
}

function gainXP(amount) {
  player.xp += amount;

  while (
    player.xp >= xpRequired()
  ) {
    player.xp -= xpRequired();

    player.level++;

    player.maxHp += 5;
    player.hp = player.maxHp;

    player.attack += 2;
  }

  savePlayer();
  updatePlayerUI();
}

// ========================================
// 攻撃力
// ========================================

function calculateAttackDamage(
  skillPower = 0
) {
  const weaponBonus =
    WEAPON_BONUSES[player.weapon] || 0;

  let damage =
    player.attack +
    skillPower +
    weaponBonus;

  // クリティカル15%
  if (Math.random() < 0.15) {
    damage += 5;
  }

  // タガー出血25%
  if (
    player.weapon === "タガー" &&
    Math.random() < 0.25
  ) {
    damage += 5;
  }

  return Math.max(
    1,
    Math.floor(damage)
  );
}

// ========================================
// ジョブ変更
// ========================================

function changeJob(job) {
  const info = JOBS[job];

  if (!info) {
    return;
  }

  player.job = job;

  player.maxHp =
    info.maxHp;

  player.hp =
    player.maxHp;

  player.attack =
    info.attack;

  if (
    !player.skills.includes(
      info.skill
    )
  ) {
    player.skills.push(
      info.skill
    );
  }

  savePlayer();
  updatePlayerUI();

  showHome();
}

// ========================================
// 武器変更
// ========================================

function changeWeapon(weapon) {
  if (
    !WEAPON_BONUSES.hasOwnProperty(
      weapon
    )
  ) {
    return;
  }

  player.weapon = weapon;

  if (
    !player.inventory.includes(
      weapon
    )
  ) {
    player.inventory.push(
      weapon
    );
  }

  savePlayer();
  updatePlayerUI();

  showHome();
}

// ========================================
// インベントリ
// ========================================

function renderInventory() {
  if (!inventoryList) {
    return;
  }

  if (
    !player.inventory ||
    player.inventory.length === 0
  ) {
    inventoryList.innerHTML =
      "<p>インベントリは空です。</p>";

    return;
  }

  inventoryList.innerHTML =
    player.inventory
      .map(item => {
        const equipped =
          item === player.weapon
            ? " ← 装備中"
            : "";

        return `
          <div class="inventory-item">
            ${escapeHTML(item)}
            ${equipped}
          </div>
        `;
      })
      .join("");
}

// ========================================
// ランキング
// ========================================

function renderRanking() {
  if (!rankingList) {
    return;
  }

  const list = [
    {
      name: player.name,
      bounty: player.bounty
    }
  ];

  list.sort(
    (a, b) =>
      b.bounty - a.bounty
  );

  rankingList.innerHTML =
    list
      .map(
        (p, index) => `
          <div class="ranking-item">
            🏆 ${index + 1}位
            ${escapeHTML(p.name)}
            ― ${p.bounty}
          </div>
        `
      )
      .join("");
}

// ========================================
// モンスター
// ========================================

let currentEnemy = null;

function getAvailableEnemies() {
  return ENEMIES.filter(enemy => {
    return (
      player.level >= enemy.min &&
      player.level <= enemy.max
    );
  });
}

function createEnemy() {
  const list =
    getAvailableEnemies();

  const source =
    list.length
      ? list[
          Math.floor(
            Math.random() *
              list.length
          )
        ]
      : ENEMIES[0];

  return {
    ...source,
    maxHp: source.hp,
    hp: source.hp
  };
}

function startBattle() {
  currentEnemy =
    createEnemy();

  showGame();

  drawGame();

  console.log(
    `${currentEnemy.name}が出現`
  );
}

// ========================================
// 通常攻撃
// ========================================

function attackEnemy() {
  if (!currentEnemy) {
    startBattle();
  }

  if (!currentEnemy) {
    return;
  }

  const damage =
    calculateAttackDamage(0);

  currentEnemy.hp =
    Math.max(
      0,
      currentEnemy.hp - damage
    );

  console.log(
    `${currentEnemy.name}に${damage}ダメージ`
  );

  if (
    currentEnemy.hp <= 0
  ) {
    defeatEnemy();
  } else {
    enemyAttack();
  }

  drawGame();
}

// ========================================
// スキル
// ========================================

function useSkill(skillName) {
  if (!currentEnemy) {
    startBattle();
  }

  if (!currentEnemy) {
    return;
  }

  const power =
    SKILLS[skillName];

  if (!power) {
    return;
  }

  // ヒール
  if (
    skillName === "ヒール"
  ) {
    player.hp =
      Math.min(
        player.maxHp,
        player.hp + power
      );

    savePlayer();
    updatePlayerUI();

    return;
  }

  const damage =
    calculateAttackDamage(power);

  currentEnemy.hp =
    Math.max(
      0,
      currentEnemy.hp - damage
    );

  if (
    currentEnemy.hp <= 0
  ) {
    defeatEnemy();
  } else {
    enemyAttack();
  }

  drawGame();
}

// ========================================
// 敵攻撃
// ========================================

function enemyAttack() {
  if (!currentEnemy) {
    return;
  }

  const damage =
    Math.max(
      1,
      currentEnemy.attack
    );

  player.hp =
    Math.max(
      0,
      player.hp - damage
    );

  updatePlayerUI();
  savePlayer();

  if (player.hp <= 0) {
    gameOver();
  }
}

// ========================================
// モンスター撃破
// ========================================

function defeatEnemy() {
  if (!currentEnemy) {
    return;
  }

  const enemy =
    currentEnemy;

  currentEnemy = null;

  player.defeats++;

  player.money +=
    enemy.money;

  player.bounty +=
    enemy.xp;

  gainXP(enemy.xp);

  savePlayer();
  updatePlayerUI();

  console.log(
    `${enemy.name}を倒した！`
  );
}

// ========================================
// 回復
// ========================================

function healAtTown() {
  const price = 30;

  if (
    player.hp >= player.maxHp
  ) {
    return;
  }

  if (
    player.money < price
  ) {
    return;
  }

  player.money -= price;

  player.hp =
    player.maxHp;

  savePlayer();
  updatePlayerUI();
}

// ========================================
// GAME OVER
// ========================================

function gameOver() {
  player.hp = 1;

  savePlayer();
  updatePlayerUI();

  alert(
    "💀 HPが0になりました！"
  );
}

// ========================================
// HTMLエスケープ
// ========================================

function escapeHTML(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll(
      "'",
      "&#039;"
    );
}

// ========================================
// オンライン接続
// ========================================

socket.on(
  "connect",
  () => {
    onlineState.connected =
      true;

    currentPlayerId =
      socket.id;

    setOnlineStatus(
      "🟢 サーバーに接続しました"
    );
  }
);

socket.on(
  "disconnect",
  () => {
    onlineState.connected =
      false;

    onlineState.inRoom =
      false;

    onlineState.roomCode =
      "";

    onlineState.players =
      [];

    currentPlayerId = null;

    setOnlineStatus(
      "🔴 サーバーから切断されました"
    );
  }
);

// ========================================
// ルーム作成
// ========================================

socket.on(
  "roomCreated",
  data => {
    const code =
      data?.roomCode ||
      data?.code ||
      "";

    if (!code) {
      return;
    }

    onlineState.inRoom =
      true;

    onlineState.roomCode =
      code;

    roomCodeText.textContent =
      code;

    showRoom();

    requestPlayers();
  }
);

// ========================================
// ルーム参加
// ========================================

socket.on(
  "roomJoined",
  data => {
    const code =
      data?.roomCode ||
      data?.code ||
      onlineState.roomCode;

    onlineState.inRoom =
      true;

    onlineState.roomCode =
      code;

    roomCodeText.textContent =
      code;

    showRoom();

    requestPlayers();
  }
);

// ========================================
// ルーム状態
// ========================================

socket.on(
  "roomState",
  data => {
    if (!data) {
      return;
    }

    onlineState.inRoom =
      true;

    onlineState.roomCode =
      data.roomCode ||
      data.code ||
      onlineState.roomCode;

    onlineState.players =
      Array.isArray(data.players)
        ? data.players
        : [];

    roomCodeText.textContent =
      onlineState.roomCode ||
      "---";

    renderRoomPlayers();
  }
);

// ========================================
// プレイヤー一覧
// ========================================

socket.on(
  "players",
  players => {
    if (
      Array.isArray(players)
    ) {
      onlineState.players =
        players;
    } else if (
      players &&
      typeof players === "object"
    ) {
      onlineState.players =
        Object.values(players);
    }

    renderRoomPlayers();
  }
);

socket.on(
  "playerList",
  players => {
    if (
      Array.isArray(players)
    ) {
      onlineState.players =
        players;
    }

    renderRoomPlayers();
  }
);

socket.on(
  "playersUpdate",
  players => {
    if (
      Array.isArray(players)
    ) {
      onlineState.players =
        players;
    }

    renderRoomPlayers();
  }
);

// ========================================
// サーバーエラー
// ========================================

socket.on(
  "roomError",
  message => {
    setOnlineStatus(
      "❌ " +
        (
          message ||
          "ルームエラー"
        )
    );
  }
);

socket.on(
  "errorMessage",
  message => {
    setOnlineStatus(
      "❌ " +
        (
          message ||
          "エラー"
        )
    );
  }
);

// ========================================
// 公開チャット履歴
// ========================================

socket.on(
  "chatHistory",
  messages => {
    if (
      Array.isArray(messages)
    ) {
      chatHistory =
        messages.slice(-100);
    } else {
      chatHistory = [];
    }

    renderChatMessages();
  }
);

// ========================================
// 公開チャット受信
// ========================================

socket.on(
  "chatMessage",
  message => {
    if (!message) {
      return;
    }

    chatHistory.push({
      name:
        message.name ||
        "名無し",

      text:
        message.text ||
        "",

      time:
        message.time ||
        Date.now(),

      system:
        !!message.system
    });

    // 最大100件
    if (
      chatHistory.length > 100
    ) {
      chatHistory =
        chatHistory.slice(-100);
    }

    renderChatMessages();
  }
);

// ========================================
// チャット表示
// ========================================

function renderChatMessages() {
  if (!chatMessagesEl) {
    return;
  }

  chatMessagesEl.innerHTML =
    "";

  for (
    const message of chatHistory
  ) {
    if (!message) {
      continue;
    }

    const div =
      document.createElement(
        "div"
      );

    if (message.system) {
      div.className =
        "chat-system";

      div.textContent =
        message.text || "";

      chatMessagesEl.appendChild(
        div
      );

      continue;
    }

    const name =
      escapeHTML(
        message.name ||
          "名無し"
      );

    const text =
      escapeHTML(
        message.text ||
          ""
      );

    const time =
      formatChatTime(
        message.time
      );

    div.className =
      "chat-message";

    div.innerHTML =
      `<span class="chat-name">${name}</span>` +
      ` <span class="chat-text">${text}</span>` +
      ` <span class="chat-time">${time}</span>`;

    chatMessagesEl.appendChild(
      div
    );
  }

  chatMessagesEl.scrollTop =
    chatMessagesEl.scrollHeight;
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

// ========================================
// チャット送信
// ========================================

function sendChatMessage() {
  if (
    !socket.connected
  ) {
    return;
  }

  if (
    !onlineState.inRoom
  ) {
    return;
  }

  if (!chatInput) {
    return;
  }

  let text =
    chatInput.value.trim();

  if (!text) {
    return;
  }

  // 200文字まで
  text =
    text.slice(0, 200);

  const name =
    (
      onlineName?.value ||
      player.name ||
      "名無し"
    ).trim() || "名無し";

  // 自分の名前も保存
  player.name =
    name;

  savePlayer();
  updatePlayerUI();

  socket.emit(
    "chatMessage",
    {
      text,
      name
    }
  );

  chatInput.value = "";

  chatInput.focus();
}

// ========================================
// プレイヤー一覧表示
// ========================================

function renderRoomPlayers() {
  if (!roomPlayers) {
    return;
  }

  roomPlayers.innerHTML =
    "";

  if (
    onlineState.players.length === 0
  ) {
    roomPlayers.innerHTML =
      "<div>👤 プレイヤーを読み込み中...</div>";

    return;
  }

  onlineState.players.forEach(
    p => {
      if (!p) {
        return;
      }

      const div =
        document.createElement(
          "div"
        );

      const id =
        p.id ||
        p.playerId ||
        p.socketId;

      const isMe =
        id === currentPlayerId;

      div.textContent =
        isMe
          ? `🟢 ${p.name || player.name}（自分）`
          : `👤 ${p.name || "名無し"}`;

      roomPlayers.appendChild(
        div
      );
    }
  );
}

// ========================================
// プレイヤー一覧要求
// ========================================

function requestPlayers() {
  if (
    !socket.connected
  ) {
    return;
  }

  socket.emit(
    "requestPlayers"
  );
}

// ========================================
// オンラインルーム作成
// ========================================

function createRoom() {
  const name =
    (
      onlineName?.value ||
      player.name ||
      "勇者"
    ).trim();

  if (!name) {
    setOnlineStatus(
      "名前を入力してください"
    );

    return;
  }

  player.name =
    name;

  savePlayer();

  if (
    !socket.connected
  ) {
    setOnlineStatus(
      "サーバーに接続中..."
    );

    socket.connect();

    setTimeout(
      createRoom,
      500
    );

    return;
  }

  socket.emit(
    "createRoom",
    {
      name
    }
  );
}

// ========================================
// オンラインルーム参加
// ========================================

function joinRoom() {
  const name =
    (
      onlineName?.value ||
      player.name ||
      "勇者"
    ).trim();

  const code =
    (
      roomCodeInput?.value ||
      ""
    ).trim();

  if (!name) {
    setOnlineStatus(
      "名前を入力してください"
    );

    return;
  }

  if (!code) {
    setOnlineStatus(
      "ルームコードを入力してください"
    );

    return;
  }

  player.name =
    name;

  savePlayer();

  onlineState.roomCode =
    code;

  if (
    !socket.connected
  ) {
    setOnlineStatus(
      "サーバーに接続中..."
    );

    socket.connect();

    setTimeout(
      joinRoom,
      500
    );

    return;
  }

  socket.emit(
    "joinRoom",
    {
      roomCode: code,
      code: code,
      name
    }
  );
}

// ========================================
// ルーム退出
// ========================================

function leaveRoom() {
  if (
    socket.connected &&
    onlineState.inRoom
  ) {
    socket.emit(
      "leaveRoom"
    );
  }

  onlineState.inRoom =
    false;

  onlineState.roomCode =
    "";

  onlineState.players =
    [];

  chatHistory = [];

  renderChatMessages();
  renderRoomPlayers();

  showOnline();
}

// ========================================
// オンラインゲームへ
// ========================================

function enterOnlineGame() {
  if (
    !onlineState.inRoom
  ) {
    return;
  }

  showGame();

  sendPlayerUpdate();
}

// ========================================
// プレイヤー移動同期
// ========================================

function sendPlayerMove(x, y) {
  if (
    !socket.connected ||
    !onlineState.inRoom
  ) {
    return;
  }

  socket.emit(
    "movePlayer",
    {
      x,
      y
    }
  );
}

function sendPlayerUpdate(data = {}) {
  if (
    !socket.connected ||
    !onlineState.inRoom
  ) {
    return;
  }

  socket.emit(
    "updatePlayer",
    {
      name:
        player.name,

      level:
        player.level,

      hp:
        player.hp,

      maxHp:
        player.maxHp,

      attack:
        player.attack,

      ...data
    }
  );
}

// ========================================
// キャンバス
// ========================================

let canvasWidth = 0;
let canvasHeight = 0;

function resizeCanvas() {
  if (!canvas || !ctx) {
    return;
  }

  const dpr =
    window.devicePixelRatio ||
    1;

  canvasWidth =
    window.innerWidth;

  canvasHeight =
    window.innerHeight;

  canvas.width =
    canvasWidth * dpr;

  canvas.height =
    canvasHeight * dpr;

  canvas.style.width =
    canvasWidth + "px";

  canvas.style.height =
    canvasHeight + "px";

  ctx.setTransform(
    dpr,
    0,
    0,
    dpr,
    0,
    0
  );

  drawGame();
}

window.addEventListener(
  "resize",
  resizeCanvas
);

// ========================================
// 簡易ゲーム描画
// ========================================

function drawGame() {
  if (!canvas || !ctx) {
    return;
  }

  ctx.clearRect(
    0,
    0,
    canvasWidth,
    canvasHeight
  );

  // 背景
  ctx.fillStyle =
    "#17251a";

  ctx.fillRect(
    0,
    0,
    canvasWidth,
    canvasHeight
  );

  // 草原
  ctx.fillStyle =
    "#2d6b32";

  ctx.fillRect(
    0,
    canvasHeight * 0.45,
    canvasWidth,
    canvasHeight * 0.55
  );

  // プレイヤー
  const px =
    canvasWidth / 2;

  const py =
    canvasHeight / 2;

  ctx.beginPath();

  ctx.arc(
    px,
    py,
    25,
    0,
    Math.PI * 2
  );

  ctx.fillStyle =
    "#4da6ff";

  ctx.fill();

  ctx.strokeStyle =
    "#ffffff";

  ctx.lineWidth = 3;

  ctx.stroke();

  ctx.fillStyle =
    "#ffffff";

  ctx.font =
    "bold 16px sans-serif";

  ctx.textAlign =
    "center";

  ctx.fillText(
    player.name,
    px,
    py - 35
  );

  // モンスター
  if (currentEnemy) {
    const ex =
      canvasWidth * 0.72;

    const ey =
      canvasHeight * 0.48;

    ctx.beginPath();

    ctx.arc(
      ex,
      ey,
      30,
      0,
      Math.PI * 2
    );

    ctx.fillStyle =
      "#d84b4b";

    ctx.fill();

    ctx.strokeStyle =
      "#ffffff";

    ctx.stroke();

    ctx.fillStyle =
      "#ffffff";

    ctx.font =
      "bold 15px sans-serif";

    ctx.fillText(
      currentEnemy.name,
      ex,
      ey - 42
    );

    ctx.fillText(
      `${currentEnemy.hp}/${currentEnemy.maxHp}`,
      ex,
      ey + 50
    );
  }

  // オンラインプレイヤー
  onlineState.players.forEach(
    p => {
      if (!p) {
        return;
      }

      if (
        p.id === currentPlayerId
      ) {
        return;
      }

      const x =
        typeof p.x === "number"
          ? p.x
          : canvasWidth * 0.3;

      const y =
        typeof p.y === "number"
          ? p.y
          : canvasHeight * 0.5;

      ctx.beginPath();

      ctx.arc(
        x,
        y,
        23,
        0,
        Math.PI * 2
      );

      ctx.fillStyle =
        "#ffcc33";

      ctx.fill();

      ctx.strokeStyle =
        "#ffffff";

      ctx.stroke();

      ctx.fillStyle =
        "#ffffff";

      ctx.font =
        "14px sans-serif";

      ctx.fillText(
        p.name || "名無し",
        x,
        y - 32
      );
    }
  );
}

// ========================================
// ジョイスティック
// ========================================

let joystickActive =
  false;

let joystickX = 0;
let joystickY = 0;

function resetJoystick() {
  joystickX = 0;
  joystickY = 0;

  if (stickKnob) {
    stickKnob.style.transform =
      "translate(0px, 0px)";
  }

  sendInput();
}

function updateJoystick(
  clientX,
  clientY
) {
  if (!stick) {
    return;
  }

  const rect =
    stick.getBoundingClientRect();

  const centerX =
    rect.left +
    rect.width / 2;

  const centerY =
    rect.top +
    rect.height / 2;

  let dx =
    clientX - centerX;

  let dy =
    clientY - centerY;

  const max =
    Math.min(
      rect.width,
      rect.height
    ) *
    0.35;

  const length =
    Math.hypot(
      dx,
      dy
    );

  if (length > max) {
    dx =
      dx / length * max;

    dy =
      dy / length * max;
  }

  joystickX =
    dx / max;

  joystickY =
    dy / max;

  if (stickKnob) {
    stickKnob.style.transform =
      `translate(${dx}px, ${dy}px)`;
  }

  sendInput();
}

if (stick) {
  stick.addEventListener(
    "pointerdown",
    event => {
      event.preventDefault();

      joystickActive =
        true;

      stick.setPointerCapture(
        event.pointerId
      );

      updateJoystick(
        event.clientX,
        event.clientY
      );
    }
  );

  stick.addEventListener(
    "pointermove",
    event => {
      if (!joystickActive) {
        return;
      }

      updateJoystick(
        event.clientX,
        event.clientY
      );
    }
  );

  stick.addEventListener(
    "pointerup",
    () => {
      joystickActive =
        false;

      resetJoystick();
    }
  );

  stick.addEventListener(
    "pointercancel",
    () => {
      joystickActive =
        false;

      resetJoystick();
    }
  );
}

// ========================================
// キーボード
// ========================================

const keys = {};

window.addEventListener(
  "keydown",
  event => {
    keys[
      event.key.toLowerCase()
    ] = true;

    if (
      event.key === " "
    ) {
      event.preventDefault();

      attackEnemy();
    }

    if (
      event.key.toLowerCase() ===
      "i"
    ) {
      showInventory();
    }

    sendInput();
  }
);

window.addEventListener(
  "keyup",
  event => {
    keys[
      event.key.toLowerCase()
    ] = false;

    sendInput();
  }
);

// ========================================
// オンライン入力
// ========================================

function sendInput() {
  if (
    !socket.connected ||
    !onlineState.inRoom
  ) {
    return;
  }

  const left =
    joystickX < -0.1 ||
    keys.a ||
    keys.arrowleft;

  const right =
    joystickX > 0.1 ||
    keys.d ||
    keys.arrowright;

  const up =
    joystickY < -0.1 ||
    keys.w ||
    keys.arrowup;

  const down =
    joystickY > 0.1 ||
    keys.s ||
    keys.arrowdown;

  socket.emit(
    "input",
    {
      x:
        right
          ? 1
          : left
          ? -1
          : 0,

      y:
        down
          ? 1
          : up
          ? -1
          : 0
    }
  );
}

setInterval(
  sendInput,
  60
);

// ========================================
// ボタン設定
// ========================================

function setupButtons() {
  // ホーム
  document
    .getElementById("homeBtn")
    ?.addEventListener(
      "click",
      showHome
    );

  // インベントリ
  document
    .getElementById("inventoryBtn")
    ?.addEventListener(
      "click",
      showInventory
    );

  // オンライン
  document
    .getElementById("onlineBtn")
    ?.addEventListener(
      "click",
      showOnline
    );

  document
    .getElementById("onlineHomeBtn")
    ?.addEventListener(
      "click",
      showOnline
    );

  // ゲーム開始
  document
    .getElementById("startGameBtn")
    ?.addEventListener(
      "click",
      startBattle
    );

  // ジョブ
  document
    .getElementById("jobBtn")
    ?.addEventListener(
      "click",
      showJobs
    );

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

  document
    .getElementById("closeJobBtn")
    ?.addEventListener(
      "click",
      showHome
    );

  // 武器
  document
    .getElementById("weaponBtn")
    ?.addEventListener(
      "click",
      showWeapons
    );

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

  document
    .getElementById("closeWeaponBtn")
    ?.addEventListener(
      "click",
      showHome
    );

  // ランキング
  document
    .getElementById("rankingBtn")
    ?.addEventListener(
      "click",
      showRanking
    );

  document
    .getElementById("closeRankingBtn")
    ?.addEventListener(
      "click",
      showHome
    );

  // インベントリ閉じる
  document
    .getElementById("closeInventoryBtn")
    ?.addEventListener(
      "click",
      showHome
    );

  // オンライン
  document
    .getElementById("createRoomBtn")
    ?.addEventListener(
      "click",
      createRoom
    );

  document
    .getElementById("joinRoomBtn")
    ?.addEventListener(
      "click",
      joinRoom
    );

  document
    .getElementById("backHomeBtn")
    ?.addEventListener(
      "click",
      showHome
    );

  document
    .getElementById("leaveRoomBtn")
    ?.addEventListener(
      "click",
      leaveRoom
    );

  document
    .getElementById("enterOnlineGameBtn")
    ?.addEventListener(
      "click",
      enterOnlineGame
    );

  // チャット
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
        if (
          event.key === "Enter"
        ) {
          event.preventDefault();

          sendChatMessage();
        }
      }
    );
  }
}

// ========================================
// オンラインステータス
// ========================================

function setOnlineStatus(text) {
  if (onlineStatus) {
    onlineStatus.textContent =
      text || "";
  }
}

// ========================================
// 初期化
// ========================================

document.addEventListener(
  "DOMContentLoaded",
  () => {
    setupButtons();

    resizeCanvas();

    // 最初はホーム
    showHome();

    updatePlayerUI();

    drawGame();
  }
);

// ========================================
// 外部からも使えるようにする
// ========================================

window.showHome =
  showHome;

window.showOnline =
  showOnline;

window.showRoom =
  showRoom;

window.showInventory =
  showInventory;

window.showJobs =
  showJobs;

window.showWeapons =
  showWeapons;

window.showRanking =
  showRanking;

window.startBattle =
  startBattle;

window.attackEnemy =
  attackEnemy;

window.useSkill =
  useSkill;

window.healAtTown =
  healAtTown;

window.createRoom =
  createRoom;

window.joinRoom =
  joinRoom;

window.leaveRoom =
  leaveRoom;

window.sendChatMessage =
  sendChatMessage;
