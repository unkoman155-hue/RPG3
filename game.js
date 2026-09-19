const $ = (id) => document.getElementById(id);

const SAVE_KEY = "yuusha_bounty_rpg_complete_v1";


// ========================================
// プレイヤーデータ
// ========================================

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


// ========================================
// 職業
// ========================================

const jobData = {

  "勇者": {
    hp: 30,
    attack: 10,
    skills: ["斬撃"]
  },

  "ヒーラー": {
    hp: 35,
    attack: 7,
    skills: ["ヒール"]
  },

  "剣士": {
    hp: 30,
    attack: 14,
    skills: ["強斬り"]
  }

};


// ========================================
// スキル
// ========================================

const skillData = {

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


// ========================================
// 敵
// ========================================

const enemies = [

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


const bossEnemy = {

  name: "懸賞金王",

  hp: 500,

  attack: 45,

  xp: 1000,

  money: 1000

};


// ========================================
// 戦闘用
// ========================================

let currentEnemy = null;

let defending = false;

let battleMessages = [];


// ========================================
// ステータス表示
// ========================================

function updateStatus() {

  if (!$("status")) return;

  if (!player.name) {

    $("status").textContent =
      "ゲームを開始してください";

    return;
  }

  $("status").innerHTML =

    `👤 ${player.name}` +
    `　⚔️ ${player.job}` +
    `　⭐ Lv.${player.level}` +

    `<br>` +

    `❤️ ${player.hp}/${player.maxHp}` +
    `　💰 ${player.money}円` +
    `　🏆 懸賞金 ${player.bounty}円`;

}


// ========================================
// 画面
// ========================================

function clearScreen() {

  $("screen").innerHTML = "";

}


// ========================================
// ログ
// ========================================

function clearLog() {

  $("log").innerHTML = "";

}


function writeLog(text) {

  if (!$("log")) return;

  const div = document.createElement("div");

  div.textContent = text;

  $("log").appendChild(div);

  $("log").scrollTop =
    $("log").scrollHeight;

  updateBattleLog();

}


function addBattleMessage(text) {

  battleMessages.push(text);

  writeLog(text);

}


function updateBattleLog() {

  const battleLog =
    $("battleLog");

  if (!battleLog) return;

  battleLog.innerHTML = "";

  battleMessages.forEach((message) => {

    const div =
      document.createElement("div");

    div.textContent = message;

    battleLog.appendChild(div);

  });

  battleLog.scrollTop =
    battleLog.scrollHeight;

}


// ========================================
// セーブ
// ========================================

function saveGame() {

  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify(player)
  );

}


function loadGame() {

  const data =
    localStorage.getItem(SAVE_KEY);

  if (!data) return false;

  try {

    const loaded =
      JSON.parse(data);

    Object.assign(
      player,
      loaded
    );

    return true;

  } catch {

    return false;

  }
