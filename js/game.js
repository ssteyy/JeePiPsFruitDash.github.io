const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Constants
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 675;
const GROUND_HEIGHT = 120;
const GRAVITY = 0.8;
const JUMP_FORCE = -15;
const INITIAL_SPEED = 5;
const SPEED_INCREMENT = 0.001;

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Game State
let gameState = 'START'; // START, PLAYING, PAUSED, GAMEOVER, SHOP
let gameOverReason = '';
let score = 0;
let highScore = 0;
let coins = 0;
let sessionCoins = 0; // Track coins collected in current session
let gameSpeed = INITIAL_SPEED;
let distance = 0;

// Character Colors (Red is default, not shown in shop)
const CHARACTER_COLORS = ['Sand', 'Midnight_Blue', 'Espresso', 'Electric_Lime', 'Amber', 'Charcoal', 'Coral', 'Crimson', 'Forest_Green', 'Gold', 'Lavender', 'Magenta', 'Mint', 'Safety_Orange', 'Sage_Green', 'Sky_Blue', 'Slate_Gray', 'Teal', 'Terracotta', 'Turquoise'];
const CHARACTER_PRICES = {
    'Red': 0, // Default/free
    'Sand': 50,
    'Midnight_Blue': 50,
    'Espresso': 50,
    'Electric_Lime': 100,
    'Amber': 100,
    'Charcoal': 100,
    'Coral': 100,
    'Crimson': 150,
    'Forest_Green': 150,
    'Gold': 150,
    'Lavender': 150,
    'Magenta': 200,
    'Mint': 200,
    'Safety_Orange': 200,
    'Sage_Green': 200,
    'Sky_Blue': 250,
    'Slate_Gray': 250,
    'Teal': 250,
    'Terracotta': 250,
    'Turquoise': 300
};
let currentCharacterColor = 'Sand';
let unlockedCharacters = ['Sand'];

// Assets
const images = {};
const assetPaths = {
    background: 'assets/images/background.png',
    tree: 'assets/images/tree_stump.png',
    coin: 'assets/images/coin.png'
};

function getAnimationPaths(color) {
    const idlePaths = [];
    const runPaths = [];
    const jumpPaths = [];

    // Special handling for Red character which uses different naming convention
    if (color === 'Red') {
        for (let i = 1; i <= 12; i++) {
            idlePaths.push(`assets/characters/${color}/idle/idle_${i}.png`);
        }
        for (let i = 1; i <= 18; i++) {
            runPaths.push(`assets/characters/${color}/run/run_${i}.png`);
        }
        for (let i = 1; i <= 2; i++) {
            jumpPaths.push(`assets/characters/${color}/jump/jump_${i}.png`);
        }
    } else {
        // Handle naming inconsistencies for other characters
        for (let i = 1; i <= 12; i++) {
            const fileName = (i === 3) ? `${color}_idle_3png.png` : `${color}_idle_${i}.png`;
            idlePaths.push(`assets/characters/${color}/idle/${fileName}`);
        }

        for (let i = 1; i <= 18; i++) {
            let fileName = `${color}_run_${i}.png`;
            runPaths.push(`assets/characters/${color}/run/${fileName}`);
        }

        for (let i = 1; i <= 2; i++) {
            let fileName = `${color}_jump_${i}.png`;
            jumpPaths.push(`assets/characters/${color}/jump/${fileName}`);
        }
    }

    return {
        idle: idlePaths,
        run: runPaths,
        jump: jumpPaths
    };
}

const myFruitAssets = [
    'assets/images/fruits/apple.png',
    'assets/images/fruits/banana.png',
    'assets/images/fruits/blueberry.png',
    'assets/images/fruits/cantaloop.png',
    'assets/images/fruits/chherry.png',
    'assets/images/fruits/grape.png',
    'assets/images/fruits/lemon.png',
    'assets/images/fruits/lime.png',
    'assets/images/fruits/orange.png',
    'assets/images/fruits/peach.png',
    'assets/images/fruits/pear.png',
    'assets/images/fruits/persimmon.png',
    'assets/images/fruits/pineapple.png',
    'assets/images/fruits/purple_fig_fruit.png',
    'assets/images/fruits/raseberry.png',
    'assets/images/fruits/strawberry.png',
    'assets/images/fruits/watermelon.png'
];

