// ============================================================
// 勇者の懸賞金RPG ONLINE
// ============================================================

const socket = io();

const SAVE_KEY = "yuusha_bounty_rpg_online_v1";

let roomCode = "";
let myPlayerId = "";
let online = false;

let enemy = null;
let defending = false;
let battleMessages = [];


// ============================================================
// プレイヤー
// ============================================================

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

  skills: [],

  inventory: {
    タガー: 1
  },

  defeats: 0,

  townUnlocked: false,
  townTrust: 0,

  cityUnlocked: false,
  cityTrust: 0,

  encyclopedia: {}
};


// ============================================================
// 職業
// ============================================================

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


// ============================================================
// スキル
// ============================================================

const SKILLS = {
  斬撃: {
    type: "attack",
    power: 35
  },

  ヒール: {
    type: "heal",
    power: 25
  },

  強斬り: {
    type: "attack",
    power: 50
  },

  高速切り: {
    type: "attack",
    power: 65
  },

  回転斬り: {
    type: "attack",
    power: 80
  },

  超斬撃: {
    type: "attack",
    power: 120
  }
};


// ============================================================
// 敵
// ============================================================

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


// ============================================================
// ボス
// ============================================================

const BOSS = {
  name: "懸賞金王",
  hp: 500,
  attack: 45,
  xp: 1000,
  money: 1000
};


// ============================================================
// DOM
// ============================================================

function $(id) {
  return document.getElementById(id);
}


function clearScreen() {
  $("screen").innerHTML = "";
}


function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


// ============================================================
// ログ
// ============================================================

function writeLog(message) {
  const log = $("log");

  if (!log) return;

  log.innerHTML += escapeHtml(message) + "<br>";

  log.scrollTop = log.scrollHeight;
}


function clearLog() {
  if ($("log")) {
    $("log").innerHTML = "";
  }
}


function addBattleMessage(message) {
  battleMessages.push(message);

  if (battleMessages.length > 30) {
    battleMessages.shift();
  }

  updateBattleLog();
}


function updateBattleLog() {
  const box = $("battleLog");

  if (!box) return;

  box.innerHTML = battleMessages
    .map(message => escapeHtml(message))
    .join("<br>");

  box.scrollTop = box.scrollHeight;
}


// ============================================================
// ステータス
// ============================================================

function updateStatus() {
  const status = $("status");

  if (!status) return;

  if (!online) {
    status.textContent = "🔴 オフライン";
    return;
  }

  status.textContent =
    `🟢 ONLINE　Lv.${player.level}　💰${player.money}G　🎯懸賞金:${player.bounty}`;
}


// ============================================================
// セーブ
// ============================================================

function saveGame() {
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify(player)
    );
  } catch (error) {
    console.error(error);
  }
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

    if (!player.encyclopedia) {
      player.encyclopedia = {};
    }

    return true;

  } catch (error) {
    console.error(error);
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

    skills: [],

    inventory: {
      タガー: 1
    },

    defeats: 0,

    townUnlocked: false,
    townTrust: 0,

    cityUnlocked: false,
    cityTrust: 0,

    encyclopedia: {}
  };
}


// ============================================================
// オンライン接続
// ============================================================

socket.on("connect", () => {
  online = true;

  myPlayerId = socket.id;

  updateStatus();

  const message = $("onlineMessage");

  if (message) {
    message.textContent =
      "🟢 サーバーに接続しました！";
  }

  writeLog("🌐 オンラインサーバーに接続しました。");
});


socket.on("disconnect", () => {
  online = false;

  updateStatus();

  const message = $("onlineMessage");

  if (message) {
    message.textContent =
      "🔴 サーバーとの接続が切れました。";
  }

  writeLog("⚠️ サーバーとの接続が切れました。");
});


// ============================================================
// ルーム作成
// ============================================================

function createOnlineRoom() {
  if (!online) {
    showOnlineError("サーバーに接続されていません。");
    return;
  }

  const nameInput = $("onlineName");

  let name = "";

  if (nameInput) {
    name = nameInput.value.trim();
  }

  if (!name) {
    name = "勇者";
  }

  player.name = name;

  socket.emit("createRoom", {
    name: player.name,
    job: player.job || "勇者",

    level: player.level,
    xp: player.xp,

    maxHp: player.maxHp,
    hp: player.hp,

    attack: player.attack,

    money: player.money,
    bounty: player.bounty,

    weapon: player.weapon,
    defeats: player.defeats
  });
}


// ============================================================
// ルーム参加
// ============================================================

function joinOnlineRoom() {
  if (!online) {
    showOnlineError("サーバーに接続されていません。");
    return;
  }

  const nameInput = $("onlineName");
  const codeInput = $("roomCodeInput");

  let name = "";
  let code = "";

  if (nameInput) {
    name = nameInput.value.trim();
  }

  if (codeInput) {
    code = codeInput.value.trim().toUpperCase();
  }

  if (!name) {
    name = "勇者";
  }

  if (!code) {
    showOnlineError("ルームコードを入力してください。");
    return;
  }

  player.name = name;

  socket.emit("joinRoom", {
    code,
    name: player.name,
    job: player.job || "勇者",

    level: player.level,
    xp: player.xp,

    maxHp: player.maxHp,
    hp: player.hp,

    attack: player.attack,

    money: player.money,
    bounty: player.bounty,

    weapon: player.weapon,
    defeats: player.defeats
  });
}


