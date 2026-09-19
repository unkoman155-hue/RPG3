"use strict";

/* =========================================================
   勇者の懸賞金RPG
   完成版 game.js
   ========================================================= */

const SAVE_KEY = "yuusha_bounty_rpg_v5";

/* =========================================================
   プレイヤーデータ
========================================================= */

const player = {
  started: false,
  gameOver: false,

  name: "",
  job: "",

  level: 0,
  xp: 0,

  maxHp: 30,
  hp: 30,
  attack: 10,

  money: 250,
  bounty: 0,

  weapon: "タガー",

  skills: [],

  inventory: {
    "タガー": 1
  },

  defeats: 0,

  townUnlocked: false,
  townTrust: 0,

  cityUnlocked: false,
  cityTrust: 0,

  encyclopedia: {}
};

/* =========================================================
   職業
========================================================= */

const jobData = {
  "勇者": {
    maxHp: 30,
    attack: 10,
    skills: ["斬撃"]
  },

  "ヒーラー": {
    maxHp: 35,
    attack: 7,
    skills: ["ヒール"]
  },

  "剣士": {
    maxHp: 30,
    attack: 14,
    skills: ["強斬り"]
  }
};

/* =========================================================
   スキル
========================================================= */

const skillData = {
  "斬撃": {
    power: 35,
    type: "attack",
    description: "敵に35ダメージ。"
  },

  "ヒール": {
    power: 25,
    type: "heal",
    description: "自分のHPを25回復。"
  },

  "強斬り": {
    power: 50,
    type: "attack",
    description: "敵に50ダメージ。"
  },

  "高速切り": {
    power: 65,
    type: "attack",
    description: "敵に65ダメージ。"
  },

  "回転斬り": {
    power: 80,
    type: "attack",
    description: "敵に80ダメージ。"
  },

  "超斬撃": {
    power: 120,
    type: "attack",
    description: "敵に120ダメージ。"
  }
};

/* =========================================================
   敵
========================================================= */

const enemies = [
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

/* =========================================================
   ボス
========================================================= */

const bossEnemy = {
  name: "懸賞金王",
  maxHp: 500,
  hp: 500,
  attack: 45,
  xp: 1000,
  money: 1000
};

let currentEnemy = null;
let defending = false;
let battleMessages = [];

/* =========================================================
   共通
========================================================= */

function $(id) {
  return document.getElementById(id);
}

function clearScreen() {
  const screen = $("screen");

  if (screen) {
    screen.innerHTML = "";
  }
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =========================================================
   ログ
========================================================= */

function addBattleMessage(message) {
  battleMessages.push(message);

  if (battleMessages.length > 30) {
    battleMessages.shift();
  }

  updateBattleLog();
}

function writeLog(message) {
  const log = $("log");

  if (log) {
    log.innerHTML += `<div>${message}</div>`;
    log.scrollTop = log.scrollHeight;
  }

  addBattleMessage(message);
}

function clearLog() {
  const log = $("log");

  if (log) {
    log.innerHTML = "";
  }

  battleMessages = [];
  updateBattleLog();
}

function updateBattleLog() {
  const battleLog = $("battleLog");

  if (!battleLog) {
    return;
  }

  battleLog.innerHTML = battleMessages
    .map(message => `<div>${message}</div>`)
    .join("");

  battleLog.scrollTop = battleLog.scrollHeight;
}

/* =========================================================
   ステータス
========================================================= */

function updateStatus() {
  const status = $("status");

  if (!status) {
    return;
  }

  if (!player.started) {
    status.innerHTML = "";
    return;
  }

  status.innerHTML = `
    <div class="status-row">
      <span>👤 ${escapeHtml(player.name)}</span>
      <span>⚔️ ${escapeHtml(player.job)}</span>
      <span>Lv.${player.level}</span>
      <span>❤️ ${player.hp}/${player.maxHp}</span>
      <span>⚔️ 攻撃 ${player.attack}</span>
      <span>💰 ${player.money}円</span>
      <span>🏆 懸賞金 ${player.bounty}円</span>
    </div>
  `;
}

/* =========================================================
   セーブ
========================================================= */

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

    if (!data) {
      return false;
    }

    const saved = JSON.parse(data);

    Object.assign(player, saved);

    if (!player.inventory) {
      player.inventory = {
        "タガー": 1
      };
    }

    if (!player.skills) {
      player.skills = [];
    }

    if (!player.encyclopedia) {
      player.encyclopedia = {};
    }

    updateStatus();

    return true;

  } catch (error) {
    console.error(error);
    return false;
  }
}

