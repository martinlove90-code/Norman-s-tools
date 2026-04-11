# Shooter Game HTML 檢查報告與改進建議

## 1. HTML 標記語意化
- **目前情況**：`<body>` 直接包含 `#start-screen`、 `<canvas>` 与 `#game-info`，未使用完整語意化元素。
- **建議**：
  - 使用 `<header>` 包裹說明文字與按鈕群組。
  - 使用 `<main>` 包裹 `<canvas>` 作為主要遊戲區域。
  - 使用 `<section>` 包裝即時資訊（分數、生命）。
  - 使用 `<footer>`（如需）放置額外資訊。
- **實作狀況**：✅ 已實作
- **範例結構**：
  ```html
  <body>
    <header>
      <h1>飛空戰鬥機 - Shooter Game</h1>
      <div id="start-screen">
        <p>說明：使用左右箭頭鍵或 A/D 移動，空白鍵發射子彈。</p>
        <div id="game-controls">
          <button id="start-button">開始遊戲</button>
          <button id="pause-button" disabled>暫停</button>
        </div>
        <div id="virtual-controls">
          <button id="btn-left">←</button>
          <button id="btn-right">→</button>
        </div>
      </header>
      <main>
        <canvas id="gameCanvas" aria-label="射擊遊戲畫布" role="img" tabindex="0"></canvas>
      </main>
      <section id="game-info">
        <div id="score-display" aria-live="polite">分數: 0</div>
        <div id="lives-display" aria-live="polite">生命: ❤️❤️❤️</div>
      </section>
      <footer>
        © 2026 Your Company
      </footer>
    </header>
    <script src="shooter_game.js" defer></script>
  </body>
  ```

## 2. Canvas 可訪問性
- **目前情況**：提供fallback文字「瀏覽器不支援 Canvas 元素.」
- **建議**：
  - 為 `<canvas>` 加上 `aria-label="射擊遊戲畫布"`、`role="img"`、`tabindex="0"`。
  - 使用 `aria-describedby` 指向說明文字，提升螢幕閱讀器理解。
  - 示例：`<canvas id="gameCanvas" aria-label="射擊遊戲畫布" role="img" tabindex="0" aria-describedby="canvas-note"></canvas>`
    `<div id="canvas-note" class="sr-only">此為互動式射擊遊戲畫布。</div>`

## 3. SEO 與 Meta 資訊
- **目前情況**：僅有 `<title>`，未提供 `<meta name="description">`。
- **建議**：
  - 加入描述性 meta description，例如：
    ```html
    <meta name="description" content="免費線上射擊遊戲，操控飛行戰機擊毀敵機，收集分數與獎勵。">
    ```
  - 若有圖示或圖片，可加入 Open Graph / Twitter Card 標籤。

## 4. CSS 連結優化
- **目前情況**：`<link rel="stylesheet" href="shooter_game.css">`.
- **建議**：
  - 加入 `preload` 以提升載入效能：
    ```html
    <link rel="preload" href="shooter_game.css" as="style" onload="this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="shooter_game.css"></noscript>
    ```

## 5. JavaScript 載入方式
- **目前情況**：`<script src="shooter_game.js"></script>`.
- **建議**：
  - 加上 `defer` 讓腳本在解析完 HTML 後執行，避免阻塞畫面：
    ```html
    <script src="shooter_game.js" defer></script>
    ```
  - 若使用模組化程式碼，可改用 `type="module"`.

## 6. ID / Class 命名規範
- **目前情況**：`id="gameCanvas"`, `id="score-display"` , `id="lives-display"`.
- **建議**：
  - 保持命名簡潔且具語意，避免與其他模組衝突。
  - 可使用 BEM 或類似命名法，例如 `class="game-canvas"`、`class="score-display"`.

## 7. ARIA Live Region（可訪問性）
- **目前情況**：分數與生命顯示於一般 `<div>`.
- **建議**：
  - 為重要的即時資訊加上 `aria-live="polite"`，讓螢幕閱讀器能即時讀出變化：
    ```html
    <div id="score-display" aria-live="polite">分數: 0</div>
    <div id="lives-display" aria-live="polite">生命: ❤️❤️❤️</div>
    ```

## 8. 鍵盤可訪問性
- **目前情況**：未提供鍵盤介入方式.
- **建議**：
  - 讓畫布可聚焦（`tabindex="0"`）以便鍵盤操作。
  - 提供焦點樣式（CSS `:focus-visible`）以顯示焦點。
  - 若遊戲需要鍵盤控制，確保對應的事件處理函數已綁定。

## 9. 錯誤處理與 Fallback
- **目前情況**：只有 fallback 文字在 `<canvas>` 內.
- **建議**：
  - 加入 `<noscript>` 區塊提供無 JavaScript 時的替代內容：
    ```html
    <noscript>
      為了正常遊玩，請啟用 JavaScript。
    </noscript>
    ```
  - 確認錯誤訊息友好，並提供重新載入或說明的選項。

## 10. 檔案結構與路徑
- **目前情況**：CSS 與 JS 檔案的相對路徑正確.
- **建議**：
  - 確保在未來新增資源時保持相對路徑一致性，避免路徑混亂。
  - 若專案擴大，可考慮建立 `assets/css/`、`assets/js/` 子目錄。

## 11. 行動裝置視口優化
- **目前情況**：已有 `<meta name="viewport" content="width=device-width, initial-scale=1.0">`.
- **建議**：
  - 加入 `user-scalable=no` 或 `minimal-ui` 以提升行動裝置體驗（視需求而定）。
  - 確認觸控區域足夠大，避免誤觸。

## 12. 改進建議文件
- **已整理**：上述建議已整理在 `shooter_game_review.md`，可作為開發者參考手冊。
- **如需範例程式碼**：可在 `shooter_game.html` 或 `shooter_game.js` 中加入相應的修改，例如：
  - 新增「開始遊戲」與「暫停」按鈕的 HTML 結構。
  - 實作虛擬方向鍵的觸控事件處理。
  - 設定自動子彈發射與暫停/繼續切換功能。

---

**結論**：以上建議可提升 `shooter_game.html` 的語意化、可訪問性、SEO 以及效能。實作時可依優先順序逐一調整，特別是無障礙設施與效能優化是最關鍵的兩大面向。
