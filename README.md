# 今天穿什麼？ ¿Qué me pongo hoy?

聽天氣預報，幫角色選衣服。單一 HTML（`index.html`），給西語學生練天氣、溫度、衣物、「會下雨」「記得…」等說法。

- 四種聽法：新聞氣象、手機提醒、推播、親友訊息（每題隨機）
- 三關：①一種天氣（用「很冷／涼爽」等字）②加溫度與降雨機率 ③一天裡天氣會變（早上／下午／晚上）
- 每局 10 題；一次答對 10 分、第二次答對 6 分、看字扣 3 分；排行榜分數＝總分 × 關卡
- 男／女角色；衣服與角色都是程式畫的（無印風）
- 設定沿用 `hanziGames.settings`（繁簡、西／英／純中文、拼音／注音／兩種／不顯示、語速）
- 拼音用數字調存放，畫面轉聲調符號與注音（台灣讀音）

## 上線前要做
1. 在 memorma-24dab 貼 `firestore-rules.txt` 的規則（排行榜集合 `weatherOutfitBoard`）。
2. 後台排行榜總覽的登記表加一筆；分享區卡片補 desc／guide。
3. 字詞一致性檢查（game-kit）要不要加進來，再討論。

## 測試
- `node tests/logic_test.js`：注音轉換、句子零件、穿衣規則、每種題目都有解
- `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 tests/browser_test.py`：整局流程、設定、截圖
