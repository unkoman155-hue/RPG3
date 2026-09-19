"use strict";

/* =========================================
   勇者の懸賞金RPG
   完全版・オフライン
========================================= */

const SAVE_KEY = "yuusha_bounty_rpg_v4";

const player = {
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


/* =========================================
   職業
========================================= */

const jobs = {
  "勇者": {
    hp: 30,
    attack: 10,
    skill: "斬撃"
  },

  "ヒーラー": {
    hp: 35,
    attack: 7,
    skill: "ヒール"
  },

  "剣士": {
    hp: 30,
    attack: 14,
    skill: "強斬り"
  }
};


/* =========================================
   スキル
========================================= */

const skills = {
  "斬撃": {
    power: 35,
    heal: 0
  },

  "ヒール": {
    power: 0,
    heal: 25
  },

  "強斬り": {
    power: 50,
    heal: 0
  },

  "高速切り": {
    power: 65,
    heal: 0
  },

  "回転斬り": {
    power: 80,
    heal: 0
  },

  "超斬撃": {
    power: 120,
    heal: 0
  }
};


/* =========================================
   モンスター
========================================= */

const monsters = [
  {
    name: "怪物猫",
    hp: 20,
    attack: 6,
    xp: 25,
    money: 15,
    area: "草原"
  },

  {
    name: "スライム",
    hp: 28,
    attack: 8,
    xp: 32,
    money: 20,
    area: "草原"
  },

  {
    name: "ゴブリン",
    hp: 40,
    attack: 11,
    xp: 45,
    money: 30,
    area: "草原"
  },

  {
    name: "オオカミ",
    hp: 55,
    attack: 14,
    xp: 65,
    money: 45,
    area: "都市周辺"
  },

  {
    name: "闇の騎士",
    hp: 90,
    attack: 20,
    xp: 110,
    money: 80,
    area: "都市周辺"
  }
];


const boss = {
  name: "懸賞金王",
  hp: 500,
  attack: 45,
  xp: 1000,
  money: 1000
};


/* =========================================
   戦闘データ
========================================= */

let currentEnemy = null;
let defending = false;
let battleMessages = [];


/* =========================================
   共通
========================================= */

function $(id) {
  return document.getElementById(id);
}


function clearScreen() {
  $("screen").innerHTML = "";
}


function updateStatus() {

  if (!player.name) {
    $("status").textContent =
      "ゲームを開始してください";
    return;
  }

  $("status").innerHTML =
    "👤 " + player.name +
    "　⚔️ " + player.job +
    "　⭐ Lv." + player.level +
    "<br>" +
    "❤️ " + player.hp + "/" + player.maxHp +
    "　💰 " + player.money + "円" +
    "　🏆 懸賞金 " + player.bounty + "円";
}


/* =========================================
   ログ
========================================= */

function clearLog() {
  $("log").innerHTML = "";
}


function writeLog(text) {

  const div = document.createElement("div");

  div.textContent = text;

  $("log").appendChild(div);

  $("log").scrollTop =
    $("log").scrollHeight;

  updateBattleLog();
}


function battleLog(text) {

  battleMessages.push(text);

  writeLog(text);
}


function updateBattleLog() {

  const box = $("battleLog");

  if (!box) {
    return;
  }

  box.innerHTML = "";

  battleMessages.forEach(function(text) {

    const div =
      document.createElement("div");

    div.textContent = text;

    box.appendChild(div);

  });

  box.scrollTop =
    box.scrollHeight;
}


/* =========================================
   セーブ
========================================= */

function saveGame() {

  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify(player)
  );

}


function loadGame() {

  const data =
    localStorage.getItem(SAVE_KEY);

  if (!data) {
    return false;
  }

  try {

    const saved =
      JSON.parse(data);

    Object.assign(
      player,
      saved
    );

    return true;

  } catch (error) {

    return false;

  }
}


function deleteSave() {

  localStorage.removeItem(
    SAVE_KEY
  );

  alert(
    "セーブデータを削除しました。"
  );

  location.reload();
}


/* =========================================
   スタート
========================================= */

