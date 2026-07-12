// Web Audio API Setup
let audioCtx;
let ambientOsc, ambientLFO, ambientGain;
let soundEnabled = true;

function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playSound(type) {
    if (!soundEnabled || !audioCtx) return;
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    const now = audioCtx.currentTime;
    
    switch (type) {
        case 'pop': { // Eating nutrient
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(650, now + 0.1);
            
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            
            osc.start(now);
            osc.stop(now + 0.1);
            break;
        }
        case 'zap': { // Hitting hazard
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.linearRampToValueAtTime(80, now + 0.25);
            
            // Add distortion or filter sweep
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'peaking';
            filter.frequency.setValueAtTime(1000, now);
            filter.frequency.linearRampToValueAtTime(200, now + 0.25);
            
            osc.disconnect(gain);
            osc.connect(filter);
            filter.connect(gain);
            
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            
            osc.start(now);
            osc.stop(now + 0.25);
            break;
        }
        case 'click': { // UI click
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            
            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            
            osc.start(now);
            osc.stop(now + 0.05);
            break;
        }
        case 'victory': {
            // Evolving arpeggio
            const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C Major
            notes.forEach((f, idx) => {
                const t = now + idx * 0.08;
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(f, t);
                
                gain.gain.setValueAtTime(0.12, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
                
                osc.start(t);
                osc.stop(t + 0.4);
            });
            break;
        }
        case 'gameover': {
            // Depressing downward sweep
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(110, now);
            osc.frequency.linearRampToValueAtTime(40, now + 0.8);
            
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.001, now + 0.8);
            
            osc.start(now);
            osc.stop(now + 0.8);
            break;
        }
    }
}

function startAmbientHum() {
    if (!soundEnabled || !audioCtx) return;
    stopAmbientHum();
    
    const now = audioCtx.currentTime;
    
    // Low drone oscillator
    ambientOsc = audioCtx.createOscillator();
    ambientGain = audioCtx.createGain();
    
    ambientOsc.type = 'triangle';
    ambientOsc.frequency.value = 55; // Low A
    
    // LFO to modulate volume/gain (creating a breathing throb)
    ambientLFO = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    
    ambientLFO.frequency.value = 0.55; // slow throb rate
    lfoGain.gain.value = 0.03; // depth
    
    ambientLFO.connect(lfoGain);
    lfoGain.connect(ambientGain.gain); // Modulate gain
    
    ambientGain.gain.value = 0.05; // Base volume
    
    ambientOsc.connect(ambientGain);
    ambientGain.connect(audioCtx.destination);
    
    ambientOsc.start(now);
    ambientLFO.start(now);
}