function continueGame() {
  if (loadGame()) {
    writeLog("📂 セーブデータを読み込みました。");
    showHome();
  } else {
    alert("セーブデータがありません。");
  }
}

function deleteSave() {
  localStorage.removeItem(SAVE_KEY);
  location.reload();
}

function resetPlayer() {
  player.started = false;
  player.gameOver = false;

  player.name = "";
  player.job = "";

  player.level = 0;
  player.xp = 0;

  player.maxHp = 30;
  player.hp = 30;
  player.attack = 10;

  player.money = 250;
  player.bounty = 0;

  player.weapon = "タガー";

  player.skills = [];

  player.inventory = {
    "タガー": 1
  };

  player.defeats = 0;

  player.townUnlocked = false;
  player.townTrust = 0;

  player.cityUnlocked = false;
  player.cityTrust = 0;

  player.encyclopedia = {};

  currentEnemy = null;
  defending = false;

  saveGame();
}

/* =========================================================
   スタート
========================================================= */

function showStart() {
  clearScreen();
  clearLog();
  updateStatus();

  $("screen").innerHTML = `
    <div class="start-screen">

      <h2>⚔️ 勇者の懸賞金RPG</h2>

      <p>ゲームを開始してください。</p>

      <button onclick="createPlayer()">
        🎮 ゲーム開始
      </button>

      <button onclick="continueGame()">
        📂 セーブから再開
      </button>

    </div>
  `;
}

function createPlayer() {
  clearScreen();

  $("screen").innerHTML = `
    <h2>🧑 キャラクター作成</h2>

    <label>
      名前
      <input
        id="playerName"
        maxlength="12"
        placeholder="名前を入力"
      >
    </label>

    <h3>職業を選択</h3>

    <div class="choice-grid">

      <button onclick="chooseJob('勇者')">
        ⚔️ 勇者
      </button>

      <button onclick="chooseJob('ヒーラー')">
        ❤️ ヒーラー
      </button>

      <button onclick="chooseJob('剣士')">
        🗡️ 剣士
      </button>

    </div>

    <p id="jobInfo">
      職業を選択してください。
    </p>

    <button onclick="showStart()">
      戻る
    </button>
  `;
}

function chooseJob(job) {
  const nameInput = $("playerName");

  const name = nameInput
    ? nameInput.value.trim()
    : "";

  if (!name) {
    alert("名前を入力してください。");
    return;
  }

  if (!jobData[job]) {
    return;
  }

  player.started = true;
  player.gameOver = false;

  player.name = name;
  player.job = job;

  player.level = 0;
  player.xp = 0;

  player.maxHp = jobData[job].maxHp;
  player.hp = player.maxHp;

  player.attack = jobData[job].attack;

  player.money = 250;
  player.bounty = 0;

  player.weapon = "タガー";

  player.skills = [...jobData[job].skills];

  player.inventory = {
    "タガー": 1
  };

  player.defeats = 0;

  player.townUnlocked = false;
  player.townTrust = 0;

  player.cityUnlocked = false;
  player.cityTrust = 0;

  player.encyclopedia = {};

  saveGame();

  clearLog();

  writeLog(
    `${escapeHtml(player.name)}は${escapeHtml(player.job)}として冒険を始めた！`
  );

  showHome();
}

/* =========================================================
   ホーム
========================================================= */

function showHome() {
  if (!player.started) {
    showStart();
    return;
  }

  clearScreen();
  updateStatus();

  $("screen").innerHTML = `
    <h2>🏠 ホーム</h2>

    <div class="home-card">

      <h3>${escapeHtml(player.name)}</h3>

      <p>職業：${escapeHtml(player.job)}</p>
      <p>レベル：${player.level}</p>
      <p>HP：${player.hp}/${player.maxHp}</p>
      <p>攻撃力：${player.attack}</p>
      <p>経験値：${player.xp}</p>
      <p>お金：${player.money}円</p>
      <p>懸賞金：${player.bounty}円</p>
      <p>討伐数：${player.defeats}</p>
      <p>武器：${escapeHtml(player.weapon)}</p>

    </div>

    <h3>📜 冒険</h3>

    <button onclick="showBattle()">
      ⚔️ モンスターと戦う
    </button>

    <button onclick="showBoss()">
      👑 ボスに挑む
    </button>
  `;
}

/* =========================================================
   戦闘
========================================================= */

