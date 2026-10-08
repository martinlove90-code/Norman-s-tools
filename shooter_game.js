const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size based on screen dimensions, but keep reasonable limits
function resizeCanvas() {
    // Calculate canvas size based on window size, with max limits
    const maxWidth = 800;
    const maxHeight = 500;
    const margin = 20; // Space around canvas
    
    let width = window.innerWidth - margin * 2;
    let height = window.innerHeight - margin * 2 - 150; // Reserve space for controls
    
    // Apply maximum limits
    if (width > maxWidth) width = maxWidth;
    if (height > maxHeight) height = maxHeight;
    
    // Ensure minimum size
    if (width < 100) width = 100;
    if (height < 200) height = 200;
    
    canvas.width = width;
    canvas.height = height;
    if (player) {
        player.x = Math.max(0, Math.min(player.x, canvas.width - player.width));
        player.y = canvas.height - player.height;
    }
}

// The first resize runs before the player is created.
let player = null;
resizeCanvas();

// Update canvas size when window is resized
window.addEventListener('resize', resizeCanvas);

// Game state
let score = 0;
let lives = 3;
let isGameOver = false;
let isPaused = false;
let lastTime = 0;
let gameLoopInterval = null; // declare loop interval variable

// Player
player = {
    x: (canvas.width - 50) / 2,
    y: canvas.height - 50,
    width: 50,
    height: 50,
    speed: 5,
    // color: '#00ff00' // no longer used for drawing
};

// Bullets
let bullets = [];
let bulletIntervalId = null;
const BULLET_INTERVAL = 150; // ms between bullets (auto-fire)

// Enemies
let enemies = [];
let lastSpawnTime = 0;
const SPAWN_INTERVAL = 2000; // ms base interval (reduced spawn density)
let speedBoost = 0; // will increase over time

// Input tracking
let keys = {};
let isGameRunning = false;

// ==== Drawing functions ====
function drawPlayer() {
    // Draw emoji plane
    ctx.font = '48px Arial';
    ctx.fillStyle = '#00ff00'; // green emoji
    const emoji = '✈️'; // plane emoji
    const textWidth = ctx.measureText(emoji).width;
    ctx.fillText(emoji, player.x + player.width / 2 - textWidth / 2, player.y + player.height - 5);
}

function drawBullet(bullet) {
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
}

function drawEnemy(enemy) {
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
}

// ==== Game logic functions ====
function updatePlayer(deltaTime) {
    if (player.x < 0) player.x = 0;
    if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;
    drawPlayer(); // render the player emoji each frame
}

function updateBullets(deltaTime) {
    bullets = bullets.filter(bullet => {
        bullet.y -= bullet.speed * deltaTime * 0.1;
        drawBullet(bullet);
        return bullet.y + bullet.height > 0;
    });
}

function updateEnemies(deltaTime) {
    enemies.forEach(enemy => {
        enemy.y += enemy.speed * deltaTime * 0.001;
        drawEnemy(enemy);
    });
    enemies = enemies.filter(enemy => enemy.y < canvas.height + 50);
}

function checkCollisions() {
    const bulletsHit = new Set();
    const enemiesHit = new Set();

    bullets.forEach((bullet, bIdx) => {
        enemies.forEach((enemy, eIdx) => {
            if (!bulletsHit.has(bIdx) && !enemiesHit.has(eIdx) && checkAABBCollision(bullet, enemy)) {
                score += 10;
                enemiesHit.add(eIdx);
                bulletsHit.add(bIdx);
            }
        });
    });

    enemies.forEach((enemy, eIdx) => {
        if (!enemiesHit.has(eIdx) && checkAABBCollision(player, enemy)) {
            lives--;
            enemiesHit.add(eIdx);
        }
    });

    bullets = bullets.filter((_, idx) => !bulletsHit.has(idx));
    enemies = enemies.filter((_, idx) => !enemiesHit.has(idx));

    if (lives <= 0 && !isGameOver) endGame();
}

function checkAABBCollision(obj1, obj2) {
    return (
        obj1.x < obj2.x + obj2.width &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + obj2.height &&
        obj1.y + obj1.height > obj2.y
    );
}

function updateScoreDisplay() {
    document.getElementById('score-display').innerText = `分數: ${score}`;
}

function updateLivesDisplay() {
    const lifeIcons = '❤️'.repeat(Math.max(0, lives));
    document.getElementById('lives-display').innerText = `生命: ${lifeIcons}`;
}

// ==== Game loop ====
function gameLoop(timestamp) {
    gameLoopInterval = null;
    if (!isGameRunning || isGameOver || isPaused) return;

    const deltaTime = Math.max(0, Math.min(timestamp - lastTime, 50));
    lastTime = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    handlePlayerMovement(deltaTime); // enable left/right movement
    updatePlayer(deltaTime);
    updateBullets(deltaTime);
    updateEnemies(deltaTime);

    spawnEnemy(timestamp);

    checkCollisions();

    updateScoreDisplay();
    updateLivesDisplay();

    if (isGameRunning && !isGameOver && !isPaused) {
        gameLoopInterval = requestAnimationFrame(gameLoop);
    }
}

// ==== Enemy spawning ====
function spawnEnemy(timestamp) {
    // Gradually increase speed
    speedBoost += 0.005; // small increment for smoother acceleration
    const enemySpeed = 1 + Math.random() * 1.5 + speedBoost;
    // Limit number of enemies to avoid crowding
    if (!isGameOver && enemies.length < 6 && timestamp - lastSpawnTime > SPAWN_INTERVAL * (0.5 + Math.random() * 0.5)) {
        enemies.push({
            x: Math.random() * (canvas.width - 40),
            y: -40,
            width: 40,
            height: 40,
            speed: enemySpeed,
            spawnTime: timestamp
        });
        lastSpawnTime = timestamp;
    }
}

