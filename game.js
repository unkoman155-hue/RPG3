const SAVE_KEY = "yuusha_kenshoukin_rpg";

let player = {
  name: "",
  job: "",
  level: 0,
  hp: 30,
  maxHp: 30,
  attack: 10,
  xp: 0,
  money: 250,
  bounty: 0,
  weapon: "タガー",
  skills: [],
  inventory: ["タガー"],
  defeats: 0,
  townUnlocked: false,
  cityUnlocked: false,
  townTrust: 0,
  cityTrust: 0
};

let enemy = null;
let defending = false;

const enemies = [
  {
    name: "怪物猫",
    hp: 20,
    attack: 5,
    xp: 25
  },
  {
    name: "凶暴ウルフ",
    hp: 30,
    attack: 7,
    xp: 35
  },
  {
    name: "ゴブリン",
    hp: 45,
    attack: 10,
    xp: 50
  },
  {
    name: "オーガ",
    hp: 80,
    attack: 15,
    xp: 100
  }
];

function saveGame() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(player));
}

function loadGame() {
  const data = localStorage.getItem(SAVE_KEY);

  if (!data) return false;

  try {
    player = JSON.parse(data);
    return true;
  } catch {
    return false;
  }
}

function writeLog(text) {
  const log = document.getElementById("log");

  if (!log) return;

  const line = document.createElement("div");
  line.textContent = text;

  log.prepend(line);
}

function clearScreen() {
  document.getElementById("screen").innerHTML = "";
}

function button(text, action) {
  const b = document.createElement("button");

  b.textContent = text;
  b.onclick = action;

  return b;
}

function updateStatus() {
  const status = document.getElementById("status");

  if (!status) return;

  if (!player.name) {
    status.textContent = "";
    return;
  }

  status.innerHTML =
    `👤 ${player.name}　` +
    `職業：${player.job}　` +
    `Lv.${player.level}　` +
    `❤️ ${player.hp}/${player.maxHp}　` +
    `💰 ${player.money}円　` +
    `🏆 ${player.bounty}円`;
}

/* =========================
   最初の画面
========================= */

function showStart() {
  clearScreen();

  const screen = document.getElementById("screen");

  screen.innerHTML = `
    <h2>⚔️ 勇者の懸賞金RPG</h2>

    <p>冒険を始める前に名前を決めよう！</p>

    <input
      id="nameInput"
      type="text"
      maxlength="12"
      placeholder="名前を入力"
    >

    <h3>職業を選択</h3>

    <div id="jobButtons"></div>
  `;

  const jobs = [
    ["勇者", "⚔️", 10],
    ["ヒーラー", "❤️", 7],
    ["剣士", "🗡️", 13]
  ];

  const box = document.getElementById("jobButtons");

  jobs.forEach(job => {
    const b = button(
      `${job[1]} ${job[0]}（攻撃力 ${job[2]}）`,
      () => startGame(job[0])
    );

    box.appendChild(b);
    box.appendChild(document.createElement("br"));
  });

  updateStatus();
}

/* =========================
   ゲーム開始
========================= */

function startGame(job) {
  const name =
    document.getElementById("nameInput").value.trim();

  if (!name) {
    alert("名前を入力してください！");
    return;
  }

  player.name = name;
  player.job = job;

  if (job === "勇者") {
    player.attack = 10;
    player.skills = ["斬撃"];
  }

  if (job === "ヒーラー") {
    player.attack = 7;
    player.skills = ["ヒール"];
  }

  if (job === "剣士") {
    player.attack = 13;
    player.skills = ["強斬り"];
  }

  saveGame();

  writeLog(
    `⚔️ ${player.name}の冒険が始まった！`
  );

  showHome();
}

/* =========================
   ホーム
========================= */