function showBattle() {
  if (!player.started) {
    showStart();
    return;
  }

  if (player.gameOver) {
    return;
  }

  clearScreen();

  $("screen").innerHTML = `
    <h2>🌿 草原</h2>

    <p>モンスターを探しています……</p>

    <button onclick="startBattle()">
      ⚔️ モンスターを探す
    </button>

    <button onclick="showHome()">
      戻る
    </button>
  `;
}

function startBattle() {
  if (!player.started || player.gameOver) {
    return;
  }

  const available = enemies.filter(enemy => {
    return player.level + 1 >= enemy.minLevel;
  });

  const list = available.length > 0
    ? available
    : [enemies[0]];

  const base =
    list[Math.floor(Math.random() * list.length)];

  const level =
    Math.max(
      base.minLevel,
      Math.min(
        base.maxLevel,
        player.level + 1 + Math.floor(Math.random() * 2)
      )
    );

  const hpBonus =
    Math.max(0, level - 1) * 5;

  const attackBonus =
    Math.max(0, level - 1) * 2;

  currentEnemy = {
    name: base.name,
    level: level,

    maxHp: base.hp + hpBonus,
    hp: base.hp + hpBonus,

    attack: base.attack + attackBonus,

    xp: base.xp + (level - 1) * 5,

    money: base.money + (level - 1) * 5,

    area: base.area
  };

  defending = false;

  clearLog();

  player.encyclopedia[currentEnemy.name] = true;

  writeLog(
    `⚠️ ${escapeHtml(currentEnemy.name)} Lv.${currentEnemy.level} が現れた！`
  );

  showBattleScreen();
}

function showBattleScreen() {
  if (!currentEnemy) {
    showBattle();
    return;
  }

  clearScreen();

  const hpPercent =
    Math.max(
      0,
      Math.min(
        100,
        (currentEnemy.hp / currentEnemy.maxHp) * 100
      )
    );

  $("screen").innerHTML = `
    <div class="battle-screen">

      <h2>⚔️ 戦闘中</h2>

      <div class="enemy-box">

        <h3>
          👹 ${escapeHtml(currentEnemy.name)}
        </h3>

        <p>Lv.${currentEnemy.level}</p>

        <div class="hp-bar">
          <div
            class="hp-fill"
            style="width:${hpPercent}%"
          ></div>
        </div>

        <p>
          HP：${currentEnemy.hp}/${currentEnemy.maxHp}
        </p>

      </div>

      <div class="player-box">

        <p>
          ❤️ HP：${player.hp}/${player.maxHp}
        </p>

        <p>
          ⚔️ 攻撃力：${player.attack}
        </p>

        <p>
          🛡️ 防御：
          ${defending ? "ON" : "OFF"}
        </p>

      </div>

      <div
        id="battleLog"
        class="battle-log"
      ></div>

      <div class="battle-buttons">

        <button onclick="attackEnemy()">
          ⚔️ コウゲキ
        </button>

        <button onclick="defend()">
          🛡️ ボウギョ
        </button>

        <button onclick="showSkillSelect()">
          ✨ スキル
        </button>

        <button onclick="inspectEnemy()">
          🔍 シラベル
        </button>

        <button onclick="flee()">
          🏃 ニゲル
        </button>

      </div>

    </div>
  `;

  updateBattleLog();
  updateStatus();
}

/* =========================================================
   攻撃
========================================================= */

function attackEnemy() {
  if (!currentEnemy) {
    return;
  }

  defending = false;

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

  currentEnemy.hp -= damage;

  writeLog(
    `⚔️ ${damage}ダメージを与えた！`
  );

  if (critical) {
    writeLog("💥 クリティカルヒット！");
  }

  if (
    player.weapon === "タガー" &&
    Math.random() < 0.25
  ) {
    currentEnemy.hp -= 5;

    writeLog(
      "🩸 タガーの出血！追加5ダメージ！"
    );
  }

  if (currentEnemy.hp <= 0) {
    currentEnemy.hp = 0;
    victory();
    return;
  }

  showBattleScreen();

  setTimeout(enemyAttack, 500);
}

/* =========================================================
   防御
========================================================= */

function defend() {
  if (!currentEnemy) {
    return;
  }

  defending = true;

  writeLog("🛡️ 防御態勢に入った！");

  showBattleScreen();

  setTimeout(enemyAttack, 500);
}

/* =========================================================
   スキル
========================================================= */