// ==== Input handling ====
function stopFiring() {
    if (bulletIntervalId !== null) clearInterval(bulletIntervalId);
    bulletIntervalId = null;
}

function syncFiring() {
    if (!isGameRunning || isPaused || isGameOver || !(keys.Space || fireLatched)) {
        stopFiring();
        return;
    }
    if (bulletIntervalId !== null) return;
    bulletIntervalId = setInterval(() => {
        bullets.push({ x: player.x + player.width / 2 - 2, y: player.y - 20,
            width: 4, height: 10, speed: 10 });
    }, BULLET_INTERVAL);
}

function setKeyState(code, state) {
    if (state && !isGameRunning) return;
    keys[code] = state;
    if (code === 'Space') syncFiring();
}

// 處理玩家的左右移動 (缺失函式補上)
function handlePlayerMovement(deltaTime) {
    if (keys['ArrowLeft'] || keys['KeyA']) {
        player.x -= player.speed * deltaTime / (1000 / 60);
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
        player.x += player.speed * deltaTime / (1000 / 60);
    }
}

// Handle virtual button presses (mobile)
function setupVirtualButtons() {
    for (const [id, code] of [['btn-left', 'ArrowLeft'], ['btn-right', 'ArrowRight']]) {
        const button = document.getElementById(id);
        button.addEventListener('pointerdown', event => {
            event.preventDefault();
            button.setPointerCapture(event.pointerId);
            setKeyState(code, true);
        });
        for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
            button.addEventListener(type, () => setKeyState(code, false));
        }
    }
}

// ==== Game initialization ====
function initializeGame() {
    cancelAnimationFrame(gameLoopInterval);
    stopFiring();
    keys = {};
    fireLatched = false;
    player.x = (canvas.width - player.width) / 2;
    player.y = canvas.height - player.height;
    document.getElementById('pause-button').textContent = '暫停';
    fireButton.textContent = '發射';
    fireButton.setAttribute('aria-pressed', 'false');
    // Reset game state
    score = 0;
    lives = 3;
    isGameOver = false;
    isPaused = false;
    isGameRunning = true;
    bullets = [];
    enemies = [];
    lastSpawnTime = performance.now();
    speedBoost = 0;
    lastTime = performance.now();

    updateScoreDisplay();
    updateLivesDisplay();
    gameLoopInterval = requestAnimationFrame(gameLoop);
}

// ==== Fire button handling ====
const fireButton = document.getElementById('fire-button');
let fireLatched = false;
fireButton.setAttribute('aria-pressed', 'false');
fireButton.addEventListener('click', event => {
    event.preventDefault();
    if (!isGameRunning || isPaused) return;
    fireLatched = !fireLatched;
    fireButton.textContent = fireLatched ? '停止' : '發射';
    fireButton.setAttribute('aria-pressed', String(fireLatched));
    syncFiring();
});

// ==== Pause toggle ====
let pausedAt = 0;
function togglePause() {
    if (!isGameRunning || isGameOver) return;
    isPaused = !isPaused;
    document.getElementById('pause-button').textContent = isPaused ? '繼續' : '暫停';
    if (isPaused) {
        pausedAt = performance.now();
        cancelAnimationFrame(gameLoopInterval);
        gameLoopInterval = null;
    } else {
        const now = performance.now();
        lastSpawnTime += now - pausedAt;
        lastTime = now;
        gameLoopInterval = requestAnimationFrame(gameLoop);
    }
    syncFiring();
}

// ==== Game over handling ====
function endGame() {
    if (isGameOver) return;
    isGameOver = true;
    isGameRunning = false;
    isPaused = false;
    cancelAnimationFrame(gameLoopInterval);
    gameLoopInterval = null;
    stopFiring();
    keys = {};
    fireLatched = false;
    fireButton.textContent = '發射';
    fireButton.setAttribute('aria-pressed', 'false');
    updateScoreDisplay();
    updateLivesDisplay();
    document.getElementById('start-screen').style.display = 'block';
    document.getElementById('start-button').disabled = false;
    document.getElementById('pause-button').disabled = true;
    document.getElementById('pause-button').textContent = '暫停';
    alert(`遊戲結束！得分: ${score}`);
}

// ==== Hide start screen and auto-start ====
// Ensure elements are ready after DOM loads
document.addEventListener('DOMContentLoaded', () => {
    const startScreen = document.getElementById('start-screen');
    const startBtn = document.getElementById('start-button');
    const pauseBtn = document.getElementById('pause-button');

    // Initially disable pause button
    pauseBtn.disabled = true;

    // Start button click
    startBtn.addEventListener('click', function () {
        startScreen.style.display = 'none';
        startBtn.disabled = true; // prevent re-click
        pauseBtn.disabled = false; // enable pause button
        initializeGame();
    });

    // Pause button click
    pauseBtn.addEventListener('click', togglePause);

// Setup virtual direction buttons
setupVirtualButtons();

// Handle only game keys; do not scroll the page while playing.
const gameKeys = new Set(['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Space']);
window.addEventListener('keydown', event => {
    if (!gameKeys.has(event.code) || !isGameRunning) return;
    event.preventDefault();
    setKeyState(event.code, true);
});
window.addEventListener('keyup', event => {
    if (gameKeys.has(event.code)) setKeyState(event.code, false);
});
window.addEventListener('blur', () => {
    keys = {};
    if (isGameRunning && !isPaused) togglePause();
    else syncFiring();
});
});