// ============================================================
// ルーム作成成功
// ============================================================

socket.on("roomCreated", data => {
  roomCode = data.code;
  myPlayerId = data.playerId;

  hideOnlineOverlay();

  updateRoomCode();

  writeLog(
    `🏠 ルームを作成しました！ コード: ${roomCode}`
  );

  showHome();
});


// ============================================================
// ルーム参加成功
// ============================================================

socket.on("roomJoined", data => {
  roomCode = data.code;
  myPlayerId = data.playerId;

  hideOnlineOverlay();

  updateRoomCode();

  writeLog(
    `🚪 ルーム ${roomCode} に参加しました！`
  );

  showHome();
});


// ============================================================
// ルームエラー
// ============================================================

socket.on("roomError", message => {
  showOnlineError(message);
  writeLog("⚠️ " + message);
});


function showOnlineError(message) {
  const error = $("onlineError");

  if (error) {
    error.textContent = message;
  }
}


function hideOnlineOverlay() {
  const overlay = $("onlineOverlay");

  if (overlay) {
    overlay.style.display = "none";
  }
}


function showOnlineOverlay() {
  const overlay = $("onlineOverlay");

  if (overlay) {
    overlay.style.display = "flex";
  }
}


// ============================================================
// ルーム表示
// ============================================================

function updateRoomCode() {
  const box = $("roomCodeDisplay");

  if (!box) return;

  box.textContent = roomCode || "---";
}


// ============================================================
// オンラインプレイヤー同期
// ============================================================

socket.on("roomState", room => {
  if (!room) return;

  if (room.code) {
    roomCode = room.code;
    updateRoomCode();
  }

  updatePlayerList(room.players);

  updateRemotePlayers(room.players);

  const me = room.players.find(
    p => p.id === myPlayerId
  );

  if (me) {
    // サーバー側の情報を反映
    player.name = me.name;
    player.level = me.level;
    player.xp = me.xp;
    player.maxHp = me.maxHp;
    player.hp = me.hp;
    player.attack = me.attack;
    player.money = me.money;
    player.bounty = me.bounty;
    player.weapon = me.weapon;
    player.defeats = me.defeats;

    saveGame();
    updateStatus();
  }
});


function updatePlayerList(players) {
  const list = $("playerList");

  if (!list) return;

  if (!players || players.length === 0) {
    list.textContent = "まだプレイヤーはいません。";
    return;
  }

  list.innerHTML = players
    .map(p => {

      const me =
        p.id === myPlayerId
          ? " ← 自分"
          : "";

      return `
        <div>
          👤 ${escapeHtml(p.name)}${me}
          <br>
          Lv.${p.level}
          🎯${p.bounty}
        </div>
      `;

    })
    .join("<hr>");
}


// ============================================================
// 他プレイヤー表示
// ============================================================

function updateRemotePlayers(players) {
  const container = $("remotePlayers");

  if (!container) return;

  container.innerHTML = "";

  for (const p of players) {

    if (p.id === myPlayerId) {
      continue;
    }

    const element = document.createElement("div");

    element.className = "remote-player";

    element.dataset.playerId = p.id;

    element.style.left =
      `${Math.max(5, Math.min(95, p.x / 20))}%`;

    element.style.top =
      `${Math.max(10, Math.min(90, p.y / 14))}%`;

    element.innerHTML = `
      <div class="remote-player-name">
        👤 ${escapeHtml(p.name)}
      </div>

      <div class="remote-player-info">
        Lv.${p.level}
      </div>
    `;

    container.appendChild(element);
  }
}


// ============================================================
// 他プレイヤー参加
// ============================================================

socket.on("playerJoined", data => {
  writeLog(
    `👋 ${data.name} が参加しました！`
  );
});


// ============================================================
// 他プレイヤー退出
// ============================================================

socket.on("playerLeft", data => {
  writeLog(
    `🚪 ${data.name} が退出しました。`
  );
});


// ============================================================
// プレイヤー移動
// ============================================================

socket.on("playerMoved", data => {
  const element = document.querySelector(
    `.remote-player[data-player-id="${data.id}"]`
  );

  if (!element) return;

  element.style.left =
    `${Math.max(5, Math.min(95, data.x / 20))}%`;

  element.style.top =
    `${Math.max(10, Math.min(90, data.y / 14))}%`;
});


function sendPlayerPosition(x, y) {
  if (!online || !roomCode) return;

  socket.emit("move", {
    x,
    y
  });
}


// ============================================================
// PvP
// ============================================================

function attackOnlinePlayer(targetId) {
  if (!online || !roomCode) {
    writeLog("オンラインルームに参加してください。");
    return;
  }

  socket.emit("attackPlayer", {
    targetId
  });
}