function showSkillSelect() {
  if (!currentEnemy) {
    return;
  }

  clearScreen();

  let html = `
    <h2>✨ スキル</h2>

    <p>使用するスキルを選んでください。</p>
  `;

  if (player.skills.length === 0) {

    html += `
      <p>まだスキルを覚えていません。</p>
    `;

  } else {

    player.skills.forEach(skill => {

      const data = skillData[skill];

      if (!data) {
        return;
      }

      html += `
        <button onclick="useSelectedSkill('${escapeHtml(skill)}')">
          ✨ ${escapeHtml(skill)}
        </button>

        <p>
          ${escapeHtml(data.description)}
        </p>
      `;
    });
  }

  html += `
    <button onclick="showBattleScreen()">
      戻る
    </button>

    <div
      id="battleLog"
      class="battle-log"
    ></div>
  `;

  $("screen").innerHTML = html;

  updateBattleLog();
}

function useSkill() {
  showSkillSelect();
}

function useSelectedSkill(skill) {
  if (!currentEnemy) {
    return;
  }

  const data = skillData[skill];

  if (!data) {
    return;
  }

  if (!player.skills.includes(skill)) {
    return;
  }

  defending = false;

  if (data.type === "heal") {

    const before = player.hp;

    player.hp = Math.min(
      player.maxHp,
      player.hp + data.power
    );

    const healed =
      player.hp - before;

    writeLog(
      `❤️ ${escapeHtml(skill)}！HPが${healed}回復した！`
    );

    showBattleScreen();

    setTimeout(enemyAttack, 500);

    return;
  }

  const damage = data.power;

  currentEnemy.hp -= damage;

  writeLog(
    `✨ ${escapeHtml(skill)}！${damage}ダメージ！`
  );

  if (currentEnemy.hp <= 0) {
    currentEnemy.hp = 0;
    victory();
    return;
  }

  showBattleScreen();

  setTimeout(enemyAttack, 500);
}

/* =========================================================
   敵の攻撃
========================================================= */

function enemyAttack() {
  if (!currentEnemy) {
    return;
  }

  let damage = currentEnemy.attack;

  if (defending) {
    damage = Math.floor(damage / 2);

    writeLog(
      "🛡️ 防御してダメージを半減した！"
    );
  }

  player.hp -= damage;

  if (player.hp < 0) {
    player.hp = 0;
  }

  writeLog(
    `👹 ${escapeHtml(currentEnemy.name)}の攻撃！`
  );

  writeLog(
    `💥 ${damage}ダメージを受けた！`
  );

  defending = false;

  if (player.hp <= 0) {
    gameOver();
    return;
  }

  saveGame();

  showBattleScreen();
}

/* =========================================================
   敵を調べる
========================================================= */

function inspectEnemy() {
  if (!currentEnemy) {
    return;
  }

  writeLog(
    `🔍 ${escapeHtml(currentEnemy.name)}を調べた。`
  );

  writeLog(
    `HP ${currentEnemy.hp}/${currentEnemy.maxHp}・攻撃 ${currentEnemy.attack}`
  );

  showBattleScreen();
}

/* =========================================================
   逃げる
========================================================= */

function flee() {
  if (!currentEnemy) {
    return;
  }

  const success =
    Math.random() < 0.75;

  if (success) {

    writeLog("🏃 戦闘から逃げた！");

    currentEnemy = null;
    defending = false;

    setTimeout(showBattle, 500);

  } else {

    writeLog("❌ 逃げられなかった！");

    showBattleScreen();

    setTimeout(enemyAttack, 500);
  }
}

/* =========================================================
   勝利
========================================================= */

function victory() {
  if (!currentEnemy) {
    return;
  }

  const defeatedName = currentEnemy.name;
  const earnedXp = currentEnemy.xp;
  const earnedMoney = currentEnemy.money;

  player.defeats += 1;

  player.xp += earnedXp;
  player.money += earnedMoney;

  player.bounty += 10;

  writeLog(
    `🎉 ${escapeHtml(defeatedName)}を倒した！`
  );

  writeLog(
    `💰 ${earnedMoney}円を手に入れた！`
  );

  writeLog(
    `⭐ ${earnedXp} XPを獲得した！`
  );

  writeLog(
    `🏆 懸賞金が10円増えた！`
  );

  if (
    player.defeats >= 3 &&
    !player.townUnlocked
  ) {

    player.townUnlocked = true;
    player.townTrust = 15;

    writeLog(
      "🏘️ 3体のモンスターを倒した！町が解放された！"
    );
  }

  if (
    player.defeats >= 8 &&
    !player.cityUnlocked
  ) {

    player.cityUnlocked = true;
    player.cityTrust = 50;

    writeLog(
      "🏙️ 8体のモンスターを倒した！都市が解放された！"
    );
  }

  currentEnemy = null;
  defending = false;

  saveGame();

  showVictoryScreen();

  setTimeout(() => {

    if (checkLevelUp()) {
      return;
    }

    showBattle();

  }, 1500);
}

