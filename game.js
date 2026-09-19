// 勇者の懸賞金RPG
// オフライン版

const SAVE_KEY = "yuusha_kenshoukin_rpg_save";

let player = {
  name: "",
  job: "勇者",
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
  cityTrust: 0,
  encyclopedia: []
};

let enemy = null;
let battle = false;

const enemies = [
  {
    name: "怪物猫",
    maxHp: 20,
    attack: 5,
    xp: 25,
    area: "草原"
  },
  {
    name: "凶暴ウルフ",
    maxHp: 35,
    attack: 8,
    xp: 40,
    area: "草原"
  },
  {
    name: "ゴブリン",
    maxHp: 50,
    attack: 12,
    xp: 60,
    area: "町周辺"
  },
  {
    name: "オーガ",
    maxHp: 90,
    attack: 18,
    xp: 100,
    area: "都市周辺"
  }
];

const jobs = {
  勇者: {
    attack: 10,
    skills: ["斬撃"]
  },
  ヒーラー: {
    attack: 7,
    skills: ["ヒール"]
  },
  剣士: {
    attack: 13,
    skills: ["強斬り"]
  }
};

function $(id) {
  return document.getElementById(id);
}

function log(text) {
  const box =
    $("log") ||
    $("message") ||
    $("battleLog") ||
    $("output");

  if (!box) {
    console.log(text);
    return;
  }

  const p = document.createElement("div");
  p.textContent = text;
  box.prepend(p);
}

function saveGame() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(player));
  log("💾 セーブしました！");
}

function loadGame() {
  const data = localStorage.getItem(SAVE_KEY);

  if (!data) {
    log("セーブデータがありません。");
    return;
  }

  try {
    player = JSON.parse(data);
    log("📂 セーブデータを読み込みました！");
    updateUI();
  } catch (e) {
    log("セーブデータを読み込めませんでした。");
  }
}

function deleteSave() {
  localStorage.removeItem(SAVE_KEY);
  location.reload();
}

function updateUI() {
  const values = {
    playerName: player.name,
    name: player.name,
    job: player.job,
    level: player.level,
    hp: `${player.hp}/${player.maxHp}`,
    maxHp: player.maxHp,
    attack: player.attack,
    xp: player.xp,
    money: `${player.money}円`,
    bounty: `${player.bounty}円`,
    weapon: player.weapon,
    defeats: player.defeats
  };

  for (const id in values) {
    const el = $(id);
    if (el) el.textContent = values[id];
  }

  const hpBar = $("hpBar");
  if (hpBar) {
    hpBar.max = player.maxHp;
    hpBar.value = player.hp;
  }

  const xpBar = $("xpBar");
  if (xpBar) {
    xpBar.value = player.xp;
  }
}

function chooseJob(job) {
  if (!jobs[job]) return;

  player.job = job;
  player.attack = jobs[job].attack;
  player.skills = [...jobs[job].skills];

  log(`職業を「${job}」にしました！`);
  updateUI();
  saveGame();
}

function setName() {
  const input = $("nameInput");

  if (!input) return;

  const name = input.value.trim();

  if (!name) {
    log("名前を入力してください！");
    return;
  }

  player.name = name;
  log(`ようこそ、${name}！`);
  updateUI();
  saveGame();
}

function createCharacter() {
  const nameInput = $("nameInput");
  const jobInput = $("jobSelect");

  if (nameInput && nameInput.value.trim()) {
    player.name = nameInput.value.trim();
  }

  if (jobInput && jobs[jobInput.value]) {
    player.job = jobInput.value;
  }

  player.attack = jobs[player.job].attack;
  player.skills = [...jobs[player.job].skills];

  log(`「${player.name || "勇者"}」の冒険が始まった！`);
  updateUI();
  saveGame();
}

function randomEnemy() {
  const available = enemies.filter(e => {
    if (player.cityUnlocked) return true;
    if (player.townUnlocked) return e.area !== "都市周辺";
    return e.area === "草原";
  });

  return available[Math.floor(Math.random() * available.length)];
}

function startBattle() {
  if (battle) {
    log("すでに戦闘中です！");
    return;
  }

  const data = randomEnemy();

  enemy = {
    ...data,
    hp: data.maxHp
  };

  battle = true;

  log(`⚔️ ${enemy.name} が現れた！`);
  updateBattleUI();
}

