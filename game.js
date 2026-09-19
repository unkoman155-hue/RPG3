function adminMode() {
  const code = prompt("🔐 管理者コードを入力してください");

  if (code !== "3487") {
    alert("❌ 管理者コードが違います");
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

  writeLog("👑 管理者モードを解放しました！");
  writeLog("✨ 全スキル解放！");
  writeLog("📈 レベル99！");
  writeLog("🏙️ 町・都市を解放！");

  saveGame();
  updateStatus();
  showHome();
}