socket.on("battleError", message => {
  addBattleMessage("⚠️ " + message);
  writeLog("⚠️ " + message);
});


socket.on("playerAttacked", data => {

  if (data.targetId === myPlayerId) {

    addBattleMessage(
      `💥 ${data.attackerName} から ${data.damage} ダメージ！`
    );

  } else if (data.attackerId === myPlayerId) {

    addBattleMessage(
      `⚔️ ${data.targetName} に ${data.damage} ダメージ！`
    );

  } else {

    addBattleMessage(
      `⚔️ ${data.attackerName} → ${data.targetName} `
      + `${data.damage}ダメージ`
    );
  }

  if (data.critical) {
    addBattleMessage("💥 クリティカル！");
  }
});


socket.on("playerDefeated", data => {

  addBattleMessage(
    `☠️ ${data.targetName} は ${data.attackerName} に倒された！`
  );

  if (data.attackerId === myPlayerId) {
    player.defeats += 1;
    player.bounty += 50;

    writeLog(
      `🏆 ${data.targetName} を撃破！`
    );

    saveGame();
    updateStatus();
  }
});


// ============================================================
// スタート
// ============================================================

function showStart() {
  clearScreen();
  clearLog();

  $("screen").innerHTML = `
    <div class="start-screen">

      <h2>⚔️ 勇者の懸賞金RPG ONLINE</h2>

      <p>
        オンラインで冒険を始めよう！
      </p>

      <button onclick="showCreatePlayer()">
        ▶️ 新しく始める
      </button>

      <button onclick="continueGame()">
        💾 セーブから続ける
      </button>

      <button onclick="showOnlineOverlay()">
        🌐 オンラインルーム
      </button>

    </div>
  `;

  updateStatus();
}


// ============================================================
// プレイヤー作成
// ============================================================

function showCreatePlayer() {
  clearScreen();

  $("screen").innerHTML = `
    <div class="create-screen">

      <h2>🧑 プレイヤー作成</h2>

      <input
        id="playerNameInput"
        maxlength="20"
        placeholder="名前"
      >

      <button onclick="chooseJob()">
        次へ
      </button>

    </div>
  `;
}


function createPlayer() {
  const input = $("playerNameInput");

  if (!input) return;

  const name = input.value.trim();

  if (!name) {
    alert("名前を入力してください。");
    return;
  }

  player.name = name;
  player.started = true;

  chooseJob();
}


function chooseJob() {
  const nameInput = $("playerNameInput");

  if (nameInput && nameInput.value.trim()) {
    player.name = nameInput.value.trim();
  }

  if (!player.name) {
    player.name = "勇者";
  }

  clearScreen();

  $("screen").innerHTML = `
    <div class="create-screen">

      <h2>⚔️ 職業を選択</h2>

      <button onclick="selectJob('勇者')">
        ⚔️ 勇者
        <br>
        HP30 / 攻撃10
      </button>

      <button onclick="selectJob('ヒーラー')">
        💚 ヒーラー
        <br>
        HP35 / 攻撃7
      </button>

      <button onclick="selectJob('剣士')">
        🗡️ 剣士
        <br>
        HP30 / 攻撃14
      </button>

    </div>
  `;
}


function selectJob(job) {
  const data = JOBS[job];

  if (!data) return;

  player.job = job;

  player.level = 1;
  player.xp = 0;

  player.maxHp = data.maxHp;
  player.hp = data.maxHp;

  player.attack = data.attack;

  player.skills = [data.skill];

  player.started = true;
  player.gameOver = false;

  saveGame();

  updateOnlinePlayer();

  showHome();
}


// ============================================================
// オンライン側へプレイヤー情報送信
// ============================================================

function updateOnlinePlayer() {
  if (!online || !roomCode) return;

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

    defeats: player.defeats
  });
}


// ============================================================
// ホーム
// ============================================================

function showHome() {
  clearScreen();

  if (!player.started) {
    showStart();
    return;
  }

  updateStatus();

  $("screen").innerHTML = `
    <div class="home-screen">

      <h2>🏠 ホーム</h2>

      <div class="status-box">

        <div>👤 ${escapeHtml(player.name)}</div>
        <div>⚔️ 職業：${escapeHtml(player.job)}</div>
        <div>⭐ レベル：${player.level}</div>
        <div>❤️ HP：${player.hp}/${player.maxHp}</div>
        <div>⚔️ 攻撃力：${player.attack}</div>
        <div>💰 所持金：${player.money}G</div>
        <div>🎯 懸賞金：${player.bounty}</div>
        <div>🏆 撃破数：${player.defeats}</div>
        <div>🗡️ 武器：${escapeHtml(player.weapon)}</div>

      </div>

      ${
        online && roomCode
          ? `
            <button onclick="showOnlinePlayersScreen()">
              👥 プレイヤーを見る
            </button>
          `
          : `
            <button onclick="showOnlineOverlay()">
              🌐 オンラインルームに参加
            </button>
          `
      }

      <button onclick="showBattle()">
        ⚔️ 戦う
      </button>

      <button onclick="showBoss()">
        👑 懸賞金王に挑む
      </button>

    </div>
  `;
}


