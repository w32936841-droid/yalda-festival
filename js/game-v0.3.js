// version: 0.3.1 - Fixed HTML ID matching bug
// ========== متغیرهای سراسری ==========

let userId = '';
let giftCount = 0;
let gameActive = false;
let fruitSpawnInterval;
let preGameSpawnInterval;

// عناصر DOM - IDs updated to match HTML
const welcomeScreen = document.getElementById('id-input-section');
const gameScreen = document.getElementById('catch-fruit-section');
const guideModal = document.getElementById('start-game-section');
const giftModal = document.getElementById('gift-section');
const loading = document.getElementById('loading-indicator');
const userIdInput = document.getElementById('telegram-id');
const startBtn = document.getElementById('confirm-btn');
const startGameBtn = document.getElementById('start-game-btn');
const continueBtn = document.getElementById('copy-btn');
const gameArea = document.body; // Fruits fall across entire body
const displayUserId = document.getElementById('displayUserId'); // May not exist in new HTML
const giftCountDisplay = document.getElementById('giftCount'); // May not exist  
const particleContainer = document.getElementById('seeds-container');
const giftTitle = document.querySelector('.gift-message');
const giftCode = document.getElementById('gift-code');
const giftDescription = document.getElementById('gift-description');

// تنظیمات بازی
const FRUIT_TYPES = {
    pomegranate: { emoji: '🍎', color: '#c62828', particle: '🔴' },
    watermelon: { emoji: '🍉', color: '#2e7d32', particle: '🟢' }
};

const CONFIG = {
    preGameInterval: 1200,     // سرعت ریزش قبل از بازی (سریع‌تر 50%)
    gameInterval: 1800,        // سرعت ریزش در حین بازی
    fruitFallDuration: [5000, 8000],  // مدت سقوط میوه (تصادفی)
    maxFruitsOnScreen: 15,
    fruitSize: 60              // اندازه میوه به پیکسل
};

// ========== Enable button when valid input ==========
userIdInput.addEventListener('input', () => {
    const value = userIdInput.value.trim();
    if (value && value.length > 0 && !isNaN(value)) {
        startBtn.disabled = false;
    } else {
        startBtn.disabled = true;
    }
});

// ========== مدیریت ورود کاربر ==========
startBtn.addEventListener('click', () => {
    const inputUserId = userIdInput.value.trim();
    if (!inputUserId) {
        alert('لطفا شناسه کاربری خود را وارد کنید');
        return;
    }
    userId = inputUserId;
    
    // Hide welcome, show guide
    welcomeScreen.classList.remove('active');
    guideModal.classList.add('active');
    
    startPreGameFruits();  // شروع ریزش میوه‌های غیرقابل تعامل
});

// ========== شروع بازی ==========
startGameBtn.addEventListener('click', () => {
    guideModal.classList.remove('active');
    gameScreen.classList.add('active');
    gameActive = true;
    clearInterval(preGameSpawnInterval);  // توقف ریزش قبل از بازی
    startGameFruits();  // شروع ریزش میوه‌های قابل تعامل
});

continueBtn.addEventListener('click', () => {
    // Copy code to clipboard
    const code = giftCode.textContent;
    navigator.clipboard.writeText(code).then(() => {
        alert('کد هدیه کپی شد: ' + code);
    }).catch(err => {
        console.error('Copy failed:', err);
    });
});

// ========== ریزش میوه‌ها قبل از شروع بازی ==========
function startPreGameFruits() {
    const container = document.getElementById('fruits-container');
    if (!container) return;
    
    preGameSpawnInterval = setInterval(() => {
        if (container.querySelectorAll('.fruit').length < CONFIG.maxFruitsOnScreen) {
            spawnFruit(false, container);  // میوه غیرقابل کلیک
        }
    }, CONFIG.preGameInterval);
}

// ========== ریزش میوه‌ها در حین بازی ==========
function startGameFruits() {
    const container = document.getElementById('fruits-container');
    if (!container) return;
    
    fruitSpawnInterval = setInterval(() => {
        if (container.querySelectorAll('.fruit').length < CONFIG.maxFruitsOnScreen) {
            spawnFruit(true, container);  // میوه قابل کلیک
        }
    }, CONFIG.gameInterval);
}