function showHome() {
  if (!player.name) {
    showStart();
    return;
  }

  clearScreen();

  const screen = document.getElementById("screen");

  screen.innerHTML = `
    <h2>🏠 ホーム</h2>

    <p>
      ようこそ、${player.name}！
    </p>

    <p>
      職業：${player.job}<br>
      レベル：${player.level}<br>
      HP：${player.hp}/${player.maxHp}<br>
      攻撃力：${player.attack}<br>
      XP：${player.xp}<br>
      お金：${player.money}円<br>
      懸賞金：${player.bounty}円<br>
      討伐数：${player.defeats}
    </p>

    <hr>

    <button onclick="showBattle()">⚔️ モンスターと戦う</button>
    <button onclick="showStatus()">📊 ステータス</button>
  `;

  updateStatus();
}

/* =========================
   戦闘
========================= */

function showBattle() {
  clearScreen();

  const screen = document.getElementById("screen");

  if (enemy) {
    showBattleScreen();
    return;
  }

  screen.innerHTML = `
    <h2>⚔️ 戦う</h2>

    <p>草原へ向かう……</p>

    <button id="encounterBtn">🌿 敵を探す</button>
  `;

  document.getElementById("encounterBtn").onclick =
    startBattle;

  updateStatus();
}

function startBattle() {
  const base =
    enemies[Math.floor(Math.random() * enemies.length)];

  enemy = {
    name: base.name,
    hp: base.hp,
    maxHp: base.hp,
    attack: base.attack,
    xp: base.xp
  };

  defending = false;

  writeLog(
    `⚠️ ${enemy.name}が現れた！`
  );

  showBattleScreen();
}

function showBattleScreen() {
  clearScreen();

  const screen = document.getElementById("screen");

  screen.innerHTML = `
    <h2>⚔️ 戦闘</h2>

    <h3>${enemy.name}</h3>

    <p>
      ❤️ HP：${enemy.hp}/${enemy.maxHp}
    </p>

    <div id="battleButtons"></div>
  `;

  const box =
    document.getElementById("battleButtons");

  box.appendChild(
    button("⚔️ コウゲキ", attackEnemy)
  );

  box.appendChild(
    button("🛡️ ボウギョ", defend)
  );

  box.appendChild(
    button("✨ スキル", useSkill)
  );

  box.appendChild(
    button("🔎 シラベル", inspectEnemy)
  );

  box.appendChild(
    button("🏃 ニゲル", flee)
  );

  updateStatus();
}

function attackEnemy() {
  if (!enemy) return;

  let damage = player.attack;

  if (Math.random() < 0.1) {
    damage += 5;
    writeLog("💥 クリティカル！");
  }

  enemy.hp -= damage;

  writeLog(
    `${enemy.name}に${damage}ダメージ！`
  );

  if (enemy.hp <= 0) {
    victory();
    return;
  }

  enemyAttack();

  if (enemy) {
    showBattleScreen();
  }
}

function defend() {
  if (!enemy) return;

  defending = true;

  writeLog("🛡️ 防御した！");

  enemyAttack();

  if (enemy) {
    showBattleScreen();
  }
}

function useSkill() {
  if (!enemy) return;

  if (player.skills.length === 0) {
    writeLog("使えるスキルがない！");
    return;
  }

  const skill = player.skills[0];

  if (skill === "ヒール") {
    player.hp = Math.min(
      player.maxHp,
      player.hp + 15
    );

    writeLog("❤️ HPを15回復！");
  } else {
    let damage = 35;

    if (skill === "強斬り") {
      damage = 40;
    }

    if (skill === "高速切り") {
      damage = 65;
    }

    enemy.hp -= damage;

    writeLog(
      `✨ ${skill}！ ${damage}ダメージ！`
    );

    if (enemy.hp <= 0) {
      victory();
      return;
    }
  }

  enemyAttack();

  if (enemy) {
    showBattleScreen();
  }
}

function inspectEnemy() {
  if (!enemy) return;

  writeLog(
    `🔎 ${enemy.name}：HP ${enemy.hp}/${enemy.maxHp}・攻撃 ${enemy.attack}`
  );
}

function flee() {
  if (!enemy) return;

  if (Math.random() < 0.7) {
    writeLog("🏃 逃げ切った！");
    enemy = null;
    showBattle();
  } else {
    writeLog("😱 逃げられない！");
    enemyAttack();

    if (enemy) {
      showBattleScreen();
    }
  }
}