function showVictoryScreen() {
  clearScreen();

  $("screen").innerHTML = `
    <div class="victory-screen">

      <h2>🎉 勝利！</h2>

      <p>モンスターを倒した！</p>

      <div
        id="battleLog"
        class="battle-log"
      ></div>

      <button onclick="showBattle()">
        ⚔️ 次の戦いへ
      </button>

      <button onclick="showHome()">
        🏠 ホームへ
      </button>

    </div>
  `;

  updateBattleLog();
}

/* =========================================================
   レベルアップ
========================================================= */

function checkLevelUp() {
  const required =
    50 + player.level * 50;

  if (player.xp < required) {
    return false;
  }

  player.xp -= required;
  player.level += 1;

  showLevelUpChoice();

  return true;
}

function showLevelUpChoice() {
  clearScreen();

  $("screen").innerHTML = `
    <div class="levelup-screen">

      <h2>🎉 レベルアップ！</h2>

      <p>
        Lv.${player.level}になった！
      </p>

      <h3>強化するものを選択</h3>

      <button onclick="levelUpHp()">
        ❤️ 最大HP +5
      </button>

      <button onclick="levelUpAttack()">
        ⚔️ 攻撃力 +20
      </button>

      <button onclick="unlockSkill()">
        ✨ スキルを1つ解放
      </button>

    </div>
  `;
}

function levelUpHp() {
  player.maxHp += 5;
  player.hp = player.maxHp;

  writeLog(
    "❤️ 最大HPが5増えた！"
  );

  saveGame();
  showHome();
}

function levelUpAttack() {
  player.attack += 20;

  writeLog(
    "⚔️ 攻撃力が20増えた！"
  );

  saveGame();
  showHome();
}

function unlockSkill() {
  const availableSkills = [
    "高速切り",
    "回転斬り",
    "超斬撃"
  ].filter(skill => {
    return !player.skills.includes(skill);
  });

  if (availableSkills.length === 0) {

    player.attack += 10;

    writeLog(
      "✨ 覚えられるスキルがないため攻撃力+10！"
    );

    saveGame();
    showHome();

    return;
  }

  const skill =
    availableSkills[
      Math.floor(
        Math.random() * availableSkills.length
      )
    ];

  player.skills.push(skill);

  writeLog(
    `✨ ${escapeHtml(skill)}を覚えた！`
  );

  saveGame();
  showHome();
}

/* =========================================================
   ゲームオーバー
========================================================= */

function gameOver() {
  player.gameOver = true;

  currentEnemy = null;
  defending = false;

  saveGame();

  clearScreen();

  $("screen").innerHTML = `
    <div class="gameover-screen">

      <h2>💀 ゲームオーバー</h2>

      <p>勇者は力尽きた……。</p>

      <p>
        所持金・レベルなどがリセットされます。
      </p>

      <button onclick="restartAfterDeath()">
        🔄 最初からやり直す
      </button>

    </div>
  `;

  updateStatus();
}

function restartAfterDeath() {
  resetPlayer();
  showStart();
}

/* =========================================================
   町
========================================================= */

function showTown() {
  if (!player.started) {
    showStart();
    return;
  }

  clearScreen();

  if (!player.townUnlocked) {

    $("screen").innerHTML = `
      <h2>🏘️ 町</h2>

      <p>まだ町は解放されていません。</p>
      <p>モンスターを3体倒すと解放されます。</p>

      <button onclick="showHome()">
        戻る
      </button>
    `;

    return;
  }

  $("screen").innerHTML = `
    <h2>🏘️ 町</h2>

    <p>
      町の信頼度：${player.townTrust}
    </p>

    <button onclick="townHeal()">
      ❤️ 宿屋で回復
    </button>

    <button onclick="townShop()">
      🛒 武器屋
    </button>

    <button onclick="townEvent()">
      🎁 町のイベント
    </button>

    <button onclick="showHome()">
      戻る
    </button>
  `;
}

function townHeal() {
  const cost = 30;

  if (player.money < cost) {
    alert("お金が足りません。");
    return;
  }

  player.money -= cost;
  player.hp = player.maxHp;

  player.townTrust += 1;

  writeLog(
    `❤️ 宿屋で回復した！${cost}円使った。`
  );

  saveGame();
  updateStatus();
  showTown();
}

