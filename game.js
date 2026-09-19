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

function writeLog(text) {
  const log = $("log");

  if (!log) return;

  log.innerHTML += `<div>${text}</div>`;
  log.scrollTop = log.scrollHeight;
}

function updateStatus() {
  const status = $("status");

  if (!status) return;

  if (!player.name) {
    status.innerHTML = "まだ冒険者を作成していません";
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
// セーブ・ロード
// ==========================================

function saveGame() {
  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify(player)
  );
}

function loadGame() {
  const data = localStorage.getItem(SAVE_KEY);

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

function resetGame() {
  if (!confirm("本当にセーブデータを削除しますか？")) {
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

  writeLog("🗑️ セーブデータを削除しました。");

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

  const name = input
    ? input.value.trim()
    : "";

  if (!name) {
    alert("名前を入力してください！");
    return;
  }

  const data = jobData[job];

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

  player.skills = [...data.skills];

  player.inventory = ["タガー"];

  player.defeats = 0;

  player.townUnlocked = false;
  player.cityUnlocked = false;

  player.townTrust = 0;
  player.cityTrust = 0;

  player.encyclopedia = [];

  saveGame();

  writeLog(`👋 ${name}さん、冒険開始！`);

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

    <p>ようこそ、${player.name}！</p>

    <div class="card">

      <p>⚔️ 職業：${player.job}</p>

      <p>📈 レベル：${player.level}</p>

      <p>
        ❤️ HP：
        ${player.hp}/${player.maxHp}
      </p>

      <p>💪 攻撃力：${player.attack}</p>

      <p>💰 所持金：${player.money}円</p>

      <p>🏆 懸賞金：${player.bounty}円</p>

      <p>🎒 武器：${player.weapon}</p>

      <p>☠️ 討伐数：${player.defeats}</p>

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
// バトル開始
// ==========================================

function showBattle() {
  if (!player.name) {
    showStart();
    return;
  }

  clearScreen();

  $("screen").innerHTML = `
    <h2>🌿 冒険エリア</h2>

    <p>敵を探して戦おう！</p>

    <button onclick="startBattle()">
      🐾 草原で戦う
    </button>

    <button onclick="showBoss()">
      👑 ボスに挑む
    </button>
  `;

  updateStatus();
}

function startBattle() {
  const available = enemies.filter(enemy =>
    player.level + 2 >= enemy.minLevel &&
    player.level + 1 <= enemy.maxLevel
  );

  const base = available.length
    ? available[
        Math.floor(
          Math.random() * available.length
        )
      ]
    : enemies[0];

  const levelBonus =
    Math.floor(Math.random() * 3);

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

  writeLog(
    `👹 ${currentEnemy.name} が現れた！`
  );

  showBattleScreen();
}


// ==========================================
// バトル画面
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

      <p>🧑 ${player.name}</p>

      <p>
        ❤️ HP：
        ${player.hp}/${player.maxHp}
      </p>

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
}


// ==========================================
// 通常攻撃
// ==========================================

function attackEnemy() {
  if (!currentEnemy || battleOver) {
    return;
  }

  let damage = player.attack;

  if (Math.random() < 0.1) {
    damage += 5;

    writeLog(
      "💥 クリティカル！ +5ダメージ！"
    );
  }

  currentEnemy.hp -= damage;

  writeLog(
    `⚔️ ${damage}ダメージ！`
  );

  if (currentEnemy.hp <= 0) {
    victory();
    return;
  }

  enemyAttack();
}


// ==========================================
// 防御
// ==========================================

function defend() {
  if (!currentEnemy || battleOver) {
    return;
  }

  defending = true;

  writeLog("🛡️ 防御した！");

  enemyAttack();
}


// ==========================================
// スキル
// ==========================================

function useSkill() {
  if (!currentEnemy || battleOver) {
    return;
  }

  if (!player.skills.length) {
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

    ${player.skills.map(skill => `
      <button
        onclick="useSelectedSkill('${skill}')"
      >
        ✨ ${skill}
      </button>
    `).join("")}

    <button onclick="showBattleScreen()">
      ↩️ 戻る
    </button>
  `;
}

function useSelectedSkill(skill) {
  if (!currentEnemy || battleOver) {
    return;
  }

  if (!player.skills.includes(skill)) {
    return;
  }

  const data = skillData[skill];

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

    player.hp = Math.min(
      player.maxHp,
      player.hp + heal
    );

    writeLog(
      `💚 ${skill}！ HPが${heal}回復した！`
    );

  } else {

    let damage = data.power;

    if (Math.random() < 0.1) {
      damage += 5;

      writeLog(
        "💥 クリティカル！ +5ダメージ！"
      );
    }

    currentEnemy.hp -= damage;

    writeLog(
      `✨ ${skill}！ ${damage}ダメージ！`
    );

    if (currentEnemy.hp <= 0) {
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
  if (!currentEnemy || battleOver) {
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
  if (!currentEnemy || battleOver) {
    return;
  }

  if (Math.random() < 0.7) {

    writeLog("🏃 逃げ切った！");

    currentEnemy = null;

    showBattle();

  } else {

    writeLog("❌ 逃げられない！");

    enemyAttack();
  }
}


// ==========================================
// 敵攻撃
// ==========================================

function enemyAttack() {
  if (!currentEnemy || battleOver) {
    return;
  }

  let damage = currentEnemy.attack;

  if (defending) {

    damage = Math.max(
      1,
      Math.floor(damage / 2)
    );

    defending = false;

    writeLog(
      "🛡️ 防御でダメージ半減！"
    );
  }

  player.hp -= damage;

  writeLog(
    `👹 ${currentEnemy.name}の攻撃！ ` +
    `${damage}ダメージ！`
  );

  if (player.hp <= 0) {

    player.hp = 0;

    writeLog(
      "💀 力尽きた……"
    );

    player.hp = player.maxHp;

    currentEnemy = null;

    battleOver = true;

    saveGame();

    showHome();

    return;
  }

  showBattleScreen();
}


// ==========================================
// 勝利
// ==========================================

function victory() {
  if (!currentEnemy || battleOver) {
    return;
  }

  battleOver = true;

  const enemyName =
    currentEnemy.name;

  const xp =
    currentEnemy.xp +
    Math.floor(
      currentEnemy.level * 5
    );

  const money =
    currentEnemy.money +
    currentEnemy.level * 5;

  player.xp += xp;
  player.money += money;

  player.bounty +=
    currentEnemy.level * 10;

  player.defeats++;

  writeLog(
    `🎉 ${enemyName}を倒した！`
  );

  writeLog(
    `💰 ${money}円を獲得！`
  );

  writeLog(
    `📈 ${xp} XPを獲得した！`
  );

  writeLog(
    `🏆 懸賞金 +${currentEnemy.level * 10}円！`
  );

  writeLog(
    `🎁 ${enemyName}が何かを落とした！`
  );

  // 3体討伐で町解放
  if (
    player.defeats >= 3 &&
    !player.townUnlocked
  ) {

    player.townUnlocked = true;
    player.townTrust = 15;

    writeLog(
      "🏘️ 3体討伐！町が解放された！"
    );
  }

  // 8体討伐で都市解放
  if (
    player.defeats >= 8 &&
    !player.cityUnlocked
  ) {

    player.cityUnlocked = true;
    player.cityTrust = 50;

    writeLog(
      "🏙️ 8体討伐！都市が解放された！"
    );
  }

  checkLevelUp();

  currentEnemy = null;

  saveGame();

  updateStatus();

  setTimeout(
    showBattle,
    300
  );
}


// ==========================================
// レベルアップ
// ==========================================

function checkLevelUp() {

  const need =
    (player.level + 1) * 50;

  if (player.xp < need) {
    return;
  }

  player.xp -= need;

  player.level++;

  writeLog(
    `🎊 レベルアップ！ Lv.${player.level}！`
  );

  levelUpChoice();
}

function levelUpChoice() {
  clearScreen();

  $("screen").innerHTML = `
    <h2>🎊 レベルアップ！</h2>

    <p>
      強化するものを選んでください。
    </p>

    <button onclick="levelUpHP()">
      ❤️ HP +5
    </button>

    <button onclick="levelUpAttack()">
      ⚔️ 攻撃力 +20
    </button>

    <button onclick="unlockSkill()">
      ✨ スキル解放
    </button>
  `;
}

function levelUpHP() {

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

  const locked = [
    "高速切り",
    "回転斬り",
    "超斬撃"
  ].filter(
    skill => !player.skills.includes(skill)
  );

  if (!locked.length) {

    writeLog(
      "✨ すべてのスキルを習得済み！"
    );

    saveGame();

    showHome();

    return;
  }

  const skill = locked[0];

  player.skills.push(skill);

  writeLog(
    `✨ ${skill}を習得した！`
  );

  saveGame();

  showHome();
}


// ==========================================
// 町
// ==========================================

function showTown() {
  clearScreen();

  if (!player.townUnlocked) {

    $("screen").innerHTML = `
      <h2>🏘️ 町</h2>

      <p>
        まだ町は解放されていません。
      </p>

      <p>
        敵を3体倒すと解放されます。
      </p>
    `;

    return;
  }

  $("screen").innerHTML = `
    <h2>🏘️ 町</h2>

    <p>
      町の信頼度：
      ${player.townTrust}
    </p>

    <button onclick="townShop()">
      🛒 買い物
    </button>

    <button onclick="townGift()">
      🎁 町の人と話す
    </button>
  `;
}

function townShop() {

  if (player.money < 100) {

    writeLog(
      "💰 お金が足りません。"
    );

    return;
  }

  player.money -= 100;

  player.inventory.push(
    "回復薬"
  );

  writeLog(
    "🧪 回復薬を買った！"
  );

  saveGame();

  showTown();
}

function townGift() {

  if (Math.random() < 0.5) {

    player.money += 100;

    writeLog(
      "🎁 町の人から100円もらった！"
    );

  } else {

    player.inventory.push(
      "回復薬"
    );

    writeLog(
      "🎁 町の人から回復薬をもらった！"
    );
  }

  player.townTrust += 5;

  saveGame();

  showTown();
}


// ==========================================
// 都市
// ==========================================

function showCity() {
  clearScreen();

  if (!player.cityUnlocked) {

    $("screen").innerHTML = `
      <h2>🏙️ 都市</h2>

      <p>
        まだ都市は解放されていません。
      </p>

      <p>
        敵を8体倒すと解放されます。
      </p>
    `;

    return;
  }

  $("screen").innerHTML = `
    <h2>🏙️ 都市</h2>

    <p>
      都市の信頼度：
      ${player.cityTrust}
    </p>

    <button onclick="cityShop()">
      🛒 高級ショップ
    </button>

    <button onclick="cityEvent()">
      🎉 ランダムイベント
    </button>
  `;
}

function cityShop() {

  if (player.money < 300) {

    writeLog(
      "💰 300円必要です。"
    );

    return;
  }

  player.money -= 300;

  player.attack += 15;

  player.weapon = "都市の剣";

  player.inventory.push(
    "都市の剣"
  );

  writeLog(
    "🗡️ 都市の剣を購入！ 攻撃力+15！"
  );

  player.cityTrust += 5;

  saveGame();

  updateStatus();

  showCity();
}

function cityEvent() {

  const events = [

    () => {

      player.money += 500;

      writeLog(
        "🎉 宝箱を発見！500円ゲット！"
      );

    },

    () => {

      player.hp = player.maxHp;

      writeLog(
        "🎉 回復イベント！ HP全回復！"
      );

    },

    () => {

      player.bounty += 200;

      writeLog(
        "🎉 指名手配ボーナス！懸賞金+200円！"
      );

    }
  ];

  const event =
    events[
      Math.floor(
        Math.random() * events.length
      )
    ];

  event();

  player.cityTrust += 3;

  saveGame();

  updateStatus();

  showCity();
}


// ==========================================
// ガチャ
// ==========================================

function showGacha() {
  clearScreen();

  $("screen").innerHTML = `
    <h2>🎰 ガチャ</h2>

    <p>
      100円で武器ガチャを回せます。
    </p>

    <button onclick="gacha()">
      🎰 100円で回す
    </button>
  `;
}

function gacha() {

  if (player.money < 100) {

    writeLog(
      "💰 お金が足りません。"
    );

    return;
  }

  player.money -= 100;

  const roll =
    Math.random();

  if (roll < 0.6) {

    player.weapon = "タガー";

    player.inventory.push(
      "タガー"
    );

    writeLog(
      "🗡️ タガーを入手！"
    );

  } else {

    player.weapon = "剣";

    player.inventory.push(
      "剣"
    );

    writeLog(
      "⚔️ 剣を入手！"
    );
  }

  saveGame();

  updateStatus();

  showGacha();
}


// ==========================================
// バッグ
// ==========================================

function showBag() {
  clearScreen();

  $("screen").innerHTML = `
    <h2>🎒 バッグ</h2>

    <p>
      現在の武器：
      ${player.weapon}
    </p>

    <p>
      所持アイテム：
    </p>

    <ul>
      ${
        player.inventory.length

          ? player.inventory
              .map(
                item =>
                  `<li>${item}</li>`
              )
              .join("")

          : "<li>なし</li>"
      }
    </ul>
  `;
}


// ==========================================
// 設定
// ==========================================

function showSettings() {
  clearScreen();

  $("screen").innerHTML = `
    <h2>⚙️ 設定</h2>

    <button onclick="showSkills()">
      ✨ スキル一覧
    </button>

    <button onclick="showStatus()">
      📊 ステータス確認
    </button>

    <button onclick="
      saveGame();
      writeLog('💾 セーブしました！');
    ">
      💾 セーブ
    </button>

    <button onclick="adminMode()">
      👑 管理者コード
    </button>

    <button onclick="resetGame()">
      🗑️ セーブデータ削除
    </button>
  `;
}


// ==========================================
// スキル一覧
// ==========================================

function showSkills() {
  clearScreen();

  $("screen").innerHTML = `
    <h2>✨ スキル一覧</h2>

    ${
      player.skills.length

        ? player.skills
            .map(skill => {

              const data =
                skillData[skill];

              return `
                <div class="card">

                  <b>✨ ${skill}</b>

                  <p>
                    ${
                      data
                        ? data.text
                        : "説明なし"
                    }
                  </p>

                  <p>
                    威力：
                    ${
                      data
                        ? data.power
                        : "-"
                    }
                  </p>

                </div>
              `;

            })
            .join("")

        : `
          <p>
            まだスキルを覚えていません。
          </p>
        `
    }

    <button onclick="showSettings()">
      ↩️ 戻る
    </button>
  `;
}


// ==========================================
// ステータス
// ==========================================

function showStatus() {
  clearScreen();

  $("screen").innerHTML = `
    <h2>📊 ステータス</h2>

    <div class="card">

      <p>
        👤 名前：
        ${player.name}
      </p>

      <p>
        ⚔️ 職業：
        ${player.job}
      </p>

      <p>
        📈 Lv：
        ${player.level}
      </p>

      <p>
        📚 XP：
        ${player.xp}
      </p>

      <p>
        ❤️ HP：
        ${player.hp}/${player.maxHp}
      </p>

      <p>
        💪 攻撃力：
        ${player.attack}
      </p>

      <p>
        💰 お金：
        ${player.money}円
      </p>

      <p>
        🏆 懸賞金：
        ${player.bounty}円
      </p>

      <p>
        ☠️ 討伐数：
        ${player.defeats}
      </p>

    </div>

    <button onclick="showSettings()">
      ↩️ 戻る
    </button>
  `;
}


// ==========================================
// ボス
// ==========================================

function showBoss() {
  clearScreen();

  $("screen").innerHTML = `
    <h2>👑 ボス</h2>

    <div class="card">

      <h3>👑 懸賞金王</h3>

      <p>❤️ HP：500</p>

      <p>💪 攻撃：45</p>

      <p>💰 報酬：1000円</p>

    </div>

    <button onclick="startBossBattle()">
      👑 挑戦する
    </button>
  `;
}

function startBossBattle() {

  currentEnemy = {
    ...bossEnemy,

    maxHp: bossEnemy.hp,

    level: 20
  };

  battleOver = false;
  defending = false;

  writeLog(
    "👑 懸賞金王が現れた！"
  );

  showBattleScreen();
}


// ==========================================
// 👑 管理者モード
// コード：3487
// ==========================================

function adminMode() {

  const code =
    prompt(
      "🔐 管理者コードを入力してください"
    );

  if (code !== "3487") {

    alert(
      "❌ 管理者コードが違います"
    );

    return;
  }

  player.level = 99;

  player.maxHp = 999;

  player.hp = 999;

  player.attack = 999;

  player.xp = 999999;

  player.money = 999999;

  player.bounty = 999999;

  player.skills = [
    "斬撃",
    "ヒール",
    "強斬り",
    "高速切り",
    "回転斬り",
    "超斬撃"
  ];

  player.townUnlocked = true;

  player.cityUnlocked = true;

  player.townTrust = 100;

  player.cityTrust = 100;

  writeLog(
    "👑 管理者モードを解放しました！"
  );

  writeLog(
    "✨ 全スキル解放！"
  );

  writeLog(
    "📈 レベル99！"
  );

  writeLog(
    "🏙️ 町・都市を解放！"
  );

  saveGame();

  updateStatus();

  showHome();
}


// ==========================================
// 起動
// ==========================================

window.addEventListener(
  "load",
  () => {

    if (loadGame()) {

      showHome();

    } else {

      showStart();
    }

    updateStatus();
  }
);