// ============================================================
// オンラインプレイヤー画面
// ============================================================

function showOnlinePlayersScreen() {
  clearScreen();

  const list =
    $("playerList")?.innerHTML ||
    "プレイヤーがいません。";

  $("screen").innerHTML = `
    <div class="info-screen">

      <h2>👥 オンラインプレイヤー</h2>

      <div class="status-box">
        ${list}
      </div>

      <p>
        他プレイヤーに近づいて攻撃できます。
      </p>

      <button onclick="showHome()">
        戻る
      </button>

    </div>
  `;
}


// ============================================================
// 戦闘
// ============================================================

function showBattle() {
  clearScreen();

  $("screen").innerHTML = `
    <div class="battle-screen">

      <h2>⚔️ 戦う</h2>

      <button onclick="startBattle()">
        👾 敵を探す
      </button>

      ${
        online && roomCode
          ? `
            <button onclick="showOnlineTargetSelect()">
              👥 プレイヤーと戦う
            </button>
          `
          : ""
      }

    </div>
  `;
}


function startBattle() {

  const possible = ENEMIES.filter(enemy => {

    return (
      player.level >= enemy.minLevel &&
      player.level <= enemy.maxLevel
    );

  });

  const pool =
    possible.length > 0
      ? possible
      : ENEMIES;

  const data =
    pool[Math.floor(Math.random() * pool.length)];

  enemy = {
    ...data,
    maxHp: data.hp,
    hp: data.hp
  };

  defending = false;

  battleMessages = [];

  addBattleMessage(
    `⚔️ ${enemy.name} が現れた！`
  );

  showBattleScreen();
}


function showBattleScreen() {
  clearScreen();

  if (!enemy) {
    showBattle();
    return;
  }

  const hpPercent =
    Math.max(
      0,
      Math.min(
        100,
        (enemy.hp / enemy.maxHp) * 100
      )
    );

  $("screen").innerHTML = `
    <div class="battle-screen">

      <h2>⚔️ 戦闘</h2>

      <div class="status-box player-status">

        <strong>
          👤 ${escapeHtml(player.name)}
        </strong>

        <div>
          ❤️ HP ${player.hp}/${player.maxHp}
        </div>

        <div class="hp-bar">
          <div
            class="hp-bar-inner"
            style="width:${(player.hp / player.maxHp) * 100}%"
          ></div>
        </div>

      </div>


      <div class="enemy-status">

        <h3>
          👾 ${escapeHtml(enemy.name)}
        </h3>

        <div>
          ❤️ HP ${enemy.hp}/${enemy.maxHp}
        </div>

        <div class="hp-bar">
          <div
            class="hp-bar-inner"
            style="width:${hpPercent}%"
          ></div>
        </div>

        <div>
          ⚔️ 攻撃 ${enemy.attack}
        </div>

      </div>


      <div id="battleLog">
        ${battleMessages
          .map(message => escapeHtml(message))
          .join("<br>")}
      </div>


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
        🔍 調べる
      </button>

      <button onclick="flee()">
        🏃 逃げる
      </button>

    </div>
  `;

  updateBattleLog();
}


// ============================================================
// 通常攻撃
// ============================================================

function attackEnemy() {

  if (!enemy) return;
  if (player.hp <= 0) return;
  if (enemy.hp <= 0) return;

  let damage = player.attack;

  if (player.weapon === "タガー") {
    damage += 15;
  }

  if (player.weapon === "剣") {
    damage += 5;
  }

  if (player.weapon === "強化武器") {
    damage += 25;
  }

  const critical =
    Math.random() < 0.15;

  if (critical) {
    damage += 5;
  }

  enemy.hp = Math.max(
    0,
    enemy.hp - damage
  );

  addBattleMessage(
    `⚔️ ${damage} ダメージ！`
  );

  if (critical) {
    addBattleMessage("💥 クリティカル！");
  }

  if (
    player.weapon === "タガー" &&
    Math.random() < 0.25
  ) {
    enemy.hp = Math.max(
      0,
      enemy.hp - 5
    );

    addBattleMessage(
      "🩸 出血！追加5ダメージ！"
    );
  }

  if (enemy.hp <= 0) {
    victory();
    return;
  }

  showBattleScreen();

  setTimeout(() => {
    enemyAttack();
  }, 500);
}


// ============================================================
// 防御
// ============================================================

function defend() {

  if (!enemy) return;

  defending = true;

  addBattleMessage(
    "🛡️ 防御態勢に入った！"
  );

  showBattleScreen();

  setTimeout(() => {
    enemyAttack();
  }, 500);
}


// ============================================================
// スキル選択
// ============================================================

