alert("game.js読み込みOK");

// ==========================================
// ⚔️ 勇者の懸賞金RPG
// オフライン版・全部入り
// 管理者コード：3487
// ==========================================

const SAVE_KEY = "yuusha_bounty_rpg_save_v1";

let player = {
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
  inventory: ["タガー"],
  defeats: 0,
  townUnlocked: false,
  cityUnlocked: false,
  townTrust: 0,
  cityTrust: 0,
  encyclopedia: []
};

let currentEnemy = null;
let defending = false;
let battleOver = false;


// ==========================================
// 敵
// ==========================================

const enemies = [
  {
    name: "怪物猫",
    minLevel: 1,
    maxLevel: 5,
    hp: 20,
    attack: 6,
    xp: 25,
    money: 20
  },
  {
    name: "スライム",
    minLevel: 1,
    maxLevel: 5,
    hp: 24,
    attack: 7,
    xp: 28,
    money: 22
  },
  {
    name: "ゴブリン",
    minLevel: 2,
    maxLevel: 7,
    hp: 35,
    attack: 10,
    xp: 40,
    money: 35
  },
  {
    name: "オオカミ",
    minLevel: 3,
    maxLevel: 8,
    hp: 42,
    attack: 13,
    xp: 50,
    money: 45
  },
  {
    name: "闇の騎士",
    minLevel: 5,
    maxLevel: 12,
    hp: 70,
    attack: 20,
    xp: 90,
    money: 80
  }
];

const bossEnemy = {
  name: "懸賞金王",
  hp: 500,
  attack: 45,
  xp: 1000,
  money: 1000
};


// ==========================================
// 職業
// ==========================================

const jobData = {
  勇者: {
    hp: 30,
    attack: 10,
    skills: ["斬撃"]
  },

  ヒーラー: {
    hp: 35,
    attack: 7,
    skills: ["ヒール"]
  },

  剣士: {
    hp: 30,
    attack: 14,
    skills: ["強斬り"]
  }
};


// ==========================================
// スキル
// ==========================================

const skillData = {
  斬撃: {
    power: 35,
    text: "敵を強く斬る。"
  },

  ヒール: {
    power: -25,
    text: "HPを25回復する。"
  },

  強斬り: {
    power: 50,
    text: "強力な一撃。"
  },

  高速切り: {
    power: 65,
    text: "高速で斬りつける。"
  },

  回転斬り: {
    power: 80,
    text: "回転しながら攻撃する。"
  },

  超斬撃: {
    power: 120,
    text: "究極の斬撃。"
  }
};


// ==========================================
// 基本
// ==========================================

function $(id) {
  return document.getElementById(id);
}

function clearScreen() {
  if ($("screen")) {
    $("screen").innerHTML = "";
  }
}


// ==========================================
// ⭐ ログ表示
// ==========================================

function writeLog(text) {

  const log = $("log");

  if (log) {
    log.innerHTML += `<div>${text}</div>`;
    log.scrollTop = log.scrollHeight;
  }

  updateBattleLog();
}


// 戦闘画面のログ欄にも表示
function updateBattleLog() {

  const battleLog = $("battleLog");
  const log = $("log");

  if (!battleLog || !log) {
    return;
  }

  battleLog.innerHTML = log.innerHTML;
  battleLog.scrollTop = battleLog.scrollHeight;
}


// ==========================================
// ステータス
// ==========================================

function updateStatus() {

  const status = $("status");

  if (!status) {
    return;
  }

  if (!player.name) {

    status.innerHTML =
      "まだ冒険者を作成していません";

    return;
  }

  status.innerHTML =
    `👤 ${player.name}　` +
    `⚔️ ${player.job}　` +
    `Lv.${player.level}　` +
    `❤️ ${player.hp}/${player.maxHp}　` +
    `💰 ${player.money}円　` +
    `🏆 ${player.bounty}円`;
}


// ==========================================
// セーブ
// ==========================================

function saveGame() {

  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify(player)
  );
}


// ==========================================
// ロード
// ==========================================

function loadGame() {

  const data =
    localStorage.getItem(SAVE_KEY);

  if (!data) {
    return false;
  }

  try {

    player = {
      ...player,
      ...JSON.parse(data)
    };

    return !!player.name;

  } catch (error) {

    console.error(error);

    return false;
  }
}


// ==========================================
// リセット
// ==========================================

function resetGame() {

  if (
    !confirm(
      "本当にセーブデータを削除しますか？"
    )
  ) {
    return;
  }

  localStorage.removeItem(SAVE_KEY);

  player = {
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
    inventory: ["タガー"],
    defeats: 0,
    townUnlocked: false,
    cityUnlocked: false,
    townTrust: 0,
    cityTrust: 0,
    encyclopedia: []
  };

  currentEnemy = null;
  battleOver = false;

  if ($("log")) {
    $("log").innerHTML = "";
  }

  writeLog(
    "🗑️ セーブデータを削除しました。"
  );

  showStart();
}