function townShop() {
  clearScreen();

  $("screen").innerHTML = `
    <h2>🛒 町の武器屋</h2>

    <button onclick="buySword()">
      🗡️ 剣を買う（100円）
    </button>

    <button onclick="buyDagger()">
      🔪 タガーを買う（50円）
    </button>

    <button onclick="showTown()">
      戻る
    </button>
  `;
}

function buySword() {
  if (player.money < 100) {
    alert("お金が足りません。");
    return;
  }

  player.money -= 100;
  player.weapon = "剣";

  player.inventory["剣"] =
    (player.inventory["剣"] || 0) + 1;

  player.townTrust += 2;

  writeLog("🗡️ 剣を購入した！");

  saveGame();
  updateStatus();
  showTown();
}

function buyDagger() {
  if (player.money < 50) {
    alert("お金が足りません。");
    return;
  }

  player.money -= 50;
  player.weapon = "タガー";

  player.inventory["タガー"] =
    (player.inventory["タガー"] || 0) + 1;

  player.townTrust += 1;

  writeLog("🔪 タガーを購入した！");

  saveGame();
  updateStatus();
  showTown();
}

function townEvent() {
  const gifts = [
    {
      name: "薬草",
      money: 0
    },

    {
      name: "タガー",
      money: 0
    },

    {
      name: "お金",
      money: 100
    }
  ];

  const gift =
    gifts[
      Math.floor(
        Math.random() * gifts.length
      )
    ];

  if (gift.name === "お金") {

    player.money += gift.money;

    writeLog(
      `🎁 町の人から${gift.money}円もらった！`
    );

  } else {

    player.inventory[gift.name] =
      (player.inventory[gift.name] || 0) + 1;

    writeLog(
      `🎁 町の人から${escapeHtml(gift.name)}をもらった！`
    );
  }

  player.townTrust += 3;

  saveGame();
  updateStatus();
  showTown();
}

/* =========================================================
   都市
========================================================= */

function showCity() {
  if (!player.started) {
    showStart();
    return;
  }

  clearScreen();

  if (!player.cityUnlocked) {

    $("screen").innerHTML = `
      <h2>🏙️ 都市</h2>

      <p>まだ都市は解放されていません。</p>
      <p>モンスターを8体倒すと解放されます。</p>

      <button onclick="showHome()">
        戻る
      </button>
    `;

    return;
  }

  $("screen").innerHTML = `
    <h2>🏙️ 都市</h2>

    <p>
      都市の信頼度：${player.cityTrust}
    </p>

    <button onclick="cityHeal()">
      ❤️ 高級宿（80円）
    </button>

    <button onclick="cityShop()">
      🏪 都市ショップ
    </button>

    <button onclick="cityEvent()">
      🎉 都市イベント
    </button>

    <button onclick="showHome()">
      戻る
    </button>
  `;
}

function cityHeal() {
  const cost = 80;

  if (player.money < cost) {
    alert("お金が足りません。");
    return;
  }

  player.money -= cost;
  player.hp = player.maxHp;

  player.cityTrust += 2;

  writeLog(
    "❤️ 都市の宿で完全回復した！"
  );

  saveGame();
  updateStatus();
  showCity();
}

function cityShop() {
  clearScreen();

  $("screen").innerHTML = `
    <h2>🏪 都市ショップ</h2>

    <button onclick="buyCityWeapon()">
      ⚔️ 強化武器（300円）
    </button>

    <button onclick="buyPotion()">
      🧪 回復薬（50円）
    </button>

    <button onclick="showCity()">
      戻る
    </button>
  `;
}

function buyCityWeapon() {
  if (player.money < 300) {
    alert("お金が足りません。");
    return;
  }

  player.money -= 300;
  player.weapon = "強化武器";

  player.inventory["強化武器"] =
    (player.inventory["強化武器"] || 0) + 1;

  player.cityTrust += 5;

  writeLog(
    "⚔️ 強化武器を購入した！"
  );

  saveGame();
  updateStatus();
  showCity();
}

function buyPotion() {
  if (player.money < 50) {
    alert("お金が足りません。");
    return;
  }

  player.money -= 50;

  player.inventory["回復薬"] =
    (player.inventory["回復薬"] || 0) + 1;

  writeLog(
    "🧪 回復薬を購入した！"
  );

  saveGame();
  updateStatus();
  showCity();
}

function cityEvent() {
  const reward = 150;

  player.money += reward;
  player.cityTrust += 5;

  writeLog(
    `🎉 都市イベントで${reward}円手に入れた！`
  );

  saveGame();
  updateStatus();
  showCity();
}

/* =========================================================
   ガチャ
========================================================= */