let assetsLoaded = 0;
let totalAssets = Object.keys(assetPaths).length + myFruitAssets.length;
const fruitImages = [];
const characterImages = {}; // Store all character animations

function loadAssets() {
    assetsLoaded = 0;
    const totalCharactersToLoad = CHARACTER_COLORS.length + 1; // 20 shop characters + Red
    totalAssets = Object.keys(assetPaths).length + myFruitAssets.length + (totalCharactersToLoad * 32); // 12 idle + 18 run + 2 jump per character

    // Load main assets
    for (let key in assetPaths) {
        const img = new Image();
        img.src = assetPaths[key];
        img.onload = () => {
            assetsLoaded++;
            if (assetsLoaded === totalAssets) {
                console.log('All assets loaded');
                loadGameData();
            }
        };
        images[key] = img;
    }

    // Load fruit assets
    myFruitAssets.forEach(path => {
        const img = new Image();
        img.src = path;
        img.onload = () => {
            assetsLoaded++;
            if (assetsLoaded === totalAssets) {
                console.log('All assets loaded');
                loadGameData();
            }
        };
        fruitImages.push(img);
    });

    // Load all character assets (including Red which is default but not in shop)
    const allCharactersToLoad = [...CHARACTER_COLORS, 'Red'];
    allCharactersToLoad.forEach(color => {
        characterImages[color] = {};
        const animationPaths = getAnimationPaths(color);

        for (let animKey in animationPaths) {
            characterImages[color][animKey] = [];
            animationPaths[animKey].forEach((path, index) => {
                const img = new Image();
                img.src = path;
                img.onload = () => {
                    assetsLoaded++;
                    if (assetsLoaded === totalAssets) {
                        console.log('All assets loaded');
                        loadGameData();
                    }
                };
                img.onerror = () => {
                    console.error(`Failed to load ${path}`);
                    assetsLoaded++;
                    if (assetsLoaded === totalAssets) {
                        console.log('All assets loaded (with errors)');
                        loadGameData();
                    }
                };
                characterImages[color][animKey][index] = img;
            });
        }
    });
}

function switchCharacter(color) {
    // Allow Red (default) and characters in CHARACTER_COLORS that are unlocked
    if (color !== 'Red' && (!CHARACTER_COLORS.includes(color) || !unlockedCharacters.includes(color))) return false;

    currentCharacterColor = color;

    // Ensure character images are available
    if (characterImages[color] && characterImages[color].idle && characterImages[color].idle.length > 0) {
        // Copy the character images to the main images object
        images.idle = characterImages[color].idle;
        images.run = characterImages[color].run;
        images.jump = characterImages[color].jump;
    } else {
        // If images not loaded yet, load them synchronously
        const animationPaths = getAnimationPaths(color);
        images.idle = [];
        images.run = [];
        images.jump = [];
        animationPaths.idle.forEach((path, index) => {
            const img = new Image();
            img.src = path;
            images.idle[index] = img;
        });
        animationPaths.run.forEach((path, index) => {
            const img = new Image();
            img.src = path;
            images.run[index] = img;
        });
        animationPaths.jump.forEach((path, index) => {
            const img = new Image();
            img.src = path;
            images.jump[index] = img;
        });
    }

    saveGameData();
    return true;
}

// Entities
class Player {
    constructor() {
        this.width = 80;
        this.height = 80;
        this.x = 200;
        this.y = CANVAS_HEIGHT - GROUND_HEIGHT - this.height;
        this.vx = 0; // Horizontal velocity
        this.vy = 0;
        this.direction = 'right'; // Default direction
        this.isJumping = false;
        this.falling = false;
        this.frame = 0;
        this.frameTimer = 0;
        this.frameInterval = 100; // ms per frame
        this.bobOffset = 0;
        this.jumpCount = 0;
        this.lastJumpTime = 0;
        this.doubleJumpWindow = 300; // ms window for double jump
        this.landingTimer = 0; // Timer for landing animation
    }

