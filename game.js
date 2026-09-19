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
      <span>💰懸賞金 ${player.bounty}円</span>
    </div>
  `;
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
   保存
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
      <input id="playerName" maxlength="12" placeholder="名前を入力">
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

  writeLog(
    `${escapeHtml(player.name)}は${escapeHtml(job)}として冒険を始めた！`
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
    </div>

    <h3>📜 冒険</h3>

    <button onclick="showBattle()">⚔️ モンスターと戦う</button>
    <button onclick="showBoss()">👑 ボスに挑む</button>
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

  const hpBonus = Math.max(0, level - 1) * 5;
  const attackBonus = Math.max(0, level - 1) * 2;

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

  $("screen").innerHTML = `
    <div class="battle-screen">

      <h2>⚔️ 戦闘中</h2>

      <div class="enemy-box">
        <h3>👹 ${escapeHtml(currentEnemy.name)}</h3>

        <p>Lv.${currentEnemy.level}</p>

        <div class="hp-bar">
          <div
            class="hp-fill"
            style="width:${Math.max(
              0,
              (currentEnemy.hp / currentEnemy.maxHp) * 100
            )}%"
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
        <button onclick="useSelectedSkill('${skill}')">
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

  defending = false;

  if (data.type === "heal") {
    const before = player.hp;

    player.hp = Math.min(
      player.maxHp,
      player.hp + data.power
    );

    const healed = player.hp - before;

    writeLog(
      `❤️ ${skill}！HPが${healed}回復した！`
    );

    showBattleScreen();

    setTimeout(enemyAttack, 500);

    return;
  }

  const damage = data.power;

  currentEnemy.hp -= damage;

  writeLog(
    `✨ ${skill}！${damage}ダメージ！`
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
    writeLog("🛡️ 防御してダメージを半減した！");
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

  const success = Math.random() < 0.75;

  if (success) {
    writeLog("🏃 戦闘から逃げた！");

    currentEnemy = null;

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

  /* 3体倒したら町解放 */
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

  /* 8体倒したら都市解放 */
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
    `✨ ${skill}を覚えた！`
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

      <button onclick="showHome()">戻る</button>
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
      `🎁 町の人から${gift.name}をもらった！`
    );
  }

  player.townTrust += 3;

  saveGame();
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

      <button onclick="showHome()">戻る</button>
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

  writeLog("⚔️ 強化武器を購入した！");

  saveGame();
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

  writeLog("🧪 回復薬を購入した！");

  saveGame();
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

  const result =
    Math.random() < 0.5
      ? "タガー"
      : "剣";

  player.inventory[result] =
    (player.inventory[result] || 0) + 1;

  writeLog(
    `🎰 ガチャ結果：${result}！`
  );

  if (result === "タガー") {
    writeLog(
      "🔪 15ダメージ。出血することがある武器