function updateBattleUI() {
  const enemyName = $("enemyName");
  const enemyHp = $("enemyHp");

  if (enemyName) {
    enemyName.textContent = enemy ? enemy.name : "敵なし";
  }

  if (enemyHp) {
    enemyHp.textContent = enemy
      ? `${enemy.hp}/${enemy.maxHp}`
      : "-";
  }

  updateUI();
}

function attackEnemy() {
  if (!battle || !enemy) {
    log("敵がいません！");
    return;
  }

  let damage = player.attack;

  if (Math.random() < 0.1) {
    damage += 5;
    log("💥 クリティカル！");
  }

  enemy.hp -= damage;

  log(`${damage}ダメージを与えた！`);

  if (enemy.hp <= 0) {
    winBattle();
    return;
  }

  enemyTurn();
  updateBattleUI();
}

function defend() {
  if (!battle || !enemy) {
    log("敵がいません！");
    return;
  }

  log("🛡️ 防御した！");

  const damage = Math.max(
    1,
    Math.floor(enemy.attack / 2)
  );

  player.hp -= damage;

  log(`${damage}ダメージを受けた！`);

  checkPlayerDeath();
  updateBattleUI();
}

function enemyTurn() {
  if (!enemy) return;

  const damage =
    Math.floor(Math.random() * enemy.attack) + 1;

  player.hp -= damage;

  log(`${enemy.name}の攻撃！ ${damage}ダメージ！`);

  checkPlayerDeath();
}

function useSkill() {
  if (!battle || !enemy) {
    log("敵がいません！");
    return;
  }

  if (player.skills.length === 0) {
    log("まだスキルを覚えていません！");
    return;
  }

  const skill = player.skills[0];

  let damage = 0;

  if (skill === "斬撃") {
    damage = 35;
  } else if (skill === "強斬り") {
    damage = 45;
  } else if (skill === "高速切り") {
    damage = 65;
  } else if (skill === "ヒール") {
    player.hp = Math.min(
      player.maxHp,
      player.hp + 15
    );

    log("✨ HPを15回復した！");
    enemyTurn();
    updateBattleUI();
    return;
  }

  enemy.hp -= damage;

  log(`✨ ${skill}！ ${damage}ダメージ！`);

  if (enemy.hp <= 0) {
    winBattle();
    return;
  }

  enemyTurn();
  updateBattleUI();
}

function inspectEnemy() {
  if (!enemy) {
    log("調べる敵がいません。");
    return;
  }

  log(
    `🔎 ${enemy.name} / HP ${enemy.hp}/${enemy.maxHp} / 攻撃 ${enemy.attack}`
  );
}

function flee() {
  if (!battle) {
    log("戦闘中ではありません。");
    return;
  }

  if (Math.random() < 0.7) {
    log("🏃 逃げ切った！");
    battle = false;
    enemy = null;
  } else {
    log("逃げられなかった！");
    enemyTurn();
  }

  updateBattleUI();
}

function winBattle() {
  const defeatedEnemy = enemy;

  battle = false;
  enemy = null;

  player.defeats++;
  player.xp += defeatedEnemy.xp;

  const money = Math.floor(
    Math.random() * 30
  ) + 10;

  player.money += money;

  player.bounty += 10;

  log(`${defeatedEnemy.name}を倒した！`);
  log(`${defeatedEnemy.xp} XPを獲得した！`);
  log(`${money}円を手に入れた！`);
  log(`${defeatedEnemy.name}を落とした！`);

  if (!player.encyclopedia.includes(defeatedEnemy.name)) {
    player.encyclopedia.push(defeatedEnemy.name);
  }

  checkUnlocks();
  checkLevelUp();

  updateBattleUI();
  saveGame();
}

function checkPlayerDeath() {
  if (player.hp > 0) return;

  log("💀 力尽きた……");

  player.hp = player.maxHp;
  player.money = Math.max(
    0,
    Math.floor(player.money / 2)
  );

  log("町に戻された！");
  updateUI();
  saveGame();

  battle = false;
  enemy = null;
}

