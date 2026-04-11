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
    if (width < 300) width = 300;
    if (height < 200) height = 200;
    
    canvas.width = width;
    canvas.height = height;
}

// Initialize canvas size
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
let player = {
    x: canvas.width / 2,
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
    if (player.x + player.width < 0) player.x = 0;
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
            if (!enemiesHit.has(eIdx) && checkAABBCollision(bullet, enemy)) {
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
    if (isGameOver || isPaused) return; // stop updates when game over or paused

    const deltaTime = timestamp - lastTime || 0;
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

    gameLoopInterval = requestAnimationFrame(gameLoop);
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
function setKeyState(code, state) {
    keys[code] = state;
    // If the key is Space, manage auto-fire interval
    if (code === 'Space') {
        if (state && !bulletIntervalId) {
            bulletIntervalId = setInterval(() => {
                bullets.push({
                    x: player.x + player.width / 2 - 2,
                    y: player.y - 20,
                    width: 4,
                    height: 10,
                    speed: 10
                });
            }, BULLET_INTERVAL);
        } else if (!state && bulletIntervalId) {
            clearInterval(bulletIntervalId);
            bulletIntervalId = null;
        }
    }
}

// 處理玩家的左右移動 (缺失函式補上)
function handlePlayerMovement(deltaTime) {
    if (keys['ArrowLeft'] || keys['KeyA']) {
        player.x -= player.speed;
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
        player.x += player.speed;
    }
}

// Handle virtual button presses (mobile)
function setupVirtualButtons() {
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');

    // Left button
    btnLeft.addEventListener('mousedown', () => setKeyState('ArrowLeft', true));
    btnLeft.addEventListener('mouseup', () => setKeyState('ArrowLeft', false));
    btnLeft.addEventListener('touchstart', (e) => {
        e.preventDefault();
        setKeyState('ArrowLeft', true);
    });
    btnLeft.addEventListener('touchend', (e) => {
        e.preventDefault();
        setKeyState('ArrowLeft', false);
    });

    // Right button
    btnRight.addEventListener('mousedown', () => setKeyState('ArrowRight', true));
    btnRight.addEventListener('mouseup', () => setKeyState('ArrowRight', false));
    btnRight.addEventListener('touchstart', (e) => {
        e.preventDefault();
        setKeyState('ArrowRight', true);
    });
    btnRight.addEventListener('touchend', (e) => {
        e.preventDefault();
        setKeyState('ArrowRight', false);
    });
}

// ==== Game initialization ====
function initializeGame() {
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

    // Clear any existing intervals
    if (bulletIntervalId) {
        clearInterval(bulletIntervalId);
        bulletIntervalId = null;
    }

    // Start auto-fire (bullet will be continuously created while Space is pressed)
    // Initialize game loop
    gameLoopInterval = requestAnimationFrame(gameLoop);
    console.log("遊戲初始化完成，請在畫布上觀察效果。");
}

// ==== Fire button handling ====
const fireButton = document.getElementById('fire-button');
if (fireButton) {
    // Toggle firing state on click/touch
    fireButton.addEventListener('click', (e) => {
        e.preventDefault();
        // Toggle Space key state
        setKeyState('Space', !keys['Space']);
    });
    
    // Touch events - also toggle
    fireButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        // Toggle Space key state
        setKeyState('Space', !keys['Space']);
    });
    
    // Prevent default touch behavior
    fireButton.addEventListener('touchend', (e) => {
        e.preventDefault();
    });
}

// ==== Pause toggle ====
function togglePause() {
    isPaused = !isPaused;
    const pauseBtn = document.getElementById('pause-button');
    pauseBtn.textContent = isPaused ? '繼續' : '暫停';
    if (isPaused) {
        // Stop game loop and bullet interval when paused
        cancelAnimationFrame(gameLoopInterval);
        if (bulletIntervalId) {
            clearInterval(bulletIntervalId);
            bulletIntervalId = null;
        }
    } else {
        // Resume game
        gameLoopInterval = requestAnimationFrame(gameLoop);
    }
}

// ==== Game over handling ====
function endGame() {
    isGameOver = true;
    isGameRunning = false;
    
    // Stop game loop
    cancelAnimationFrame(gameLoopInterval);
    
    // Clear bullet interval
    if (bulletIntervalId) {
        clearInterval(bulletIntervalId);
        bulletIntervalId = null;
    }
    
    // Show game over message
    alert(`遊戲結束！得分: ${score}`);
    
    // Reset start screen
    const startScreen = document.getElementById('start-screen');
    const startBtn = document.getElementById('start-button');
    const pauseBtn = document.getElementById('pause-button');
    
    if (startScreen) startScreen.style.display = 'block';
    if (startBtn) startBtn.disabled = false;
    if (pauseBtn) pauseBtn.disabled = true;
    
    // Reset game state
    score = 0;
    lives = 3;
    isGameOver = false;
    isPaused = false;
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

// Add keyboard event listeners for physical keys
window.addEventListener('keydown', (e) => {
    setKeyState(e.code, true);
});

window.addEventListener('keyup', (e) => {
    setKeyState(e.code, false);
});
});
