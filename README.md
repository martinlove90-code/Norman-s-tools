# 🚀 安姆的專屬控制台 (Ammu's Dashboard)

這是一個基於純前端技術 (Vanilla Web) 打造的個人專屬數位控制台與隨機決策工具箱。
無論是面臨選擇困難、需要隨機靈感，或是單純想試試今天的手氣，這裡都有對應的工具可以幫忙！

## 🌟 專案特色 (Features)

目前系統已上線 6 款實用的隨機互動工具，所有工具皆具備**流暢的動畫特效**與**完美的手機版 RWD 適配**：

1. **🎯 好運抽獎轉盤 (`Randomtool01.html`)**
   - 快速輸入選項，交給機率決定下一步。
   - 具備 `LocalStorage` 自動記憶功能，下次開啟無需重新輸入。
   - 即時連動今天的日期作為專屬標題。

2. **🎚️ 視覺化機率轉盤 (`WeightedWheel.html`)**
   - 進階版轉盤，可透過「拉桿」即時動態調整每個選項的機率權重。
   - 自動計算並顯示各區塊的精準百分比。
   - 適合機率不對等的抽卡模擬或特殊決策。

3. **🎰 大樂透隨機選號 (`LottoTool.html`)**
   - 一鍵生成 6 個 `1~49` 的不重複幸運號碼。
   - 帶有懸念感的「彈跳翻牌」開獎視覺特效。

4. **🎁 驚喜洞洞樂 (`PunchBoard.html`)**
   - 盲盒抽卡系統，抽過的選項不會重複。
   - 支援自訂「洞洞數量 (2~100)」與「開獎文字 (如：中！、銘謝)」。
   - 帶有流暢的 3D 卡牌翻轉特效。
   
5. **中獎洞洞樂 (`PunchBoardLucky.html`)**
    - 在原有翻牌遊戲基礎上，允許自訂「中獎卡片數」(上限不超過總卡片數)。
    - 抽中卡片會顯示自訂的「中獎文字」並套用綠色脈衝特效，未中獎則保持空白。
    - 同樣支援卡片總數與中獎文字的自訂設定，並會自動儲存至 localStorage。

5. **🪜 命運爬梯子 (`LadderGame.html`)**
    - 經典的阿彌陀籤遊戲。
    - 具備自動防撞線演算法與動態路徑追蹤動畫。
    - 支援「🙈 盲抽模式」，點擊瞬間才揭露橫線，懸念拉滿。

6. **🚀 飛空戰鬥機射擊遊戲 (`shooter_game.html`)**
    - 操控飛行戰機擊毀敵機，收集分數與獎勵。
    - 支援觸控雙手操作，左右移動按鈕位於螢幕下方。
    - 點擊發射按鈕切換連續發射/停止狀態。

## 🛠️ 技術棧 (Tech Stack)

本專案採用最輕量、無依賴的純前端技術構建，無需任何後端伺服器即可完美運行：
- **HTML5**: 語義化架構。
- **CSS3**: 使用 CSS Grid/Flexbox 進行 RWD 排版，並結合 `@keyframes` 與 `transition` 實現大量 UI 動畫。
- **JavaScript (ES6+)**: 負責核心邏輯、Canvas 畫布渲染 (轉盤與梯子繪製) 與 `requestAnimationFrame` 物理動畫運算。
- **Data Storage**: 使用 `window.localStorage` 實現無資料庫的本地個人化記憶功能。
- **API Integration**: 首頁整合 `CounterAPI`，實現跨裝置的真實雲端造訪計數器。

## 📖 開發與維護指南 (Maintenance Guide)

給未來的自己（或其他開發者）的維護備忘錄：

### 1. 如何修改現有工具的預設值？
所有的預設選項與參數都寫在每個 HTML 檔案的 `<script>` 區塊最上方。你可以直接使用編輯器搜尋 `const defaultOptions` 或 `let TOTAL_CARDS` 來進行修改。

### 2. 如何擴充新的工具模組？
如果你寫了一個新的網頁工具（例如 `NewTool.html`），請依照以下步驟將它整合進控制台：
1. 將 `NewTool.html` 放入專案根目錄。
2. 在新工具的 UI 中，加入返回首頁的按鈕：`<a href="index.html" class="back-link">← 返回控制台</a>`
3. 打開 `index.html`，找到 `<div class="grid-container">`。
4. 將其中一個「建置中」的區塊替換為新工具的連結與文案：
   ```html
   <a href="NewTool.html" class="card">
       <span class="status-badge status-active">Online</span>
       <div class="icon">✨</div>
       <h2>新工具名稱</h2>
       <p>這裡寫上新工具的簡介...</p>
   </a>