function showSkillSelect() {

  if (!player.skills.length) {
    addBattleMessage(
      "✨ 使えるスキルがありません。"
    );

    return;
  }

  clearScreen();

  $("screen").innerHTML = `
    <div class="skill-screen">

      <h2>✨ スキル</h2>

      ${player.skills.map(skill => {

        const data = SKILLS[skill];

        if (!data) return "";

        return `
          <button onclick="useSelectedSkill('${escapeHtml(skill)}')">
            ✨ ${escapeHtml(skill)}
            <br>
            ${
              data.type === "heal"
                ? `回復 ${data.power}`
                : `攻撃力 ${data.power}`
            }
          </button>
        `;

      }).join("")}

      <button onclick="showBattleScreen()">
        戻る
      </button>

    </div>
  `;
}


function useSelectedSkill(skill) {
  useSkill(skill);
}


function useSkill(skill) {

  if (!enemy) return;

  const data = SKILLS[skill];

  if (!data) return;

  if (data.type === "heal") {

    const before = player.hp;

    player.hp = Math.min(
      player.maxHp,
      player.hp + data.power
    );

    const healed =
      player.hp - before;

    addBattleMessage(
      `💚 ${skill}！${healed}回復！`
    );

  } else {

    let damage = data.power;

    if (player.weapon === "強化武器") {
      damage += 10;
    }

    enemy.hp = Math.max(
      0,
      enemy.hp - damage
    );

    addBattleMessage(
      `✨ ${skill}！${damage}ダメージ！`
    );

    if (enemy.hp <= 0) {
      victory();
      return;
    }
  }

  saveGame();
  updateOnlinePlayer();

  showBattleScreen();

  setTimeout(() => {
    enemyAttack();
  }, 500);
}


// ============================================================
// 敵攻撃
// ============================================================

function enemyAttack() {

  if (!enemy) return;
  if (enemy.hp <= 0) return;

  let damage = enemy.attack;

  if (defending) {
    damage = Math.floor(
      damage / 2
    );

    defending = false;

    addBattleMessage(
      "🛡️ 防御でダメージ半減！"
    );
  }

  player.hp = Math.max(
    0,
    player.hp - damage
  );

  addBattleMessage(
    `👾 ${enemy.name} の攻撃！`
    + ` ${damage}ダメージ！`
  );

  if (player.hp <= 0) {
    gameOver();
    return;
  }

  saveGame();
  updateOnlinePlayer();

  showBattleScreen();
}


// ============================================================
// 敵を調べる
// ============================================================

function inspectEnemy() {

  if (!enemy) return;

  addBattleMessage(
    `🔍 ${enemy.name}`
  );

  addBattleMessage(
    `HP:${enemy.hp}/${enemy.maxHp}`
  );

  addBattleMessage(
    `攻撃:${enemy.attack}`
  );

  updateBattleLog();
}


// ============================================================
// 逃げる
// ============================================================

function flee() {

  if (!enemy) return;

  if (Math.random() < 0.7) {

    addBattleMessage(
      "🏃 逃げ切った！"
    );

    enemy = null;

    setTimeout(() => {
      showBattle();
    }, 500);

  } else {

    addBattleMessage(
      "❌ 逃げられなかった！"
    );

    setTimeout(() => {
      enemyAttack();
    }, 500);
  }
}


// ============================================================
// 勝利
// ============================================================

function victory() {

  if (!enemy) return;

  const defeatedEnemy = enemy;

  player.defeats += 1;

  player.xp += defeatedEnemy.xp;

  player.money += defeatedEnemy.money;

  player.bounty += 10;

  player.encyclopedia[defeatedEnemy.name] = true;

  if (player.defeats >= 3) {
    player.townUnlocked = true;
  }

  if (player.defeats >= 8) {
    player.cityUnlocked = true;
  }

  saveGame();
  updateOnlinePlayer();

  showVictoryScreen(
    defeatedEnemy.xp,
    defeatedEnemy.money
  );

  enemy = null;
}


// ============================================================
// 勝利画面
// ============================================================

function showVictoryScreen(xp, money) {

  clearScreen();

  $("screen").innerHTML = `
    <div class="victory-screen">

      <h2>🎉 勝利！</h2>

      <div class="status-box">

        <p>⭐ 経験値 +${xp}</p>

        <p>💰 ${money}G 獲得</p>

        <p>🎯 懸賞金 +10</p>

        <p>🏆 撃破数 ${player.defeats}</p>

      </div>

      <button onclick="showHome()">
        🏠 ホームへ
      </button>

    </div>
  `;

  setTimeout(() => {
    checkLevelUp();
  }, 1500);
}


// ============================================================
// レベルアップ
// ============================================================

function checkLevelUp() {

  const required =
    50 + player.level * 50;

  if (player.xp < required) {
    return;
  }

  player.xp -= required;
  player.level += 1;

  saveGame();
  updateOnlinePlayer();

  showLevelUpChoice();
}


function showLevelUpChoice() {

  clearScreen();

  $("screen").innerHTML = `
    <div class="levelup-screen">

      <h2>⭐ レベルアップ！</h2>

      <p>
        Lv.${player.level}
      </p>

      <button onclick="levelUpHp()">
        ❤️ 最大HP +5
      </button>

      <button onclick="levelUpAttack()">
        ⚔️ 攻撃力 +20
      </button>

      <button onclick="unlockSkill()">
        ✨ 新スキル
      </button>

    </div>
  `;
}