function showGacha() {
  if (!player.started) {
    showStart();
    return;
  }

  clearScreen();

  $("screen").innerHTML = `
    <h2>🎰 ガチャ</h2>

    <p>1回50円</p>

    <p>
      所持金：${player.money}円
    </p>

    <button onclick="gacha()">
      🎰 ガチャを回す
    </button>

    <button onclick="showHome()">
      戻る
    </button>
  `;
}

function gacha() {
  const cost = 50;

  if (player.money < cost) {
    alert("お金が足りません。");
    return;
  }

  player.money -= cost;

  const random = Math.random();

  let result;

  if (random < 0.5) {
    result = "タガー";
  } else {
    result = "剣";
  }

  player.inventory[result] =
    (player.inventory[result] || 0) + 1;

  writeLog(
    `🎰 ガチャ結果：${result}！`
  );

  if (result === "タガー") {

    writeLog(
      "🔪 15ダメージ。出血することがある武器。"
    );

  } else {

    writeLog(
      "🗡️ 5ダメージを追加する武器。"
    );
  }

  saveGame();
  updateStatus();

  showGachaResult(result);
}

function showGachaResult(result) {
  clearScreen();

  $("screen").innerHTML = `
    <div class="gacha-result">

      <h2>🎰 ガチャ結果</h2>

      <h3>✨ ${escapeHtml(result)} ✨</h3>

      <p>バッグに追加されました。</p>

      <button onclick="equipWeapon('${escapeHtml(result)}')">
        ⚔️ 装備する
      </button>

      <button onclick="showGacha()">
        🎰 もう一度回す
      </button>

      <button onclick="showHome()">
        🏠 ホーム
      </button>

    </div>
  `;
}

/* =========================================================
   バッグ
========================================================= */