    update(deltaTime) {
        // Physics
        if (this.falling) {
            this.vy += GRAVITY * 0.5; // Slower fall into pit
        } else {
            this.vy += GRAVITY;
        }
        this.y += this.vy;

        // Ground collision (only if not falling)
        if (!this.falling) {
            let groundY = CANVAS_HEIGHT - GROUND_HEIGHT - this.height;

            // Check if player is standing on a tree stump
            for (let obs of obstacles) {
                if (obs.type === 'tree') {
                    const obsRect = obs.getBounds();
                    const playerCenter = this.x + this.width / 2;
                    // Check if player is directly above the tree
                    if (playerCenter >= obsRect.x && playerCenter <= obsRect.x + obsRect.width) {
                        const treeTopY = obs.y - this.height;
                        if (this.y >= treeTopY - 10 && this.y <= treeTopY + 10) {
                            groundY = treeTopY;
                            break; // Use the first tree found
                        }
                    }
                }
            }

            if (this.y > groundY) {
                this.y = groundY;
                this.vy = 0;
                this.isJumping = false;
                this.jumpCount = 0; // Reset jump count when landing
            }
        }

        // Animation
        this.frameTimer += deltaTime;
        if (this.frameTimer > this.frameInterval) {
            let maxFrames = 18; // Default to run frames
            if (this.isJumping && images.jump) maxFrames = images.jump.length;
            else if (gameState === 'START' && images.idle) maxFrames = images.idle.length;
            else if (images.run) maxFrames = images.run.length;

            this.frame = (this.frame + 1) % maxFrames;
            this.frameTimer = 0;
        }
    }

    jump() {
        const currentTime = Date.now();

        // First jump
        if (!this.isJumping && !this.falling && this.jumpCount === 0) {
            this.vy = JUMP_FORCE;
            this.isJumping = true;
            this.jumpCount = 1;
            this.lastJumpTime = currentTime;
        }
        // Double jump - within time window and already jumping
        else if (this.isJumping && this.jumpCount === 1 &&
                 (currentTime - this.lastJumpTime) < this.doubleJumpWindow) {
            this.vy = JUMP_FORCE * 1.3; // Higher double jump
            this.jumpCount = 2;
        }
    }

    draw() {
        let animationFrames = images.run;
        if (this.isJumping) animationFrames = images.jump;
        if (gameState === 'START') animationFrames = images.idle;

        // Ensure we have frames loaded
        if (!animationFrames || animationFrames.length === 0) return;

        const currentFrame = Math.floor(this.frame) % animationFrames.length;
        const img = animationFrames[currentFrame];

        if (!img || !img.complete) return;

        // --- 1. MOTION GHOSTING (Natural Blur) ---
        // If moving fast, draw a faint "after-image" behind the player
        if (Math.abs(this.vx) > 5) {
            ctx.globalAlpha = 0.3; // Make it transparent
            ctx.drawImage(
                img,
                this.x - (this.vx * 2), this.y + 10, this.width, this.height
            );
            ctx.globalAlpha = 1.0; // Reset transparency
        }

        ctx.save();

        // --- 2. THE "BOUNCE" CALCULATION ---
        // Character "breathes" while idle, but "hops" while running
        let time = Date.now() / 150;
        let bounce = 0;
        let stretchX = 1;
        let stretchY = 1;

        if (!this.isJumping && Math.abs(this.vx) > 0.1) {
            // Run bounce: The character rhythmically hops
            bounce = Math.abs(Math.sin(this.frame * 0.8)) * 6;
            stretchX = 1 + (Math.sin(this.frame * 0.8) * 0.05);
            stretchY = 1 - (Math.sin(this.frame * 0.8) * 0.05);
        } else if (gameState === 'START') {
            // Idle breathing: Slow, subtle scale changes
            stretchY = 1 + Math.sin(time) * 0.03;
            stretchX = 1 - Math.sin(time) * 0.03;
        }

        // --- 3. JUMP & LANDING ---
        if (this.isJumping) {
            // Stretch based on vertical velocity (this.vy)
            let jumpFactor = Math.min(Math.abs(this.vy) * 0.02, 0.3);
            stretchY = 1 + jumpFactor;
            stretchX = 1 - jumpFactor;
        } else if (this.landingTimer > 0) {
            // Flat "pancake" squash on landing
            let t = this.landingTimer / 10;
            stretchX = 1 + (0.5 * t);
            stretchY = 1 - (0.4 * t);
            this.landingTimer--;
        }

        // --- 4. POSITIONING & ROTATION ---
        // Center of rotation at the bottom-middle (the feet)
        ctx.translate(this.x + this.width / 2, (this.y + this.height + 5) - bounce);

        // Lean forward based on velocity
        let lean = this.vx * 0.035;

        if (this.direction === 'left') {
            ctx.scale(-stretchX, stretchY);
            ctx.rotate(-lean);
        } else {
            ctx.scale(stretchX, stretchY);
            ctx.rotate(lean);
        }

        // --- 5. THE DRAW ---
        ctx.drawImage(
            img,
            -this.width / 2, -this.height, this.width, this.height
        );

        ctx.restore();
    }