function levelUpHp() {

  player.maxHp += 5;
  player.hp = player.maxHp;

  saveGame();
  updateOnlinePlayer();

  showHome();
}


function levelUpAttack() {

  player.attack += 20;

  saveGame();
  updateOnlinePlayer();

  showHome();
}


function unlockSkill() {

  const possible =
    Object.keys(SKILLS)
      .filter(skill =>
        !player.skills.includes(skill)
      );

  if (possible.length === 0) {

    player.attack += 10;

    saveGame();
    updateOnlinePlayer();

    showHome();

    return;
  }

  const skill =
    possible[
      Math.floor(
        Math.random() * possible.length
      )
    ];

  player.skills.push(skill);

  saveGame();
  updateOnlinePlayer();

  alert(
    `✨ ${skill} を覚えた！`
  );

  showHome();
}


// ============================================================
// ゲームオーバー
// ============================================================

function gameOver() {

  player.hp = 0;
  player.gameOver = true;

  saveGame();
  updateOnlinePlayer();

  clearScreen();

  $("screen").innerHTML = `
    <div class="gameover-screen">

      <h2>☠️ ゲームオーバー</h2>

      <p>
        勇者は力尽きた……
      </p>

      <button onclick="restartAfterDeath()">
        🔄 最初からやり直す
      </button>

    </div>
  `;
}


function restartAfterDeath() {

  resetPlayer();

  saveGame();

  showStart();
}


// ============================================================
// 町
// ============================================================

function showTown() {

  if (!player.townUnlocked) {

    clearScreen();

    $("screen").innerHTML = `
      <div class="locked-screen">

        <h2>🏘️ 町</h2>

        <p>
          まだ町は解放されていません。
        </p>

        <p>
          敵を3体倒すと解放されます。
        </p>

      </div>
    `;

    return;
  }

  clearScreen();

  $("screen").innerHTML = `
    <div class="town-screen">

      <h2>🏘️ 町</h2>

      <p>
        町の信頼度：${player.townTrust}
      </p>

      <button onclick="townHeal()">
        💚 回復 30G
      </button>

      <button onclick="townShop()">
        🛒 武器屋
      </button>

      <button onclick="townEvent()">
        🎁 町イベント
      </button>

    </div>
  `;
}


function townHeal() {

  if (player.money < 30) {
    alert("お金が足りません。");
    return;
  }

  player.money -= 30;
  player.hp = player.maxHp;

  player.townTrust += 1;

  saveGame();
  updateOnlinePlayer();

  showTown();
}


function townShop() {

  clearScreen();

  $("screen").innerHTML = `
    <div class="shop-screen">

      <h2>🛒 町の武器屋</h2>

      <button onclick="buySword()">
        🗡️ 剣 100G
      </button>

      <button onclick="buyDagger()">
        🗡️ タガー 50G
      </button>

      <button onclick="showTown()">
        戻る
      </button>

    </div>
  `;
}


function buySword() {

  if (player.money < 100) {
    alert("お金が足りません。");
    return;
  }

  player.money -= 100;
  player.inventory["剣"] =
    (player.inventory["剣"] || 0) + 1;

  player.weapon = "剣";

  saveGame();
  updateOnlinePlayer();

  alert("🗡️ 剣を購入しました！");
}


function buyDagger() {

  if (player.money < 50) {
    alert("お金が足りません。");
    return;
  }

  player.money -= 50;

  player.inventory["タガー"] =
    (player.inventory["タガー"] || 0) + 1;

  player.weapon = "タガー";

  saveGame();
  updateOnlinePlayer();

  alert("🗡️ タガーを購入しました！");
}


function townEvent() {

  const result =
    Math.floor(Math.random() * 3);

  if (result === 0) {

    player.inventory["薬草"] =
      (player.inventory["薬草"] || 0) + 1;

    alert("🌿 薬草をもらった！");

  } else if (result === 1) {

    player.inventory["タガー"] =
      (player.inventory["タガー"] || 0) + 1;

    alert("🗡️ タガーをもらった！");

  } else {

    player.money += 100;

    alert("💰 100Gもらった！");
  }

  player.townTrust += 1;

  saveGame();
  updateOnlinePlayer();

  showTown();
}


// ============================================================
// 都市
// ============================================================

function showCity() {

  if (!player.cityUnlocked) {

    clearScreen();

    $("screen").innerHTML = `
      <div class="locked-screen">

        <h2>🏙️ 都市</h2>

        <p>
          まだ都市は解放されていません。
        </p>

        <p>
          敵を8体倒すと解放されます。
        </p>

      </div>
    `;

    return;
  }

  clearScreen();

  $("screen").innerHTML = `
    <div class="city-screen">

      <h2>🏙️ 都市</h2>

      <p>
        都市の信頼度：${player.cityTrust}
      </p>

      <button onclick="cityHeal()">
        💚 回復 80G
      </button>

      <button onclick="cityShop()">
        🏪 都市の店
      </button>

      <button onclick="cityEvent()">
        🎉 都市イベント
      </button>

    </div>
  `;
}