function showBag() {
  if (!player.started) {
    showStart();
    return;
  }

  clearScreen();

  let html = `
    <div class="bag-screen">

      <h2>🎒 バッグ</h2>

      <p>
        現在の武器：
        <strong>${escapeHtml(player.weapon)}</strong>
      </p>
  `;

  const items =
    Object.entries(player.inventory);

  if (items.length === 0) {

    html += `
      <p>バッグは空です。</p>
    `;

  } else {

    items.forEach(([item, count]) => {

      html += `
        <div class="inventory-item">

          <span>
            ${escapeHtml(item)}
            ×${count}
          </span>

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

              : item === "回復薬"
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
    });
  }

  html += `
      <button onclick="showHome()">
        戻る
      </button>

    </div>
  `;

  $("screen").innerHTML = html;
}

function equipWeapon(weapon) {
  if (!player.inventory[weapon]) {
    return;
  }

  if (
    weapon !== "タガー" &&
    weapon !== "剣" &&
    weapon !== "強化武器"
  ) {
    return;
  }

  player.weapon = weapon;

  writeLog(
    `⚔️ ${escapeHtml(weapon)}を装備した！`
  );

  saveGame();
  updateStatus();

  showBag();
}

function usePotion() {
  if (
    !player.inventory["回復薬"] ||
    player.inventory["回復薬"] <= 0
  ) {
    alert("回復薬を持っていません。");
    return;
  }

  if (player.hp >= player.maxHp) {
    alert("HPは満タンです。");
    return;
  }

  const before = player.hp;

  player.hp = Math.min(
    player.maxHp,
    player.hp + 30
  );

  const healed =
    player.hp - before;

  player.inventory["回復薬"]--;

  if (player.inventory["回復薬"] <= 0) {
    delete player.inventory["回復薬"];
  }

  writeLog(
    `🧪 回復薬を使った！HPが${healed}回復した！`
  );

  saveGame();
  updateStatus();

  showBag();
}

/* =========================================================
   ボス
========================================================= */

function showBoss() {
  if (!player.started) {
    showStart();
    return;
  }

  clearScreen();

  $("screen").innerHTML = `
    <div class="boss-screen">

      <h2>👑 懸賞金王</h2>

      <p>
        最強の敵に挑戦する。
      </p>

      <p>
        HP：500
      </p>

      <p>
        攻撃力：45
      </p>

      <button onclick="startBossBattle()">
        👑 ボスに挑む
      </button>

      <button onclick="showHome()">
        戻る
      </button>

    </div>
  `;
}

function startBossBattle() {
  if (!player.started || player.gameOver) {
    return;
  }

  currentEnemy = {
    name: bossEnemy.name,
    level: 50,

    maxHp: bossEnemy.maxHp,
    hp: bossEnemy.maxHp,

    attack: bossEnemy.attack,

    xp: bossEnemy.xp,
    money: bossEnemy.money,

    area: "王城"
  };

  defending = false;

  clearLog();

  player.encyclopedia[currentEnemy.name] = true;

  writeLog(
    "👑 懸賞金王が現れた！"
  );

  showBattleScreen();
}

/* =========================================================
   設定
========================================================= */

function showSettings() {
  if (!player.started) {
    showStart();
    return;
  }

  clearScreen();

  $("screen").innerHTML = `
    <div class="settings-screen">

      <h2>⚙️ 設定</h2>

      <button onclick="showSkillInfo()">
        ✨ スキル情報
      </button>

      <button onclick="showLevelInfo()">
        📊 レベル確認
      </button>

      <button onclick="showEncyclopedia()">
        📖 モンスター図鑑
      </button>

      <button onclick="saveGame(); alert('セーブしました！')">
        💾 セーブ
      </button>

      <button onclick="continueGame()">
        📂 セーブを読み込む
      </button>

      <button onclick="deleteSaveConfirm()">
        🗑️ セーブデータ削除
      </button>

      <button onclick="showHome()">
        戻る
      </button>

    </div>
  `;
}

function deleteSaveConfirm() {
  const ok =
    confirm(
      "本当にセーブデータを削除しますか？"
    );

  if (!ok) {
    return;
  }

  deleteSave();
}

/* =========================================================
   スキル情報
========================================================= */

function showSkillInfo() {
  clearScreen();

  let html = `
    <div class="info-screen">

      <h2>✨ スキル情報</h2>
  `;

  if (player.skills.length === 0) {

    html += `
      <p>スキルを覚えていません。</p>
    `;

  } else {

    player.skills.forEach(skill => {

      const data = skillData[skill];

      if (!data) {
        return;
      }

      html += `
        <div class="info-card">

          <h3>✨ ${escapeHtml(skill)}</h3>

          <p>
            ${escapeHtml(data.description)}
          </p>

        </div>
      `;
    });
  }

  html += `
      <button onclick="showSettings()">
        戻る
      </button>

    </div>
  `;

  $("screen").innerHTML = html;
}

/* =========================================================
   レベル情報
========================================================= */

function showLevelInfo() {
  clearScreen();

  const required =
    50 + player.level * 50;

  $("screen").innerHTML = `
    <div class="info-screen">

      <h2>📊 レベル情報</h2>

      <div class="info-card">

        <p>
          現在レベル：Lv.${player.level}
        </p>

        <p>
          現在XP：${player.xp}
        </p>

        <p>
          次のレベルまで：
          ${Math.max(0, required - player.xp)} XP
        </p>

        <p>
          最大HP：${player.maxHp}
        </p>

        <p>
          攻撃力：${player.attack}
        </p>

      </div>

      <button onclick="showSettings()">
        戻る
      </button>

    </div>
  `;
}

/* =========================================================
   モンスター図鑑
========================================================= */

function showEncyclopedia() {
  clearScreen();

  let html = `
    <div class="encyclopedia-screen">

      <h2>📖 モンスター図鑑</h2>
  `;

  enemies.forEach(enemy => {

    const discovered =
      player.encyclopedia[enemy.name];

    if (discovered) {

      html += `
        <div class="enemy-card">

          <h3>👹 ${escapeHtml(enemy.name)}</h3>

          <p>
            出現場所：${escapeHtml(enemy.area)}
          </p>

          <p>
            基本HP：${enemy.hp}
          </p>

          <p>
            基本攻撃：${enemy.attack}
          </p>

          <p>
            XP：${enemy.xp}
          </p>

          <p>
            お金：${enemy.money}円
          </p>

        </div>
      `;

    } else {

      html += `
        <div class="enemy-card">

          <h3>❓ 未発見</h3>

          <p>
            まだ戦ったことがありません。
          </p>

        </div>
      `;
    }
  });

  const bossFound =
    player.encyclopedia[bossEnemy.name];

  html += `
      <div class="enemy-card">

        <h3>
          ${bossFound ? "👑 懸賞金王" : "❓ 未発見"}
        </h3>

        ${
          bossFound
            ? `
              <p>HP：${bossEnemy.maxHp}</p>
              <p>攻撃：${bossEnemy.attack}</p>
            `
            : `
              <p>まだ戦ったことがありません。</p>
            `
        }

      </div>

      <button onclick="showSettings()">
        戻る
      </button>

    </div>
  `;

  $("screen").innerHTML = html;
}

/* =========================================================
   初期化
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    updateStatus();

    if (loadGame()) {
      showHome();
    } else {
      showStart();
    }

  }
);