// ========== ایجاد میوه ==========
function spawnFruit(interactive, container) {
    const fruitType = Math.random() > 0.5 ? 'pomegranate' : 'watermelon';
    const fruit = FRUIT_TYPES[fruitType];
    
    const fruitEl = document.createElement('div');
    fruitEl.className = 'fruit';
    fruitEl.textContent = fruit.emoji;
    fruitEl.style.position = 'absolute';
    fruitEl.style.left = Math.random() * (window.innerWidth - CONFIG.fruitSize) + 'px';
    fruitEl.style.top = '-100px';
    fruitEl.style.fontSize = CONFIG.fruitSize + 'px';
    fruitEl.style.zIndex = '10';
    fruitEl.style.userSelect = 'none';
    fruitEl.dataset.type = fruitType;
    
    const fallDuration = Math.random() * 
        (CONFIG.fruitFallDuration[1] - CONFIG.fruitFallDuration[0]) + 
        CONFIG.fruitFallDuration[0];
    
    fruitEl.style.animation = `fall ${fallDuration}ms linear`;
    
    if (interactive && gameActive) {
        fruitEl.style.cursor = 'pointer';
        fruitEl.addEventListener('click', () => handleFruitClick(fruitEl, fruit));
    }
    
    container.appendChild(fruitEl);
    
    setTimeout(() => {
        if (fruitEl.parentNode) fruitEl.remove();
    }, fallDuration);
}

// ========== کلیک روی میوه ==========
function handleFruitClick(fruitEl, fruit) {
    if (!gameActive) return;
    
    // Stop the game temporarily
    gameActive = false;
    clearInterval(fruitSpawnInterval);
    
    // انیمیشن انفجار میوه
    fruitEl.style.transform = 'scale(1.5)';
    fruitEl.style.opacity = '0';
    
    // ایجاد ذرات
    createParticles(fruitEl.offsetLeft, fruitEl.offsetTop, fruit.particle);
    
    setTimeout(() => fruitEl.remove(), 300);
    
    // دریافت هدیه از API
    fetchGift();
}

// ========== ایجاد ذرات انفجار ==========
function createParticles(x, y, particleEmoji) {
    const container = particleContainer || document.body;
    
    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.textContent = particleEmoji;
        particle.style.position = 'absolute';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.fontSize = '20px';
        particle.style.zIndex = '20';
        particle.style.pointerEvents = 'none';
        
        const angle = (Math.PI * 2 * i) / 12;
        const distance = 100 + Math.random() * 50;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        
        particle.style.setProperty('--tx', tx + 'px');
        particle.style.setProperty('--ty', ty + 'px');
        particle.style.animation = 'explode 1s ease-out forwards';
        
        container.appendChild(particle);
        
        setTimeout(() => particle.remove(), 1000);
    }
}

// ========== دریافت هدیه از API ==========
async function fetchGift() {
    // Show loading
    if (loading) loading.style.display = 'flex';
    
    // Hide game screen
    if (gameScreen) gameScreen.classList.remove('active');
    
    try {
        const response = await fetch('/api/get-gift.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_id: userId })
        });
        
        const data = await response.json();
        
        if (loading) loading.style.display = 'none';
        
        if (data.success && data.gift) {
            showGiftModal(data.gift);
        } else {
            alert(data.message || 'خطا در دریافت هدیه');
            // Return to game
            if (gameScreen) gameScreen.classList.add('active');
            gameActive = true;
            startGameFruits();
        }
    } catch (error) {
        if (loading) loading.style.display = 'none';
        console.error('API Error:', error);
        alert('خطا در ارتباط با سرور');
        // Return to game
        if (gameScreen) gameScreen.classList.add('active');
        gameActive = true;
        startGameFruits();
    }
}

// ========== نمایش مودال هدیه ==========
function showGiftModal(gift) {
    // Update gift info
    if (giftCode) giftCode.textContent = gift.code;
    
    // نمایش توضیحات اگر موجود باشد
    if (gift.description && giftDescription) {
        giftDescription.textContent = gift.description;
        giftDescription.style.display = 'block';
    } else if (giftDescription) {
        giftDescription.style.display = 'none';
    }
    
    // Show gift modal
    if (giftModal) giftModal.classList.add('active');
}

// ========== انیمیشن‌های CSS (fallback if not in CSS) ==========
if (!document.querySelector('#dynamic-animations')) {
    const style = document.createElement('style');
    style.id = 'dynamic-animations';
    style.textContent = `
        @keyframes fall {
            from { top: -100px; transform: rotate(0deg); }
            to { top: 100vh; transform: rotate(360deg); }
        }
        
        @keyframes explode {
            to {
                transform: translate(var(--tx), var(--ty));
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// ========== شروع خودکار ==========
console.log('Game v0.3.1 loaded - HTML ID matching fixed');
console.log('User input element:', userIdInput);
console.log('Start button:', startBtn);