    getBounds() {
        // More precise collision box for the character
        return {
            x: this.x + 23,
            y: this.y + 18 + 10,
            width: this.width - 45,
            height: this.height - 15
        };
    }
}

class Obstacle {
    constructor(x, type) {
        this.x = x;
        this.type = type; // 'tree' or 'pit'
        this.width = type === 'tree' ? 55 : 150;
        this.height = type === 'tree' ? 55 : GROUND_HEIGHT;
        this.y = type === 'tree' ? CANVAS_HEIGHT - GROUND_HEIGHT - this.height + 10 : CANVAS_HEIGHT - GROUND_HEIGHT;
    }

    update() {
        this.x -= gameSpeed;
    }

    draw() {
        if (this.type === 'tree') {
            ctx.drawImage(images.tree, this.x, this.y, this.width, this.height);
        } else {
            // Draw pit as a dark area
            ctx.fillStyle = '#000';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    getBounds() {
        return {
            x: this.x + 8,
            y: this.y + 8,
            width: this.width - 15,
            height: this.height - 8
        };
    }
}

class Collectible {
    constructor(x, y, type = 'fruit') {
        this.x = x;
        this.y = y;
        this.width = 45;
        this.height = 45;
        this.collected = false;
        this.type = type; // 'fruit' or 'coin'

        if (type === 'coin') {
            this.image = images.coin;
        } else {
            this.image = fruitImages[Math.floor(Math.random() * fruitImages.length)];
        }
    }

    update() {
        this.x -= gameSpeed;
    }

    draw() {
        if (!this.collected && this.image && this.image.complete) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
    }

    getBounds() {
        return {
            x: this.x + 5,
            y: this.y + 5,
            width: this.width - 10,
            height: this.height - 10
        };
    }
}

// Game Instance Variables
let player;
let obstacles = [];
let collectibles = [];
let lastTime = 0;
let spawnTimer = 0;

function init() {
    player = new Player();
    obstacles = [];
    collectibles = [];
    score = 0;
    sessionCoins = 0; // Reset session coins
    gameSpeed = INITIAL_SPEED;
    distance = 0;
    spawnTimer = 0;
    player.falling = false;
    player.jumpCount = 0;
    player.lastJumpTime = 0;
    updateUI();
    updateCoinsUI();
}

function loadGameData() {
    // Load high score
    const savedHighScore = localStorage.getItem('jeepipsHighScore');
    highScore = savedHighScore ? parseInt(savedHighScore) : 0;

    // Load coins
    const savedCoins = localStorage.getItem('jeepipsCoins');
    coins = savedCoins ? parseInt(savedCoins) : 0;

    // Load unlocked characters
    const savedUnlocked = localStorage.getItem('jeepipsUnlockedCharacters');
    unlockedCharacters = savedUnlocked ? JSON.parse(savedUnlocked) : ['Red'];

    // Load current character - Red is now the default
    currentCharacterColor = 'Red'; // Always start with Red as default

    // Set current character images
    switchCharacter(currentCharacterColor);

    updateHighScoreUI();
    updateCoinsUI();
    updateUI();
}

function saveGameData() {
    localStorage.setItem('jeepipsHighScore', highScore.toString());
    localStorage.setItem('jeepipsCoins', coins.toString());
    localStorage.setItem('jeepipsUnlockedCharacters', JSON.stringify(unlockedCharacters));
    localStorage.setItem('jeepipsCurrentCharacter', currentCharacterColor);
}

function updateHighScoreUI() {
    document.getElementById('high-score').innerText = highScore;
}

function updateUI() {
    document.getElementById('score').innerText = score;
    document.getElementById('score-start').innerText = score;
    document.getElementById('final-score').innerText = score;
}

function updateCoinsUI() {
    document.getElementById('coins').innerText = coins;
    document.getElementById('start-coins').innerText = coins;
}

function spawnManager(deltaTime) {
    spawnTimer += deltaTime;
    if (spawnTimer > 1500 / (gameSpeed / INITIAL_SPEED)) {
        const type = Math.random() > 0.3 ? 'tree' : 'pit';
        obstacles.push(new Obstacle(CANVAS_WIDTH + 150, type));

        // Spawn collectibles with randomized positions and types
        if (Math.random() > 0.5) {
            // Random height: between high jump and ground level
            const randomY = CANVAS_HEIGHT - GROUND_HEIGHT - 75 - Math.random() * 225;
            const collectibleType = Math.random() > 0.7 ? 'coin' : 'fruit'; // 30% chance for coin
            collectibles.push(new Collectible(CANVAS_WIDTH + 300, randomY, collectibleType));
        }

        spawnTimer = 0;
    }
}

function checkCollisions() {
    const pRect = player.getBounds();

    // Obstacles
    for (let obs of obstacles) {
        const oRect = obs.getBounds();
        if (pRect.x < oRect.x + oRect.width &&
            pRect.x + pRect.width > oRect.x &&
            pRect.y < oRect.y + oRect.height &&
            pRect.y + pRect.height > oRect.y) {

            if (obs.type === 'tree') {
                // Check if player is hitting the tree from the side or bottom
                const playerCenter = player.x + player.width / 2;
                const treeLeft = obs.x + 8; // Using bounds offset
                const treeRight = obs.x + obs.width - 15;
                const treeTop = obs.y + 8;
                const treeBottom = obs.y + obs.height - 8;

                // Only game over if hitting from side or jumping into bottom
                const hittingFromSide = playerCenter < treeLeft || playerCenter > treeRight;
                const hittingFromBottom = player.y < treeTop && player.vy < 0;

                if (hittingFromSide || hittingFromBottom) {
                    gameOver('You hit a tree!');
                }
                // Landing on top or standing on top is allowed
            }
        }

        // Pit check (falling in)
        if (obs.type === 'pit') {
            if (player.x + player.width/2 > obs.x &&
                player.x + player.width/2 < obs.x + obs.width &&
                player.y + player.height >= CANVAS_HEIGHT - GROUND_HEIGHT) {
                player.falling = true;
            }
        }
    }

    // Collectibles
    for (let col of collectibles) {
        if (!col.collected) {
            const cRect = col.getBounds();
            if (pRect.x < cRect.x + cRect.width &&
                pRect.x + pRect.width > cRect.x &&
                pRect.y < cRect.y + cRect.height &&
                pRect.y + pRect.height > cRect.y) {
                col.collected = true;
                if (col.type === 'coin') {
                    coins++;
                    sessionCoins++; // Track session coins
                    updateCoinsUI();
                } else {
                    score++;
                    updateUI();
                }
            }
        }
    }
}

function gameOver(reason) {
    gameState = 'GAMEOVER';
    gameOverReason = reason;

    // Update high score if current score is higher
    if (score > highScore) {
        highScore = score;
        updateHighScoreUI();
    }

    saveGameData();

    document.getElementById('game-over-reason').innerText = reason;
    document.getElementById('final-coins').innerText = sessionCoins;
    document.getElementById('game-over-coins').innerText = coins; // Show total coins
    document.getElementById('game-over-screen').classList.remove('hidden');
    document.getElementById('game-over-coin-container').classList.remove('hidden');
    document.getElementById('game-ui').classList.add('hidden');
}

function drawBackground() {
    if (!images.background.complete) return;

    // Parallax background
    const bgWidth = images.background.width * (CANVAS_HEIGHT / images.background.height);
    const x = -(distance * 0.5) % bgWidth;

    ctx.drawImage(images.background, x, 0, bgWidth, CANVAS_HEIGHT);
    ctx.drawImage(images.background, x + bgWidth, 0, bgWidth, CANVAS_HEIGHT);

    // Ground
    ctx.fillStyle = '#D2691E'; // Orange-ish brown for the forest path
    ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT);

    // Path details (white lines or road cuts)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 15; i++) {
        const lineX = (i * 300 - (distance % 300));
        ctx.fillRect(lineX, CANVAS_HEIGHT - GROUND_HEIGHT + 30, 60, 8);
    }
}