function stopAmbientHum() {
    if (ambientOsc) {
        try { ambientOsc.stop(); } catch(e){}
        ambientOsc = null;
    }
    if (ambientLFO) {
        try { ambientLFO.stop(); } catch(e){}
        ambientLFO = null;
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('sound-btn');
    if (soundEnabled) {
        initAudio();
        btn.textContent = '🔊 SOUND ON';
        playSound('click');
        if (gameRunning) {
            startAmbientHum();
        }
    } else {
        btn.textContent = '🔇 SOUND OFF';
        stopAmbientHum();
    }
}

function goToCatGame() {
    playSound('click');
    stopAmbientHum();
    window.location.href = 'index.html';
}

function goToCctvGame() {
    playSound('click');
    stopAmbientHum();
    window.location.href = 'cctv.html';
}

function goToHandGame() {
    playSound('click');
    stopAmbientHum();
    window.location.href = 'hand.html';
}

// Preload Images
const preloadedImages = {};
const nutrientsList = ["1_1", "1_4", "2_3", "3_2", "4_1", "4_4", "5_3"];
const hazardsList = ["1_2", "2_1", "2_4", "3_3", "4_2", "5_1", "5_4"];
const allKeys = [...nutrientsList, ...hazardsList];

allKeys.forEach(key => {
    preloadedImages[key] = new Image();
    preloadedImages[key].src = `extracted_masks/mask_${key}.png`;
});

// Canvas Game Engine
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
let animationFrameId;

// Game State
let gameRunning = false;
let score = 0;
let energy = 100;
let scoreToWin = 1000;
let mouseX = 0;
let mouseY = 0;
let screenShake = 0;

// Entities
let player;
let entities = [];
let particles = [];

// Microscope background image
const bgImage = new Image();
bgImage.src = 'extracted_photos/img_1_2.png'; // Using the lush green steps photo for background

class PlayerMicrobe {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 28;
        this.targetRadius = 28;
        this.vx = 0;
        this.vy = 0;
        this.speed = 4.5;
        this.nucleusAngle = 0;
    }
    
    update() {
        // Smoothly draw player radius to targetRadius
        this.radius += (this.targetRadius - this.radius) * 0.1;
        
        // Calculate vector to mouse
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 5) {
            // Ease/pull player towards mouse
            const targetVx = (dx / dist) * this.speed;
            const targetVy = (dy / dist) * this.speed;
            
            this.vx += (targetVx - this.vx) * 0.08;
            this.vy += (targetVy - this.vy) * 0.08;
        } else {
            this.vx *= 0.95;
            this.vy *= 0.95;
        }
        
        this.x += this.vx;
        this.y += this.vy;
        
        // Bounds checking
        if (this.x < this.radius) { this.x = this.radius; this.vx = 0; }
        if (this.x > canvas.width - this.radius) { this.x = canvas.width - this.radius; this.vx = 0; }
        if (this.y < this.radius) { this.y = this.radius; this.vy = 0; }
        if (this.y > canvas.height - this.radius) { this.y = canvas.height - this.radius; this.vy = 0; }
        
        // Animate nucleus
        this.nucleusAngle += 0.02;
    }
    
    draw() {
        ctx.save();
        
        // Draw glow/shadow
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#39ff14';
        
        // Outer membrane (organic, wobbly look)
        ctx.beginPath();
        const segments = 12;
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const wobble = Math.sin(angle * 3 + Date.now() * 0.005) * 2;
            const rx = this.x + Math.cos(angle) * (this.radius + wobble);
            const ry = this.y + Math.sin(angle) * (this.radius + wobble);
            if (i === 0) {
                ctx.moveTo(rx, ry);
            } else {
                ctx.lineTo(rx, ry);
            }
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(57, 255, 20, 0.25)';
        ctx.strokeStyle = '#39ff14';
        ctx.lineWidth = 2.5;
        ctx.fill();
        ctx.stroke();
        
        // Nucleus
        ctx.shadowBlur = 0;
        ctx.beginPath();
        const nx = this.x + Math.cos(this.nucleusAngle) * 5;
        const ny = this.y + Math.sin(this.nucleusAngle * 1.5) * 5;
        ctx.arc(nx, ny, this.radius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(57, 255, 20, 0.6)';
        ctx.fill();
        
        ctx.restore();
    }
}

class FloatingEntity {
    constructor(type) {
        this.type = type; // 'nutrient' (circular) or 'hazard' (triangular)
        this.reset();
        
        // Spawn slightly off-screen or randomly
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        
        // Ensure not too close to player initially
        if (player) {
            while (Math.hypot(this.x - player.x, this.y - player.y) < 150) {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
            }
        }
    }
    
    reset() {
        // Pick random cropped photo key based on type
        if (this.type === 'nutrient') {
            this.key = nutrientsList[Math.floor(Math.random() * nutrientsList.length)];
            this.radius = 20 + Math.random() * 8;
        } else {
            this.key = hazardsList[Math.floor(Math.random() * hazardsList.length)];
            this.radius = 18 + Math.random() * 6;
        }
        
        // Spawn randomly outside edge or on boundaries
        const side = Math.floor(Math.random() * 4);
        if (side === 0) { // Top
            this.x = Math.random() * canvas.width;
            this.y = -this.radius;
        } else if (side === 1) { // Right
            this.x = canvas.width + this.radius;
            this.y = Math.random() * canvas.height;
        } else if (side === 2) { // Bottom
            this.x = Math.random() * canvas.width;
            this.y = canvas.height + this.radius;
        } else { // Left
            this.x = -this.radius;
            this.y = Math.random() * canvas.height;
        }
        
        // Slow float speeds
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        // Bounds check to recycle
        if (this.x < -this.radius - 50 || this.x > canvas.width + this.radius + 50 ||
            this.y < -this.radius - 50 || this.y > canvas.height + this.radius + 50) {
            this.reset();
        }
    }
    