function showStart() {

  clearScreen();
  clearLog();
  updateStatus();

  let continueButton = "";

  if (
    localStorage.getItem(SAVE_KEY)
  ) {

    continueButton = `
      <button onclick="continueGame()">
        ▶️ 続きから
      </button>
    `;

  }

  $("screen").innerHTML = `

    <div class="center">

      <div class="big">
        ⚔️ 勇者の懸賞金RPG
      </div>

      <p>
        自分だけの冒険者を作って
        冒険を始めよう！
      </p>

      <button onclick="createPlayer()">
        🆕 新しく始める
      </button>

      ${continueButton}

    </div>

  `;

}


/* =========================================
   キャラクター作成
========================================= */

function createPlayer() {

  clearScreen();

  $("screen").innerHTML = `

    <h2>🧑 冒険者を作成</h2>

    <p>
      名前を入力してください。
    </p>

    <input
      id="nameInput"
      maxlength="20"
      placeholder="名前"
    >

    <h3>職業を選んでください</h3>

    <button onclick="finishCreate('勇者')">
      ⚔️ 勇者
    </button>

    <button onclick="finishCreate('ヒーラー')">
      💚 ヒーラー
    </button>

    <button onclick="finishCreate('剣士')">
      🗡️ 剣士
    </button>

  `;

}


function finishCreate(job) {

  const input =
    $("nameInput");

  const name =
    input
      ? input.value.trim()
      : "";

  if (!name) {

    alert(
      "名前を入力してください。"
    );

    return;

  }

  const data =
    jobs[job];

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

  player.skills = [
    data.skill
  ];

  player.inventory = [
    "タガー"
  ];

  player.defeats = 0;

  player.townUnlocked = false;
  player.cityUnlocked = false;

  player.townTrust = 0;
  player.cityTrust = 0;

  player.encyclopedia = [];

  saveGame();

  clearLog();

  writeLog(
    "🎉 " +
    player.name +
    "の冒険が始まった！"
  );

  showHome();
}


/* =========================================
   続きから
========================================= */

function continueGame() {

  if (!loadGame()) {

    alert(
      "セーブデータを読み込めませんでした。"
    );

    return;

  }

  showHome();
}


/* =========================================
   ホーム
========================================= */

function showHome() {

  if (!player.name) {

    showStart();

    return;

  }

  clearScreen();
  updateStatus();

  $("screen").innerHTML = `

    <div class="center">

      <div class="big">
        🏠 ホーム
      </div>

      <p>
        ${player.name}の冒険
      </p>

    </div>

    <div class="card">

      <h3>📊 ステータス</h3>

      <p>
        👤 名前：${player.name}<br>
        ⚔️ 職業：${player.job}<br>
        ⭐ レベル：${player.level}<br>
        ⭐ XP：${player.xp}<br>
        ❤️ HP：${player.hp}/${player.maxHp}<br>
        ⚔️ 攻撃力：${player.attack}<br>
        💰 お金：${player.money}円<br>
        🏆 懸賞金：${player.bounty}円<br>
        🗡️ 武器：${player.weapon}<br>
        👹 討伐数：${player.defeats}
      </p>

    </div>

    <div class="card">

      <h3>🗺️ 冒険</h3>

      <button onclick="showBattle()">
        🌱 草原で戦う
      </button>

      <button onclick="showGacha()">
        🎰 ガチャ
      </button>

    </div>

  `;

}


/* =========================================
   戦闘
========================================= */

function showBattle() {

  if (!player.name) {

    showStart();

    return;

  }

  clearScreen();

  currentEnemy = null;

  defending = false;

  battleMessages = [];

  clearLog();

  $("screen").innerHTML = `

    <div class="center">

      <div class="big">
        🌱 草原
      </div>

      <p>
        モンスターがいるようだ……
      </p>

      <button onclick="startBattle()">
        👹 モンスターを探す
      </button>

      <button onclick="showHome()">
        🏠 ホームへ戻る
      </button>

    </div>

  `;

}


function startBattle() {

  let list =
    monsters.filter(function(enemy) {

      return enemy.area === "草原";

    });

  if (player.cityUnlocked) {

    list = monsters;

  }

  const base =
    list[
      Math