function enemyAttack() {
  if (!enemy) return;

  let damage =
    Math.floor(Math.random() * enemy.attack) + 1;

  if (defending) {
    damage = Math.max(
      1,
      Math.floor(damage / 2)
    );

    defending = false;
  }

  player.hp -= damage;

  writeLog(
    `${enemy.name}の攻撃！ ${damage}ダメージ！`
  );

  if (player.hp <= 0) {
    player.hp = player.maxHp;

    writeLog("💀 力尽きた！");
    writeLog("🏠 ホームへ戻された……");

    enemy = null;

    saveGame();
    showHome();
  }

  updateStatus();
}

/* =========================
   勝利
========================= */

function victory() {
  const defeated = enemy;

  enemy = null;

  player.defeats++;
  player.xp += defeated.xp;

  const money =
    Math.floor(Math.random() * 21) + 10;

  player.money += money;
  player.bounty += 10;

  writeLog(
    `🎉 ${defeated.name}を倒した！`
  );

  writeLog(
    `${defeated.xp} XPを獲得した！`
  );

  writeLog(
    `💰 ${money}円を獲得した！`
  );

  writeLog(
    `${defeated.name}がアイテムを落とした！`
  );

  checkUnlock();

  checkLevelUp();

  saveGame();

  showBattle();
}

/* =========================
   レベルアップ
========================= */

function checkLevelUp() {
  const required =
    (player.level + 1) * 50;

  if (player.xp < required) return;

  player.xp -= required;
  player.level++;

  writeLog(
    `🎉 レベル${player.level}になった！`
  );

  const choice = prompt(
    "レベルアップ！\n\n" +
    "1：最大HP +5\n" +
    "2：攻撃力 +20\n" +
    "3：新しいスキルを覚える"
  );

  if (choice === "2") {
    player.attack += 20;
    writeLog("⚔️ 攻撃力が20上がった！");
  } else if (choice === "3") {
    unlockSkill();
  } else {
    player.maxHp += 5;
    player.hp = player.maxHp;
    writeLog("❤️ 最大HPが5上がった！");
  }

  updateStatus();
}

function unlockSkill() {
  const skills = [
    "高速切り",
    "回転斬り",
    "超斬撃"
  ];

  const skill =
    skills.find(s =>
      !player.skills.includes(s)
    );

  if (!skill) {
    writeLog("覚えられるスキルがない！");
    return;
  }

  player.skills.push(skill);

  writeLog(
    `✨ ${skill}を覚えた！`
  );
}

/* =========================
   町
========================= */

function checkUnlock() {
  if (
    !player.townUnlocked &&
    player.defeats >= 3
  ) {
    player.townUnlocked = true;
    player.townTrust = 15;

    writeLog(
      "🏘️ 町が解放された！"
    );
  }

  if (
    !player.cityUnlocked &&
    player.defeats >= 8
  ) {
    player.cityUnlocked = true;
    player.cityTrust = 50;

    writeLog(
      "🏙️ 都市が解放された！"
    );
  }
}

function showTown() {
  clearScreen();

  if (!player.townUnlocked) {
    document.getElementById("screen").innerHTML = `
      <h2>🏘️ 町</h2>
      <p>まだ町は解放されていない。</p>
      <p>モンスターを3体倒そう！</p>
    `;

    return;
  }

  document.getElementById("screen").innerHTML = `
    <h2>🏘️ 町</h2>

    <p>信頼度：${player.townTrust}</p>

    <button onclick="healTown()">
      ❤️ 回復する
    </button>

    <button onclick="townGift()">
      🎁 町の人に話しかける
    </button>
  `;
}

function healTown() {
  player.hp = player.maxHp;

  writeLog("❤️ HPが全回復した！");

  saveGame();
  updateStatus();
}

function townGift() {
  player.money += 20;

  writeLog(
    "🎁 町の人から20円もらった！"
  );

  saveGame();
  updateStatus();
}

/* =========================
   都市
========================= */