function checkLevelUp() {
  const required = (player.level + 1) * 50;

  if (player.xp < required) return;

  player.xp -= required;
  player.level++;

  log(`🎉 レベル${player.level}になった！`);

  const choice = prompt(
    "レベルアップ！\n\n" +
    "1：HP +5\n" +
    "2：攻撃力 +20\n" +
    "3：スキルを1つ覚える"
  );

  if (choice === "1") {
    player.maxHp += 5;
    player.hp = player.maxHp;
    log("❤️ 最大HPが5増えた！");
  } else if (choice === "2") {
    player.attack += 20;
    log("⚔️ 攻撃力が20増えた！");
  } else if (choice === "3") {
    unlockSkill();
  } else {
    log("今回はHPを5増やした！");
    player.maxHp += 5;
    player.hp = player.maxHp;
  }

  updateUI();
  saveGame();
}

function unlockSkill() {
  const skills = [
    "高速切り",
    "回転斬り",
    "超斬撃"
  ];

  const skill = skills.find(
    s => !player.skills.includes(s)
  );

  if (!skill) {
    log("覚えられる新しいスキルがありません。");
    return;
  }

  player.skills.push(skill);

  log(`✨ ${skill}を覚えた！`);
}

function checkUnlocks() {
  if (
    !player.townUnlocked &&
    player.defeats >= 3
  ) {
    player.townUnlocked = true;
    player.townTrust = 15;

    log("🏘️ 町が解放された！");
    log("町の信頼度：15");
  }

  if (
    !player.cityUnlocked &&
    player.defeats >= 8
  ) {
    player.cityUnlocked = true;
    player.cityTrust = 50;

    log("🏙️ 都市が解放された！");
    log("都市の信頼度：50");
  }
}

function healAtTown() {
  if (!player.townUnlocked) {
    log("まだ町が解放されていません。");
    return;
  }

  player.hp = player.maxHp;

  log("🏠 HPが全回復した！");
  updateUI();
  saveGame();
}

function shop() {
  if (!player.townUnlocked) {
    log("店はまだ利用できません。");
    return;
  }

  if (player.money < 100) {
    log("💰 お金が足りません！");
    return;
  }

  player.money -= 100;
  player.attack += 5;

  log("🛒 武器を購入！");
  log("攻撃力が5上がった！");

  updateUI();
  saveGame();
}

function gacha() {
  if (player.money < 50) {
    log("💰 ガチャには50円必要です！");
    return;
  }

  player.money -= 50;

  const result =
    Math.random() < 0.5
      ? "タガー"
      : "剣";

  player.inventory.push(result);

  if (result === "タガー") {
    log("🎰 タガーを獲得！");
    log("15ダメージ＋出血効果の武器！");
  } else {
    log("🎰 剣を獲得！");
    log("5ダメージの武器！");
  }

  updateUI();
  saveGame();
}

function showSkills() {
  if (player.skills.length === 0) {
    alert("覚えているスキルはありません。");
    return;
  }

  alert(
    "覚えているスキル\n\n" +
    player.skills.join("\n")
  );
}

function showStatus() {
  alert(
    `名前：${player.name || "未設定"}\n` +
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

function showEncyclopedia() {
  if (player.encyclopedia.length === 0) {
    alert("まだ敵を登録していません。");
    return;
  }

  alert(
    "📖 モンスター図鑑\n\n" +
    player.encyclopedia.join("\n")
  );
}

function showInventory() {
  alert(
    "🎒 バッグ\n\n" +
    (player.inventory.length
      ? player.inventory.join("\n")
      : "空っぽ")
  );
}

function randomGift() {
  if (!player.townUnlocked) {
    log("まだ町に入れません。");
    return;
  }

  const gifts = [
    "10円",
    "回復薬",
    "タガー"
  ];

  const gift =
    gifts[Math.floor(Math.random() * gifts.length)];

  if (gift === "10円") {
    player.money += 10;
  } else if (gift === "回復薬") {
    player.hp = Math.min(
      player.maxHp,
      player.hp + 10
    );
  } else {
    player.inventory.push("タガー");
  }

  log(`🎁 通りすがりの人から${gift}をもらった！`);

  updateUI();
  saveGame();
}

function resetGame() {
  if (
    !confirm(
      "本当に最初からやり直しますか？"
    )
  ) {
    return;
  }

  localStorage.removeItem(SAVE_KEY);
  location.reload();
}

window.addEventListener("load", () => {
  const saved = localStorage.getItem(SAVE_KEY);

  if (saved) {
    try {
      player = JSON.parse(saved);
    } catch (e) {
      console.log("新規ゲームとして開始");
    }
  }

  updateUI();
  log("⚔️ 勇者の懸賞金RPGへようこそ！");
});