    draw() {
        ctx.save();
        
        // Draw shadow/glow depending on type
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.type === 'nutrient' ? '#39ff14' : '#ff3366';
        
        // Outer pulsing ring
        ctx.beginPath();
        const pulse = 1 + Math.sin(Date.now() * 0.005 + this.x) * 0.05;
        ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.strokeStyle = this.type === 'nutrient' ? 'rgba(57, 255, 20, 0.4)' : 'rgba(255, 51, 102, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.fill();
        ctx.stroke();
        
        // Draw preloaded mask image
        const img = preloadedImages[this.key];
        if (img && img.complete) {
            const size = this.radius * 2;
            ctx.drawImage(img, this.x - this.radius, this.y - this.radius, size, size);
        }
        
        ctx.restore();
    }
}

// Handle canvas resizing
function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}

// Mouse/Touch trackers
function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
}

function handleTouchMove(e) {
    if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.touches[0].clientX - rect.left;
        mouseY = e.touches[0].top;
    }
}

// Start Game Core
function startGame() {
    initAudio();
    
    // Toggle displays
    document.getElementById('start-overlay').classList.add('hidden');
    document.getElementById('gameover-overlay').classList.add('hidden');
    
    // Reset stats
    score = 0;
    energy = 100;
    screenShake = 0;
    document.getElementById('score-val').textContent = score;
    updateEnergyBar();
    
    // Initialize entities
    player = new PlayerMicrobe(canvas.width / 2, canvas.height / 2);
    entities = [];
    
    // Add 8 nutrients and 6 hazards
    for (let i = 0; i < 8; i++) entities.push(new FloatingEntity('nutrient'));
    for (let i = 0; i < 6; i++) entities.push(new FloatingEntity('hazard'));
    
    // Create random background bubble particles
    particles = [];
    for (let i = 0; i < 30; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: 1 + Math.random() * 3,
            vy: -0.2 - Math.random() * 0.4,
            alpha: 0.1 + Math.random() * 0.3
        });
    }
    
    // Reset inputs
    mouseX = canvas.width / 2;
    mouseY = canvas.height / 2;
    
    gameRunning = true;
    startAmbientHum();
    
    playSound('click');
    
    // Cancel any previous frames and kick off loops
    cancelAnimationFrame(animationFrameId);
    gameLoop();
}

// Decrease energy over time (microbe metabolism)
let lastEnergyTick = Date.now();

// Game render loop
function gameLoop() {
    if (!gameRunning) return;
    
    updateGame();
    drawGame();
    
    animationFrameId = requestAnimationFrame(gameLoop);
}

function updateGame() {
    // Metabolic energy decay
    const now = Date.now();
    if (now - lastEnergyTick > 1000) {
        energy -= 2.2; // gradual energy reduction
        if (energy <= 0) {
            energy = 0;
            endGame(false);
        }
        updateEnergyBar();
        lastEnergyTick = now;
    }
    
    player.update();
    
    // Update entities
    entities.forEach(entity => {
        entity.update();
        
        // Collision detection
        const dist = Math.hypot(player.x - entity.x, player.y - entity.y);
        const touchDist = player.radius + entity.radius - 8; // overlap offset
        
        if (dist < touchDist) {
            // Collision triggered
            handleCollision(entity);
        }
    });
    
    // Update background bubbles
    particles.forEach(p => {
        p.y += p.vy;
        if (p.y < -p.radius) {
            p.y = canvas.height + p.radius;
            p.x = Math.random() * canvas.width;
        }
    });
    
    // Screen shake recovery
    if (screenShake > 0) {
        screenShake -= 0.8;
    }
}