function cityHeal() {

  if (player.money < 80) {
    alert("お金が足りません。");
    return;
  }

  player.money -= 80;
  player.hp = player.maxHp;

  player.cityTrust += 1;

  saveGame();
  updateOnlinePlayer();

  showCity();
}


function cityShop() {

  clearScreen();

  $("screen").innerHTML = `
    <div class="shop-screen">

      <h2>🏪 都市の店</h2>

      <button onclick="buyCityWeapon()">
        ⚔️ 強化武器 300G
      </button>

      <button onclick="buyPotion()">
        🧪 ポーション 50G
      </button>

      <button onclick="showCity()">
        戻る
      </button>

    </div>
  `;
}


function buyCityWeapon() {

  if (player.money < 300) {
    alert("お金が足りません。");
    return;
  }

  player.money -= 300;

  player.inventory["強化武器"] =
    (player.inventory["強化武器"] || 0) + 1;

  player.weapon = "強化武器";

  saveGame();
  updateOnlinePlayer();

  alert("⚔️ 強化武器を購入しました！");
}


function buyPotion() {

  if (player.money < 50) {
    alert("お金が足りません。");
    return;
  }

  player.money -= 50;

  player.inventory["ポーション"] =
    (player.inventory["ポーション"] || 0) + 1;

  saveGame();
  updateOnlinePlayer();

  alert("🧪 ポーションを購入しました！");
}


function cityEvent() {

  player.money += 150;
  player.cityTrust += 2;

  saveGame();
  updateOnlinePlayer();

  alert(
    "🎉 都市イベント成功！\n150Gを獲得しました！"
  );

  showCity();
}


// ============================================================
// ガチャ
// ============================================================

function showGacha() {

  clearScreen();

  $("screen").innerHTML = `
    <div class="gacha-screen">

      <h2>🎰 ガチャ</h2>

      <p>
        1回 50G
      </p>

      <button onclick="gacha()">
        🎰 ガチャを回す
      </button>

    </div>
  `;
}


function gacha() {

  if (player.money < 50) {
    alert("お金が足りません。");
    return;
  }

  player.money -= 50;

  const result =
    Math.random() < 0.5
      ? "タガー"
      : "剣";

  player.inventory[result] =
    (player.inventory[result] || 0) + 1;

  saveGame();
  updateOnlinePlayer();

  showGachaResult(result);
}


function showGachaResult(result) {

  clearScreen();

  $("screen").innerHTML = `
    <div class="gacha-result">

      <h2>🎉 ガチャ結果</h2>

      <div class="result-item">
        ${result}
      </div>

      <button onclick="equipWeapon('${escapeHtml(result)}')">
        ⚔️ 装備する
      </button>

      <button onclick="showGacha()">
        🎰 もう一度
      </button>

      <button onclick="showHome()">
        🏠 ホーム
      </button>

    </div>
  `;
}


// ============================================================
// バッグ
// ============================================================

function showBag() {

  clearScreen();

  const items =
    Object.entries(player.inventory)
      .map(([item, count]) => {

        return `
          <div class="status-box">

            <strong>
              ${escapeHtml(item)}
            </strong>

            ×${count}

            ${
              item === "タガー" ||
              item === "剣" ||
              item === "強化武器"

                ? `
                  <button
                    onclick="equipWeapon('${escapeHtml(item)}')"
                  >
                    装備
                  </button>
                `

                : ""
            }

            ${
              item === "ポーション"
                ? `
                  <button
                    onclick="usePotion()"
                  >
                    使用
                  </button>
                `
                : ""
            }

          </div>
        `;

      })
      .join("");

  $("screen").innerHTML = `
    <div class="bag-screen">

      <h2>🎒 バック</h2>

      ${items || "<p>アイテムがありません。</p>"}

    </div>
  `;
}


function equipWeapon(weapon) {

  if (!player.inventory[weapon]) {
    return;
  }

  player.weapon = weapon;

  saveGame();
  updateOnlinePlayer();

  alert(
    `⚔️ ${weapon}を装備しました！`
  );

  showBag();
}


function usePotion() {

  if (!player.inventory["ポーション"]) {
    return;
  }

  if (player.hp >= player.maxHp) {
    alert("HPは満タンです。");
    return;
  }

  player.inventory["ポーション"]--;

  player.hp = Math.min(
    player.maxHp,
    player.hp + 30
  );

  if (
    player.inventory["ポーション"] <= 0
  ) {
    delete player.inventory["ポーション"];
  }

  saveGame();
  updateOnlinePlayer();

  alert("🧪 HPを30回復しました！");
  showBag();
}


// ============================================================
// ボス
// ============================================================

function showBoss() {

  clearScreen();

  $("screen").innerHTML = `
    <div class="boss-screen">

      <h2>👑 懸賞金王</h2>

      <div class="enemy-status">

        <p>❤️ HP ${BOSS.hp}</p>
        <p>⚔️ 攻撃 ${BOSS.attack}</p>

      </div>

      <button onclick="startBossBattle()">
        ⚔️ 挑戦する
      </button>

      <button onclick="showHome()">
        戻る
      </button>

    </div>
  `;
}