function showCity() {
  clearScreen();

  if (!player.cityUnlocked) {
    document.getElementById("screen").innerHTML = `
      <h2>🏙️ 都市</h2>
      <p>まだ都市は解放されていない。</p>
      <p>モンスターを8体倒そう！</p>
    `;

    return;
  }

  document.getElementById("screen").innerHTML = `
    <h2>🏙️ 都市</h2>

    <p>信頼度：${player.cityTrust}</p>

    <p>強力な敵が出現する場所。</p>

    <button onclick="startCityBattle()">
      ⚔️ 都市周辺を探索
    </button>
  `;
}

function startCityBattle() {
  const strong = enemies.slice(2);

  const base =
    strong[Math.floor(Math.random() * strong.length)];

  enemy = {
    ...base,
    maxHp: base.hp
  };

  writeLog(
    `⚠️ ${enemy.name}が現れた！`
  );

  showBattleScreen();
}

/* =========================
   ボス
========================= */

function showBoss() {
  clearScreen();

  document.getElementById("screen").innerHTML = `
    <h2>👑 ボス</h2>

    <p>巨大な敵が待ち構えている……。</p>

    <button onclick="startBoss()">
      👑 ボスに挑む
    </button>
  `;
}

function startBoss() {
  enemy = {
    name: "懸賞金の魔王",
    hp: 150,
    maxHp: 150,
    attack: 20,
    xp: 200
  };

  writeLog(
    "👑 懸賞金の魔王が現れた！"
  );

  showBattleScreen();
}

/* =========================
   ガチャ
========================= */

function showGacha() {
  clearScreen();

  document.getElementById("screen").innerHTML = `
    <h2>🎰 ガチャ</h2>

    <p>1回50円</p>
    <p>現在：${player.money}円</p>

    <button onclick="gacha()">
      🎰 ガチャを回す
    </button>
  `;
}

function gacha() {
  if (player.money < 50) {
    writeLog("💰 お金が足りない！");
    return;
  }

  player.money -= 50;

  const result =
    Math.random() < 0.5
      ? "タガー"
      : "剣";

  player.inventory.push(result);

  writeLog(
    `🎰 ${result}を獲得した！`
  );

  saveGame();
  showGacha();
}

/* =========================
   バッグ
========================= */

function showBag() {
  clearScreen();

  document.getElementById("screen").innerHTML = `
    <h2>🎒 バッグ</h2>

    <p>
      ${player.inventory.length
        ? player.inventory.join("<br>")
        : "空っぽ"}
    </p>

    <p>装備中：${player.weapon}</p>
  `;
}

/* =========================
   設定
========================= */

function showSettings() {
  clearScreen();

  document.getElementById("screen").innerHTML = `
    <h2>⚙️ 設定</h2>

    <button onclick="showSkills()">
      ✨ スキル一覧
    </button>

    <button onclick="showStatus()">
      📊 レベル・ステータス確認
    </button>

    <button onclick="saveGame(); writeLog('💾 セーブしました！')">
      💾 セーブ
    </button>

    <button onclick="resetGame()">
      🗑️ セーブデータ削除
    </button>
  `;
}

function showSkills() {
  alert(
    player.skills.length
      ? "✨ スキル\n\n" +
        player.skills.join("\n")
      : "スキルなし"
  );
}

function showStatus() {
  alert(
    `名前：${player.name}\n` +
    `職業：${player.job}\n` +
    `Lv：${player.level}\n` +
    `HP：${player.hp}/${player.maxHp}\n` +
    `攻撃力：${player.attack}\n` +
    `XP：${player.xp}\n` +
    `お金：${player.money}円\n` +
    `懸賞金：${player.bounty}円\n` +
    `討伐数：${player.defeats}`
  );
}

function resetGame() {
  if (!confirm("本当にデータを削除しますか？")) {
    return;
  }

  localStorage.removeItem(SAVE_KEY);

  location.reload();
}

/* =========================
   起動
========================= */

window.addEventListener("load", () => {
  const loaded = loadGame();

  updateStatus();

  if (loaded && player.name) {
    writeLog(
      `📂 ${player.name}のデータを読み込みました！`
    );

    showHome();
  } else {
    showStart();
  }
});