// ==========================================
// キャラクター作成
// ==========================================

function showStart() {

  clearScreen();

  $("screen").innerHTML = `
    <h2>⚔️ 勇者の懸賞金RPG</h2>

    <p>冒険者を作成してください！</p>

    <input
      id="nameInput"
      type="text"
      maxlength="12"
      placeholder="名前を入力"
    >

    <h3>職業を選択</h3>

    <button onclick="createPlayer('勇者')">
      ⚔️ 勇者
    </button>

    <button onclick="createPlayer('ヒーラー')">
      💚 ヒーラー
    </button>

    <button onclick="createPlayer('剣士')">
      🗡️ 剣士
    </button>
  `;

  updateStatus();
}


function createPlayer(job) {

  const input = $("nameInput");

  const name =
    input
      ? input.value.trim()
      : "";

  if (!name) {

    alert(
      "名前を入力してください！"
    );

    return;
  }

  const data =
    jobData[job];

  player.name = name;
  player.job = job;

  player.level = 0;
  player.xp = 0;

  player.maxHp = data.hp;
  player.hp = data.hp;

  player.attack = data.attack;

  player.money = 250;
  player.bounty = 0;

  player.weapon = "タガー";

  player.skills =
    [...data.skills];

  player.inventory =
    ["タガー"];

  player.defeats = 0;

  player.townUnlocked = false;
  player.cityUnlocked = false;

  player.townTrust = 0;
  player.cityTrust = 0;

  player.encyclopedia = [];

  if ($("log")) {
    $("log").innerHTML = "";
  }

  saveGame();

  writeLog(
    `👋 ${name}さん、冒険開始！`
  );

  showHome();
}


// ==========================================
// ホーム
// ==========================================

function showHome() {

  clearScreen();

  if (!player.name) {
    showStart();
    return;
  }

  $("screen").innerHTML = `
    <h2>🏠 ホーム</h2>

    <p>
      ようこそ、${player.name}！
    </p>

    <div class="card">

      <p>⚔️ 職業：${player.job}</p>

      <p>📈 レベル：${player.level}</p>

      <p>
        ❤️ HP：
        ${player.hp}/${player.maxHp}
      </p>

      <p>
        💪 攻撃力：
        ${player.attack}
      </p>

      <p>
        💰 所持金：
        ${player.money}円
      </p>

      <p>
        🏆 懸賞金：
        ${player.bounty}円
      </p>

      <p>
        🎒 武器：
        ${player.weapon}
      </p>

      <p>
        ☠️ 討伐数：
        ${player.defeats}
      </p>

    </div>

    <button onclick="showBattle()">
      ⚔️ 戦う
    </button>

    <button onclick="showBag()">
      🎒 バッグ
    </button>
  `;

  updateStatus();
}


// ==========================================
// 戦う
// ==========================================

function showBattle() {

  if (!player.name) {

    showStart();

    return;
  }

  clearScreen();

  $("screen").innerHTML = `
    <h2>🌿 冒険エリア</h2>

    <p>
      敵を探して戦おう！
    </p>

    <button onclick="startBattle()">
      🐾 草原で戦う
    </button>

    <button onclick="showBoss()">
      👑 ボスに挑む
    </button>
  `;

  updateStatus();
}


// ==========================================
// 敵出現
// ==========================================

function startBattle() {

  const available =
    enemies.filter(enemy =>
      player.level + 2 >= enemy.minLevel &&
      player.level + 1 <= enemy.maxLevel
    );

  const base =
    available.length
      ? available[
          Math.floor(
            Math.random() *
            available.length
          )
        ]
      : enemies[0];

  const levelBonus =
    Math.floor(
      Math.random() * 3
    );

  currentEnemy = {

    ...base,

    level: Math.max(
      1,
      Math.min(
        base.maxLevel,
        base.minLevel + levelBonus
      )
    )
  };

  currentEnemy.maxHp =
    currentEnemy.hp +
    (currentEnemy.level - 1) * 5;

  currentEnemy.hp =
    currentEnemy.maxHp;

  currentEnemy.attack +=
    Math.max(
      0,
      currentEnemy.level - 1
    ) * 2;

  battleOver = false;
  defending = false;

  if (
    !player.encyclopedia.includes(
      currentEnemy.name
    )
  ) {

    player.encyclopedia.push(
      currentEnemy.name
    );
  }

  // ⭐ 新しい戦闘ログ
  if ($("log")) {
    $("log").innerHTML = "";
  }

  writeLog(
    `👹 ${currentEnemy.name} が現れた！`
  );

  showBattleScreen();
}


// ==========================================
// ⭐ バトル画面
// ==========================================