function startBossBattle() {

  enemy = {
    ...BOSS,
    maxHp: BOSS.hp
  };

  defending = false;

  battleMessages = [];

  addBattleMessage(
    "👑 懸賞金王が現れた！"
  );

  showBattleScreen();
}


// ============================================================
// オンラインPvP対象選択
// ============================================================

function showOnlineTargetSelect() {

  clearScreen();

  $("screen").innerHTML = `
    <div class="battle-screen">

      <h2>👥 プレイヤー対戦</h2>

      <div id="onlineTargetList">
        読み込み中……
      </div>

      <button onclick="showBattle()">
        戻る
      </button>

    </div>
  `;

  requestOnlinePlayers();
}


function requestOnlinePlayers() {

  if (!online || !roomCode) {
    return;
  }

  socket.emit("requestPlayers");

  setTimeout(() => {

    const targetBox =
      $("onlineTargetList");

    if (!targetBox) return;

    const elements =
      document.querySelectorAll(
        ".remote-player"
      );

    if (!elements.length) {

      targetBox.innerHTML =
        "<p>他のプレイヤーはいません。</p>";

      return;
    }

    let html = "";

    for (const element of elements) {

      const id =
        element.dataset.playerId;

      const name =
        element.querySelector(
          ".remote-player-name"
        )?.textContent || "プレイヤー";

      html += `
        <button
          onclick="attackOnlinePlayer('${escapeHtml(id)}')"
        >
          ⚔️ ${escapeHtml(name)}
        </button>
      `;
    }

    targetBox.innerHTML = html;

  }, 300);
}


// ============================================================
// 設定
// ============================================================

function showSettings() {

  clearScreen();

  $("screen").innerHTML = `
    <div class="settings-screen">

      <h2>⚙️ 設定</h2>

      <button onclick="showSkillInfo()">
        ✨ スキル一覧
      </button>

      <button onclick="showLevelInfo()">
        ⭐ レベル情報
      </button>

      <button onclick="showEncyclopedia()">
        📖 モンスター図鑑
      </button>

      <button onclick="deleteSaveConfirm()">
        🗑️ セーブ削除
      </button>

      <button onclick="showOnlineOverlay()">
        🌐 オンラインルーム
      </button>

    </div>
  `;
}


function deleteSaveConfirm() {

  const ok =
    confirm(
      "本当にセーブを削除しますか？"
    );

  if (!ok) return;

  deleteSave();
}


function showSkillInfo() {

  clearScreen();

  const list =
    Object.entries(SKILLS)
      .map(([name, data]) => {

        return `
          <div class="status-box">
            ✨ ${name}
            <br>
            ${
              data.type === "heal"
                ? `回復力：${data.power}`
                : `攻撃力：${data.power}`
            }
          </div>
        `;

      })
      .join("");

  $("screen").innerHTML = `
    <div class="info-screen">

      <h2>✨ スキル一覧</h2>

      ${list}

      <button onclick="showSettings()">
        戻る
      </button>

    </div>
  `;
}


function showLevelInfo() {

  const required =
    50 + player.level * 50;

  clearScreen();

  $("screen").innerHTML = `
    <div class="info-screen">

      <h2>⭐ レベル情報</h2>

      <div class="status-box">

        <p>現在Lv：${player.level}</p>

        <p>
          経験値：
          ${player.xp}/${required}
        </p>

        <p>
          次のレベルまで：
          ${Math.max(0, required - player.xp)}
        </p>

      </div>

      <button onclick="showSettings()">
        戻る
      </button>

    </div>
  `;
}


function showEncyclopedia() {

  clearScreen();

  const list =
    ENEMIES
      .map(enemy => {

        const found =
          player.encyclopedia[enemy.name];

        return `
          <div class="status-box">

            ${
              found
                ? `
                  👾 ${enemy.name}
                  <br>
                  HP ${enemy.hp}
                  / 攻撃 ${enemy.attack}
                `
                : `
                  ❓ 未発見
                `
            }

          </div>
        `;

      })
      .join("");

  $("screen").innerHTML = `
    <div class="encyclopedia-screen">

      <h2>📖 モンスター図鑑</h2>

      ${list}

      <button onclick="showSettings()">
        戻る
      </button>

    </div>
  `;
}


// ============================================================
// 続きから
// ============================================================

function continueGame() {

  if (!loadGame()) {

    alert(
      "セーブデータがありません。"
    );

    showStart();
    return;
  }

  if (!player.started) {
    showStart();
    return;
  }

  showHome();
}


// ============================================================
// 初期化
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    updateStatus();
    updateRoomCode();

    // オンライン画面を最初に表示
    showOnlineOverlay();

    const nameInput =
      $("onlineName");

    if (nameInput && player.name) {
      nameInput.value = player.name;
    }

    // 既存セーブがあれば読み込む
    loadGame();

    if (nameInput && player.name) {
      nameInput.value = player.name;
    }
  }
);