function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (gameState === 'PLAYING') {
        gameSpeed += SPEED_INCREMENT;
        distance += gameSpeed;

        player.update(deltaTime);

        // Check if player fell off screen
        if (player.y > CANVAS_HEIGHT) {
            gameOver('You fell into a pit!');
        }

        spawnManager(deltaTime);

        obstacles.forEach(obs => obs.update());
        collectibles.forEach(col => col.update());

        // Cleanup
        obstacles = obstacles.filter(obs => obs.x + obs.width > -100);
        collectibles = collectibles.filter(col => col.x + col.width > -100);

        checkCollisions();
    }

    drawBackground();
    obstacles.forEach(obs => obs.draw());
    collectibles.forEach(col => col.draw());
    player.draw();

    requestAnimationFrame(gameLoop);
}

// Shop Functions
let shopReturnState = 'START'; // Track where to return to from shop

function openShop(scrollToColor = null) {
    shopReturnState = gameState;
    gameState = 'SHOP';
    document.getElementById('game-ui').classList.add('hidden');
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('game-over-coin-container').classList.add('hidden');
    document.getElementById('shop-screen').classList.remove('hidden');
    populateShop(scrollToColor);
}

function openShopFromStart() {
    openShop();
}

function openShopFromGameOver() {
    openShop();
}

