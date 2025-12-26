// version: 0.3 - Game Logic with API v0.3 Integration
// ========== متغیرهای سراسری ==========

let userId = '';
let giftCount = 0;
let gameActive = false;
let fruitSpawnInterval;
let preGameSpawnInterval;

// عناصر DOM
const welcomeScreen = document.getElementById('welcomeScreen');
const gameScreen = document.getElementById('gameScreen');
const guideModal = document.getElementById('guideModal');
const giftModal = document.getElementById('giftModal');
const loading = document.getElementById('loading');
const userIdInput = document.getElementById('userId');
const startBtn = document.getElementById('startBtn');
const startGameBtn = document.getElementById('startGameBtn');
const continueBtn = document.getElementById('continueBtn');
const gameArea = document.getElementById('gameArea');
const displayUserId = document.getElementById('displayUserId');
const giftCountDisplay = document.getElementById('giftCount');
const particleContainer = document.getElementById('particleContainer');
const giftTitle = document.getElementById('giftTitle');
const giftCode = document.getElementById('giftCode');
const giftDescription = document.getElementById('giftDescription');

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

// ========== مدیریت ورود کاربر ==========

startBtn.addEventListener('click', () => {
    const inputUserId = userIdInput.value.trim();
    if (!inputUserId) {
        alert('لطفا شناسه کاربری خود را وارد کنید');
        return;
    }
    userId = inputUserId;
    displayUserId.textContent = userId;
    welcomeScreen.style.display = 'none';
    guideModal.style.display = 'flex';
    startPreGameFruits();  // شروع ریزش میوه‌های غیرقابل تعامل
});

// ========== شروع بازی ==========

startGameBtn.addEventListener('click', () => {
    guideModal.style.display = 'none';
    gameScreen.style.display = 'flex';
    gameActive = true;
    clearInterval(preGameSpawnInterval);  // توقف ریزش قبل از بازی
    startGameFruits();  // شروع ریزش میوه‌های قابل تعامل
});

continueBtn.addEventListener('click', () => {
    giftModal.style.display = 'none';
});

// ========== ریزش میوه‌ها قبل از شروع بازی ==========

function startPreGameFruits() {
    preGameSpawnInterval = setInterval(() => {
        if (document.querySelectorAll('.fruit').length < CONFIG.maxFruitsOnScreen) {
            spawnFruit(false);  // میوه غیرقابل کلیک
        }
    }, CONFIG.preGameInterval);
}

// ========== ریزش میوه‌ها در حین بازی ==========

function startGameFruits() {
    fruitSpawnInterval = setInterval(() => {
        if (document.querySelectorAll('.fruit').length < CONFIG.maxFruitsOnScreen) {
            spawnFruit(true);  // میوه قابل کلیک
        }
    }, CONFIG.gameInterval);
}

// ========== ایجاد میوه ==========

function spawnFruit(interactive) {
    const fruitType = Math.random() > 0.5 ? 'pomegranate' : 'watermelon';
    const fruit = FRUIT_TYPES[fruitType];
    
    const fruitEl = document.createElement('div');
    fruitEl.className = 'fruit';
    fruitEl.textContent = fruit.emoji;
    fruitEl.style.left = Math.random() * (window.innerWidth - CONFIG.fruitSize) + 'px';
    fruitEl.style.fontSize = CONFIG.fruitSize + 'px';
    fruitEl.dataset.type = fruitType;
    
    const fallDuration = Math.random() * 
        (CONFIG.fruitFallDuration[1] - CONFIG.fruitFallDuration[0]) + 
        CONFIG.fruitFallDuration[0];
    
    fruitEl.style.animation = `fall ${fallDuration}ms linear`;
    
    if (interactive && gameActive) {
        fruitEl.style.cursor = 'pointer';
        fruitEl.addEventListener('click', () => handleFruitClick(fruitEl, fruit));
    }
    
    gameArea.appendChild(fruitEl);
    
    setTimeout(() => {
        if (fruitEl.parentNode) fruitEl.remove();
    }, fallDuration);
}

// ========== کلیک روی میوه ==========

function handleFruitClick(fruitEl, fruit) {
    if (!gameActive) return;
    
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
    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.textContent = particleEmoji;
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        
        const angle = (Math.PI * 2 * i) / 12;
        const distance = 100 + Math.random() * 50;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        
        particle.style.setProperty('--tx', tx + 'px');
        particle.style.setProperty('--ty', ty + 'px');
        
        particleContainer.appendChild(particle);
        
        setTimeout(() => particle.remove(), 1000);
    }
}

// ========== دریافت هدیه از API ==========

async function fetchGift() {
    loading.style.display = 'flex';
    
    try {
        const response = await fetch('/api/get-gift.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_id: userId })
        });
        
        const data = await response.json();
        
        loading.style.display = 'none';
        
        if (data.success && data.gift) {
            giftCount++;
            giftCountDisplay.textContent = giftCount;
            showGiftModal(data.gift);
        } else {
            alert(data.message || 'خطا در دریافت هدیه');
        }
    } catch (error) {
        loading.style.display = 'none';
        console.error('API Error:', error);
        alert('خطا در ارتباط با سرور');
    }
}

// ========== نمایش مودال هدیه ==========

function showGiftModal(gift) {
    giftTitle.textContent = gift.name;
    giftCode.textContent = gift.code;
    
    // نمایش توضیحات اگر موجود باشد
    if (gift.description && giftDescription) {
        giftDescription.textContent = gift.description;
        giftDescription.style.display = 'block';
    } else if (giftDescription) {
        giftDescription.style.display = 'none';
    }
    
    giftModal.style.display = 'flex';
    
    // انیمیشن ورود مودال
    giftModal.querySelector('.modal-content').style.animation = 'slideIn 0.3s ease-out';
}

// ========== کپی کد هدیه ==========

function copyGiftCode() {
    const code = giftCode.textContent;
    navigator.clipboard.writeText(code).then(() => {
        alert('کد هدیه کپی شد: ' + code);
    }).catch(err => {
        console.error('Copy failed:', err);
    });
}

// ========== انیمیشن‌های CSS ==========

const style = document.createElement('style');
style.textContent = `
    @keyframes fall {
        from { top: -100px; transform: rotate(0deg); }
        to { top: 100vh; transform: rotate(360deg); }
    }
    
    @keyframes slideIn {
        from { transform: translateY(-50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    
    .fruit {
        position: absolute;
        transition: transform 0.3s, opacity 0.3s;
        z-index: 10;
        user-select: none;
    }
    
    .particle {
        position: absolute;
        font-size: 20px;
        animation: explode 1s ease-out forwards;
        pointer-events: none;
        z-index: 20;
    }
    
    @keyframes explode {
        to {
            transform: translate(var(--tx), var(--ty));
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ========== شروع خودکار ==========
console.log('Game v0.3 loaded - API Integration Ready');