function showBattleScreen() {

  clearScreen();

  if (!currentEnemy) {

    showBattle();

    return;
  }

  $("screen").innerHTML = `

    <h2>⚔️ バトル</h2>

    <div class="card">

      <h3>
        👹 ${currentEnemy.name}
        Lv.${currentEnemy.level}
      </h3>

      <p>
        ❤️ HP：
        ${currentEnemy.hp}/${currentEnemy.maxHp}
      </p>

      <p>
        💪 攻撃：
        ${currentEnemy.attack}
      </p>

    </div>

    <div class="card">

      <p>
        🧑 ${player.name}
      </p>

      <p>
        ❤️ HP：
        ${player.hp}/${player.maxHp}
      </p>

    </div>


    <!-- ⭐⭐⭐ 戦闘メッセージ表示欄 ⭐⭐⭐ -->

    <div
      class="card battle-message"
      style="
        max-height:180px;
        overflow-y:auto;
        text-align:left;
        margin-bottom:15px;
      "
    >

      <h3>📜 戦闘ログ</h3>

      <div id="battleLog">
      </div>

    </div>


    <button onclick="attackEnemy()">
      ⚔️ コウゲキ
    </button>

    <button onclick="defend()">
      🛡️ ボウギョ
    </button>

    <button onclick="useSkill()">
      ✨ スキル
    </button>

    <button onclick="inspectEnemy()">
      🔍 シラベル
    </button>

    <button onclick="flee()">
      🏃 ニゲル
    </button>
  `;

  // ⭐ 画面を作った後にログを表示
  updateBattleLog();
}


// ==========================================
// 通常攻撃
// ==========================================

function attackEnemy() {

  if (
    !currentEnemy ||
    battleOver
  ) {
    return;
  }

  let damage =
    player.attack;

  if (
    Math.random() < 0.1
  ) {

    damage += 5;

    writeLog(
      "💥 クリティカル！ +5ダメージ！"
    );
  }

  currentEnemy.hp -= damage;

  writeLog(
    `⚔️ ${damage}ダメージ！`
  );

  if (
    currentEnemy.hp <= 0
  ) {

    victory();

    return;
  }

  enemyAttack();
}


// ==========================================
// 防御
// ==========================================

function defend() {

  if (
    !currentEnemy ||
    battleOver
  ) {
    return;
  }

  defending = true;

  writeLog(
    "🛡️ 防御した！"
  );

  enemyAttack();
}


// ==========================================
// スキル
// ==========================================

function useSkill() {

  if (
    !currentEnemy ||
    battleOver
  ) {
    return;
  }

  if (
    !player.skills.length
  ) {

    writeLog(
      "❌ 使えるスキルがありません。"
    );

    return;
  }

  clearScreen();

  $("screen").innerHTML = `

    <h2>✨ スキル選択</h2>

    <p>
      使うスキルを選んでください。
    </p>

    ${player.skills
      .map(skill => `

        <button
          onclick="useSelectedSkill('${skill}')"
        >
          ✨ ${skill}
        </button>

      `)
      .join("")}

    <button
      onclick="showBattleScreen()"
    >
      ↩️ 戻る
    </button>

  `;
}


function useSelectedSkill(skill) {

  if (
    !currentEnemy ||
    battleOver
  ) {
    return;
  }

  if (
    !player.skills.includes(skill)
  ) {
    return;
  }

  const data =
    skillData[skill];

  if (!data) {

    writeLog(
      "❌ そのスキルは使用できません。"
    );

    showBattleScreen();

    return;
  }

  if (data.power < 0) {

    const heal =
      Math.abs(data.power);

    player.hp =
      Math.min(
        player.maxHp,
        player.hp + heal
      );

    writeLog(
      `💚 ${skill}！ HPが${heal}回復した！`
    );

  } else {

    let damage =
      data.power;

    if (
      Math.random() < 0.1
    ) {

      damage += 5;

      writeLog(
        "💥 クリティカル！ +5ダメージ！"
      );
    }

    currentEnemy.hp -= damage;

    writeLog(
      `✨ ${skill}！ ${damage}ダメージ！`
    );

    if (
      currentEnemy.hp <= 0
    ) {

      victory();

      return;
    }
  }

  enemyAttack();
}


// ==========================================
// シラベル
// ==========================================

function inspectEnemy() {

  if (
    !currentEnemy ||
    battleOver
  ) {
    return;
  }

  writeLog(
    `🔍 ${currentEnemy.name}：` +
    `Lv.${currentEnemy.level} / ` +
    `HP ${currentEnemy.hp}/${currentEnemy.maxHp} / ` +
    `攻撃 ${currentEnemy.attack}`
  );
}


// ==========================================
// 逃げる
// ==========================================

function flee() {

  if (
    !currentEnemy ||
    battleOver
  ) {
    return;
  }

  if (
    Math.random() < 0.7
  ) {

    writeLog(
      "🏃 逃げ切った！"
    );

    currentEnemy = null;

    showBattle();

  } else {

    writeLog(
      "❌ 逃げられない！"
    );

    enemyAttack