function closeShop() {
    gameState = shopReturnState;
    document.getElementById('shop-screen').classList.add('hidden');

    if (shopReturnState === 'PLAYING') {
        document.getElementById('game-ui').classList.remove('hidden');
    } else if (shopReturnState === 'START') {
        document.getElementById('start-screen').classList.remove('hidden');
    } else if (shopReturnState === 'GAMEOVER') {
        // When returning from shop to game over, also show the game UI
        document.getElementById('game-over-screen').classList.remove('hidden');
        document.getElementById('game-ui').classList.remove('hidden');
        document.getElementById('score-container').classList.add('hidden');
        document.getElementById('controls').classList.add('hidden');
    }
}

function populateShop(scrollToColor = null) {
    const grid = document.getElementById('character-grid');
    const coinsDisplay = document.getElementById('shop-coins-amount');
    coinsDisplay.textContent = coins;

    grid.innerHTML = '';

    // Add Red character first (default character)
    const allShopCharacters = ['Red', ...CHARACTER_COLORS];
    allShopCharacters.forEach(color => {
        const card = document.createElement('div');
        card.className = 'character-card';

        const isUnlocked = unlockedCharacters.includes(color);
        const isSelected = currentCharacterColor === color;
        const price = CHARACTER_PRICES[color];

        card.classList.add(isUnlocked ? 'unlocked' : 'locked');
        if (isSelected) card.classList.add('selected');

        card.innerHTML = `
            <div class="character-name">${color.replace('_', ' ')}</div>
            <div class="character-preview" style="background-image: url('assets/characters/${color}/idle/${color === 'Red' ? 'idle_1.png' : color + '_idle_1.png'}')"></div>
            <div class="character-price">${isUnlocked ? 'Unlocked' : `${price} coins`}</div>
            <button class="character-button ${isUnlocked ? (isSelected ? 'select selected' : 'select') : 'buy'}" data-color="${color}">
                ${isUnlocked ? (isSelected ? 'Selected' : 'Select') : 'Buy'}
            </button>
        `;

        const button = card.querySelector('.character-button');
        button.addEventListener('click', () => handleCharacterAction(color, isUnlocked, isSelected, price));

        grid.appendChild(card);
    });

    // Scroll to specified character if provided
    if (scrollToColor) {
        setTimeout(() => scrollToCharacter(scrollToColor), 100);
    }
}