function handleCollision(entity) {
    if (entity.type === 'nutrient') {
        // Eat nutrient
        score += 25;
        energy += 12;
        if (energy > 100) energy = 100;
        
        // Grow player
        player.targetRadius = Math.min(60, player.targetRadius + 1.8);
        
        document.getElementById('score-val').textContent = score;
        updateEnergyBar();
        
        playSound('pop');
        
        // Respawn item
        entity.reset();
        
        // Winning condition
        if (score >= scoreToWin) {
            endGame(true);
        }
    } else {
        // Hit hazard
        score = Math.max(0, score - 15);
        energy = Math.max(0, energy - 16);
        
        // Shrink player
        player.targetRadius = Math.max(20, player.targetRadius - 3.5);
        
        document.getElementById('score-val').textContent = score;
        updateEnergyBar();
        
        // Camera rumble
        screenShake = 12;
        playSound('zap');
        
        entity.reset();
        
        if (energy <= 0) {
            endGame(false);
        }
    }
}

function updateEnergyBar() {
    document.getElementById('energy-bar').style.width = `${energy}%`;
}

function drawGame() {
    ctx.save();
    
    // Handle Screen Shake
    if (screenShake > 0) {
        const dx = (Math.random() - 0.5) * screenShake;
        const dy = (Math.random() - 0.5) * screenShake;
        ctx.translate(dx, dy);
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 1. Draw organic microscopic background image (tiled & blurred)
    if (bgImage.complete) {
        ctx.save();
        ctx.filter = 'blur(10px) brightness(0.18) sepia(0.3) hue-rotate(80deg)'; // microscope green blur
        
        // Draw background tiled or centered
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        ctx.restore();
    }
    
    // 2. Draw Microscope Grid Overlay
    ctx.save();
    ctx.strokeStyle = 'rgba(57, 255, 20, 0.03)';
    ctx.lineWidth = 1;
    
    // Grid Lines
    const step = 40;
    for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Draw concentric optical focus circles in the center
    ctx.strokeStyle = 'rgba(57, 255, 20, 0.05)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.height * 0.45, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.height * 0.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    
    // 3. Draw background bubble particles
    ctx.save();
    particles.forEach(p => {
        ctx.fillStyle = `rgba(100, 255, 150, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();
    
    // 4. Draw nutrients and hazards
    entities.forEach(entity => {
        entity.draw();
    });
    
    // 5. Draw player
    player.draw();
    
    ctx.restore();
}

function endGame(won) {
    gameRunning = false;
    stopAmbientHum();
    cancelAnimationFrame(animationFrameId);
    
    const overlay = document.getElementById('gameover-overlay');
    const title = document.getElementById('result-title');
    const desc = document.getElementById('result-desc');
    const finalScore = document.getElementById('final-score');
    
    finalScore.textContent = score;
    
    if (won) {
        title.className = 'success';
        title.textContent = '진화 성공! (EVOLVED)';
        desc.textContent = '충분한 영양소를 획득하여 고차원 다세포 유기체로 성숙 진화하는 데 성공했습니다!';
        playSound('victory');
    } else {
        title.className = 'fail';
        title.textContent = '소멸함 (DISSOLVED)';
        desc.textContent = '에너지가 고갈되어 미생물막이 무너지고 완전히 생체 분해되었습니다.';
        playSound('gameover');
    }
    
    overlay.classList.remove('hidden');
}

// Listeners
window.addEventListener('resize', resizeCanvas);
canvas.addEventListener('mousemove', handleMouseMove);
canvas.addEventListener('touchmove', handleTouchMove);

// Setup on load
window.onload = () => {
    resizeCanvas();
    mouseX = canvas.width / 2;
    mouseY = canvas.height / 2;
    
    // Draw initial empty frame with grid
    ctx.fillStyle = '#030c08';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
};