function handleCharacterAction(color, isUnlocked, isSelected, price) {
    if (isUnlocked) {
        if (!isSelected) {
            // Actually changing to a different skin
            switchCharacter(color);
            populateShop(); // Refresh to show new selection
        } else {
            // Clicking on already selected skin - just refresh shop without restarting
            populateShop();
        }
    } else {
        if (coins >= price) {
            coins -= price;
            unlockedCharacters.push(color);
            switchCharacter(color);
            saveGameData();
            updateCoinsUI();
            populateShop(color); // Refresh to show purchased character and scroll to next position
        } else {
            showInsufficientCoinsPopup();
        }
    }
}

function scrollToCharacter(color) {
    // Find the character card element and scroll to the NEXT position
    const characterCards = document.querySelectorAll('.character-card');
    const allShopCharacters = ['Red', ...CHARACTER_COLORS];
    const characterIndex = allShopCharacters.indexOf(color);
    const nextIndex = characterIndex + 1; // Scroll to next position after purchased character

    // If there's a next character, scroll to it; otherwise scroll to the purchased character
    const targetIndex = (nextIndex < characterCards.length) ? nextIndex : characterIndex;

    if (characterIndex !== -1 && characterCards[targetIndex]) {
        const targetCard = characterCards[targetIndex];
        targetCard.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
        });
    }
}

function showInsufficientCoinsPopup() {
    // Create popup overlay
    const popup = document.createElement('div');
    popup.id = 'insufficient-coins-popup';
    popup.innerHTML = `
        <div class="popup-content">
            <h3>Insufficient Coins</h3>
            <p>You don't have enough coins to buy this skin.</p>
            <button id="popup-close-btn">OK</button>
        </div>
    `;
    popup.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;

    const popupContent = popup.querySelector('.popup-content');
    popupContent.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 20px;
        text-align: center;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        max-width: 300px;
    `;

    const closeBtn = popup.querySelector('#popup-close-btn');
    closeBtn.style.cssText = `
        background: linear-gradient(145deg, #28a745, #20c997);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 25px;
        cursor: pointer;
        font-size: 16px;
        margin-top: 15px;
    `;

    closeBtn.addEventListener('click', () => {
        document.body.removeChild(popup);
    });

    document.body.appendChild(popup);
}

// Input Handling
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (gameState === 'PLAYING') {
            player.jump();
        } else if (gameState === 'PAUSED') {
            resumeGame();
        } else if (gameState === 'START') {
            startGame();
        } else if (gameState === 'GAMEOVER') {
            restartGame();
        } else if (gameState === 'SHOP') {
            closeShop();
        }
    } else if (e.code === 'Escape') {
        if (gameState === 'SHOP') {
            closeShop();
        } else if (gameState === 'PLAYING') {
            pauseGame();
        }
    }
});

document.getElementById('start-button').addEventListener('click', startGame);
document.getElementById('restart-button').addEventListener('click', restartGame);
document.getElementById('pause-play-button').addEventListener('click', togglePausePlay);
document.getElementById('shop-button').addEventListener('click', openShop);
document.getElementById('start-shop-button').addEventListener('click', openShopFromStart);
document.getElementById('game-over-shop-button').addEventListener('click', openShopFromGameOver);
document.getElementById('back-to-game-button').addEventListener('click', closeShop);

function startGame() {
    gameState = 'PLAYING';
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('game-over-coin-container').classList.add('hidden');
    document.getElementById('game-ui').classList.remove('hidden');
    document.getElementById('pause-play-button').innerHTML = '&#9208;';
    init();
}

function restartGame() {
    gameState = 'PLAYING';
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('game-over-coin-container').classList.add('hidden');
    document.getElementById('game-ui').classList.remove('hidden');
    document.getElementById('score-container').classList.remove('hidden');
    document.getElementById('controls').classList.remove('hidden');
    init();
}

function togglePausePlay() {
    if (gameState === 'PLAYING') {
        pauseGame();
    } else if (gameState === 'PAUSED') {
        resumeGame();
    }
}

function pauseGame() {
    gameState = 'PAUSED';
    document.getElementById('pause-play-button').innerHTML = '&#9654;';
}

function resumeGame() {
    gameState = 'PLAYING';
    document.getElementById('pause-play-button').innerHTML = '&#9208;';
}

// Start
loadAssets();
init();
requestAnimationFrame(gameLoop);