// Audio Context & Sound Synthesis
let audioCtx;
let soundEnabled = true;
let alarmInterval;
let ambientDrone;

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
        case 'static': { // Switch channel static click
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.exponentialRampToValueAtTime(10, now + 0.08);
            
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            
            osc.start(now);
            osc.stop(now + 0.08);
            break;
        }
        case 'beep': { // Successful report
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.setValueAtTime(900, now + 0.07);
            
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            
            osc.start(now);
            osc.stop(now + 0.2);
            break;
        }
        case 'error': { // Incorrect report
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.setValueAtTime(130, now + 0.1);
            
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            
            osc.start(now);
            osc.stop(now + 0.25);
            break;
        }
        case 'alarm': { // Overload warning alarm
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.linearRampToValueAtTime(440, now + 0.25);
            
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            
            osc.start(now);
            osc.stop(now + 0.25);
            break;
        }
        case 'morning': { // 6 AM victory chime
            const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C major bright chime
            freqs.forEach((f, idx) => {
                const t = now + idx * 0.12;
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(f, t);
                
                gain.gain.setValueAtTime(0.15, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
                
                osc.start(t);
                osc.stop(t + 0.6);
            });
            break;
        }
    }
}

function startAmbientDrone() {
    if (!soundEnabled || !audioCtx) return;
    stopAmbientDrone();
    
    // Low hum representing observation room atmosphere
    ambientDrone = audioCtx.createOscillator();
    const droneGain = audioCtx.createGain();
    
    ambientDrone.type = 'sine';
    ambientDrone.frequency.value = 65; // low hum
    
    droneGain.gain.value = 0.05;
    
    ambientDrone.connect(droneGain);
    droneGain.connect(audioCtx.destination);
    
    ambientDrone.start();
}

function stopAmbientDrone() {
    if (ambientDrone) {
        try { ambientDrone.stop(); } catch(e){}
        ambientDrone = null;
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('sound-btn');
    if (soundEnabled) {
        initAudio();
        btn.textContent = '🔊 SOUND ON';
        playSound('static');
        if (gameRunning) {
            startAmbientDrone();
        }
    } else {
        btn.textContent = '🔇 SOUND OFF';
        stopAmbientDrone();
        clearInterval(alarmInterval);
    }
}

function goToMenu() {
    playSound('static');
    stopAmbientDrone();
    clearInterval(alarmInterval);
    window.location.href = 'index.html';
}

function goToMicrobeGame() {
    playSound('static');
    stopAmbientDrone();
    clearInterval(alarmInterval);
    window.location.href = 'microbe.html';
}

function goToHandGame() {
    playSound('static');
    stopAmbientDrone();
    clearInterval(alarmInterval);
    window.location.href = 'hand.html';
}

// Game Settings & Assets Info
const cameras = [
    { id: "CAM_01", name: "골목길 고양이 급식소", node: "1_1", photo: "extracted_photos/img_1_1.png", catPos: { x: 0.45, y: 0.7 }, eyePos: { x: 0.8, y: 0.3 } },
    { id: "CAM_02", name: "돌축대 계단 아래", node: "2_2", photo: "extracted_photos/img_2_2.png", catPos: { x: 0.3, y: 0.5 }, eyePos: { x: 0.75, y: 0.35 } },
    { id: "CAM_03", name: "소월문 갤러리 벽면", node: "3_3", photo: "extracted_photos/img_3_3.png", catPos: { x: 0.6, y: 0.65 }, eyePos: { x: 0.15, y: 0.45 } },
    { id: "CAM_04", name: "보안 감시 골목 철문", node: "3_4", photo: "extracted_photos/img_3_4.png", catPos: { x: 0.5, y: 0.8 }, eyePos: { x: 0.85, y: 0.6 } },
    { id: "CAM_05", name: "백구 동상 전시장 앞", node: "4_1", photo: "extracted_photos/img_4_1.png", catPos: { x: 0.25, y: 0.6 }, eyePos: { x: 0.9, y: 0.2 } },
    { id: "CAM_06", name: "이태원 남산 옥상 전망", node: "5_3", photo: "extracted_photos/img_5_3.png", catPos: { x: 0.7, y: 0.75 }, eyePos: { x: 0.1, y: 0.8 } }
];

const preloadedImages = {};
cameras.forEach(cam => {
    preloadedImages[cam.id] = new Image();
    preloadedImages[cam.id].src = cam.photo;
});

// Game state variables
let gameRunning = false;
let activeCamIdx = 0;
let timeLimitSec = 180; // 3 minutes total
let timeElapsed = 0;
let activeAnomalies = [];
let maxAnomalies = 4;
let gameTimer, anomalySpawnTimer, clockTimer;
let warningActive = false;

// DOM Setup
const monitorsGrid = document.getElementById('monitors-grid');
const viewerCanvas = document.getElementById('viewer-canvas');
const vCtx = viewerCanvas.getContext('2d');
const termFeed = document.getElementById('terminal-feed');
const counterDisplay = document.getElementById('anomaly-counter');
const clockDisplay = document.getElementById('clock-val');

// Initialize monitors layout
function createMonitors() {
    monitorsGrid.innerHTML = '';
    cameras.forEach((cam, idx) => {
        const screen = document.createElement('div');
        screen.className = 'monitor-screen';
        screen.id = `monitor-${idx}`;
        if (idx === activeCamIdx) screen.classList.add('active');
        
        const canvasEl = document.createElement('canvas');
        canvasEl.className = 'monitor-canvas';
        screen.appendChild(canvasEl);
        
        const overlay = document.createElement('div');
        overlay.className = 'monitor-overlay';
        overlay.innerHTML = `
            <div class="cam-name">${cam.id} - ${cam.name}</div>
            <div style="display: flex; justify-content: space-between;">
                <span>15F/S</span>
                <span class="rec-dot">● REC</span>
            </div>
        `;
        screen.appendChild(overlay);
        
        screen.onclick = () => {
            selectCamera(idx);
        };
        
        monitorsGrid.appendChild(screen);
    });
    
    // Set sizing
    resizeMonitorCanvases();
}

function resizeMonitorCanvases() {
    cameras.forEach((cam, idx) => {
        const screen = document.getElementById(`monitor-${idx}`);
        const canvasEl = screen.querySelector('.monitor-canvas');
        canvasEl.width = screen.clientWidth;
        canvasEl.height = screen.clientHeight;
    });
    
    viewerCanvas.width = viewerCanvas.parentElement.clientWidth;
    viewerCanvas.height = viewerCanvas.parentElement.clientHeight;
}

// Select CCTV channel
function selectCamera(idx) {
    if (activeCamIdx === idx && gameRunning) return;
    
    const prevScreen = document.getElementById(`monitor-${activeCamIdx}`);
    if (prevScreen) prevScreen.classList.remove('active');
    
    activeCamIdx = idx;
    
    const nextScreen = document.getElementById(`monitor-${activeCamIdx}`);
    if (nextScreen) nextScreen.classList.add('active');
    
    document.getElementById('cam-tag').textContent = `${cameras[idx].id} - ${cameras[idx].name}`;
    
    playSound('static');
    logToTerminal(`[INFO] 모니터 신호 수신: ${cameras[idx].id}`, 'system-line');
    
    renderViewer();
}

// Start game shift
function startGame() {
    initAudio();
    
    document.getElementById('start-overlay').classList.add('hidden');
    document.getElementById('result-overlay').classList.add('hidden');
    
    activeCamIdx = 0;
    timeElapsed = 0;
    activeAnomalies = [];
    warningActive = false;
    counterDisplay.className = '';
    counterDisplay.textContent = '0 / 4';
    
    termFeed.innerHTML = '<div class="log-line system-line">[SYSTEM] 야간 감시 콘솔 초기화...</div>';
    
    createMonitors();
    selectCamera(0);
    
    gameRunning = true;
    startAmbientDrone();
    
    // Spawning timer, Shift clock timer, and master clock
    clearInterval(gameTimer);
    clearInterval(anomalySpawnTimer);
    clearInterval(clockTimer);
    
    gameTimer = setInterval(tickGame, 1000);
    anomalySpawnTimer = setInterval(spawnAnomaly, 12000); // spawn anomaly every 12 sec
    
    logToTerminal("[ALERT] 야간 12:00 AM 교대 근무 시작. 관제 임무 개시.", 'warn-line');
    
    // First render frame
    requestAnimationFrame(renderLoop);
}

// Tick game time (1 sec real time = 2 minutes game time)
// 180 seconds total: 12:00 AM to 6:00 AM (6 hours = 360 game minutes)
// 360 / 180 = 2 game minutes per 1 real second
function tickGame() {
    timeElapsed += 1;
    
    // Calculate display time
    const gameMinutes = timeElapsed * 2;
    const hour = Math.floor(gameMinutes / 60);
    const min = gameMinutes % 60;
    const formattedHour = (hour === 0) ? 12 : hour;
    const formattedMin = String(min).padStart(2, '0');
    clockDisplay.textContent = `${formattedHour}:${formattedMin} AM`;
    
    // Win check
    if (timeElapsed >= timeLimitSec) {
        endGame(true);
    }
    
    // Overload checks
    const count = activeAnomalies.filter(a => !a.cleared).length;
    counterDisplay.textContent = `${count} / ${maxAnomalies}`;
    
    if (count >= 3) {
        counterDisplay.className = 'danger';
        if (!warningActive) {
            warningActive = true;
            logToTerminal("[CRITICAL] 경고: 다수의 이상 신호 활성화됨. 서버 과부하 임박!", 'error-line');
            startAlarmAudio();
        }
    } else {
        counterDisplay.className = '';
        if (warningActive) {
            warningActive = false;
            stopAlarmAudio();
            logToTerminal("[INFO] 시스템 리소스 상태 복구됨.", 'system-line');
        }
    }
    
    // Fail check
    if (count >= maxAnomalies) {
        endGame(false);
    }
}

function startAlarmAudio() {
    clearInterval(alarmInterval);
    alarmInterval = setInterval(() => {
        playSound('alarm');
    }, 1200);
}

function stopAlarmAudio() {
    clearInterval(alarmInterval);
}

// Spawn random anomaly in a camera screen
function spawnAnomaly() {
    if (!gameRunning) return;
    
    const count = activeAnomalies.filter(a => !a.cleared).length;
    if (count >= maxAnomalies) return;
    
    // Find cams without an active anomaly
    const freeCamIndices = [];
    cameras.forEach((cam, idx) => {
        const hasActive = activeAnomalies.some(a => a.camIdx === idx && !a.cleared);
        if (!hasActive) {
            freeCamIndices.push(idx);
        }
    });
    
    if (freeCamIndices.length === 0) return;
    
    // Select random camera
    const selectedCamIdx = freeCamIndices[Math.floor(Math.random() * freeCamIndices.length)];
    
    // Select random type
    const types = ['cat', 'glitch', 'eyes', 'alert'];
    const selectedType = types[Math.floor(Math.random() * types.length)];
    
    activeAnomalies.push({
        camIdx: selectedCamIdx,
        type: selectedType,
        cleared: false,
        spawnTime: Date.now()
    });
    
    // Apply hazard border class
    const screen = document.getElementById(`monitor-${selectedCamIdx}`);
    if (screen) screen.classList.add('has-anomaly');
    
    logToTerminal(`[WARNING] 카메라 ${cameras[selectedCamIdx].id} 신호 왜곡 감지됨.`, 'warn-line');
}

// Log line helper
function logToTerminal(msg, className = 'system-line') {
    const line = document.createElement('div');
    line.className = `log-line ${className}`;
    const timestamp = clockDisplay.textContent;
    line.textContent = `[${timestamp}] ${msg}`;
    termFeed.appendChild(line);
    termFeed.scrollTop = termFeed.scrollHeight;
}

// Render active viewer viewport
function renderViewer() {
    const cam = cameras[activeCamIdx];
    const img = preloadedImages[cam.id];
    
    vCtx.clearRect(0, 0, viewerCanvas.width, viewerCanvas.height);
    
    if (img && img.complete) {
        // Draw background fit to canvas
        const ratio = Math.min(viewerCanvas.width / img.width, viewerCanvas.height / img.height);
        const w = img.width * ratio;
        const h = img.height * ratio;
        const x = (viewerCanvas.width - w) / 2;
        const y = (viewerCanvas.height - h) / 2;
        
        vCtx.drawImage(img, x, y, w, h);
        
        // Render active anomaly overlay if present
        const anomaly = activeAnomalies.find(a => a.camIdx === activeCamIdx && !a.cleared);
        if (anomaly) {
            drawAnomalyOverlay(vCtx, anomaly.type, x, y, w, h, cam);
        }
    }
}

// Draw the graphical details of anomalies
function drawAnomalyOverlay(ctx, type, x, y, w, h, cam) {
    ctx.save();
    
    switch (type) {
        case 'cat': {
            // Draw a cute yellow glowing cat emoji on the specified coordinate of this photo
            const cx = x + w * cam.catPos.x;
            const cy = y + h * cam.catPos.y;
            
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00ffcc';
            ctx.font = '45px Share Tech Mono';
            ctx.fillStyle = '#00ffcc';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🐈', cx, cy);
            break;
        }
        case 'glitch': {
            // Overlay horizontal screen glitch slices and random RGB static
            ctx.fillStyle = 'rgba(0, 255, 204, 0.08)';
            for (let i = 0; i < 8; i++) {
                const sliceY = y + Math.random() * h;
                const sliceH = 5 + Math.random() * 20;
                ctx.fillRect(x, sliceY, w, sliceH);
            }
            
            // Random static blocks
            ctx.strokeStyle = 'rgba(255, 0, 100, 0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + Math.random() * (w - 100), y + Math.random() * (h - 100), 80, 50);
            break;
        }
        case 'eyes': {
            // Draw two small neon red glowing circles in the dark
            const ex = x + w * cam.eyePos.x;
            const ey = y + h * cam.eyePos.y;
            
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ff3333';
            ctx.fillStyle = '#ff3333';
            
            // Left eye
            ctx.beginPath();
            ctx.arc(ex - 8, ey, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Right eye
            ctx.beginPath();
            ctx.arc(ex + 8, ey, 4, 0, Math.PI * 2);
            ctx.fill();
            break;
        }
        case 'alert': {
            // Draw bright red graffiti text on the wall
            const tx = x + w * 0.5;
            const ty = y + h * 0.3;
            
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#ff0033';
            ctx.font = 'bold 30px Share Tech Mono';
            ctx.fillStyle = '#ff0033';
            ctx.textAlign = 'center';
            ctx.fillText('WARNING: WATCHING', tx, ty);
            break;
        }
    }
    
    ctx.restore();
}

// Render loop for all 6 monitors in the grid
function renderLoop() {
    if (!gameRunning) return;
    
    cameras.forEach((cam, idx) => {
        const screen = document.getElementById(`monitor-${idx}`);
        const canvasEl = screen.querySelector('.monitor-canvas');
        const ctxEl = canvasEl.getContext('2d');
        const img = preloadedImages[cam.id];
        
        ctxEl.clearRect(0, 0, canvasEl.width, canvasEl.height);
        
        if (img && img.complete) {
            ctxEl.drawImage(img, 0, 0, canvasEl.width, canvasEl.height);
            
            // Render anomaly on monitor if active
            const anomaly = activeAnomalies.find(a => a.camIdx === idx && !a.cleared);
            if (anomaly) {
                drawAnomalyOverlay(ctxEl, anomaly.type, 0, 0, canvasEl.width, canvasEl.height, cam);
                
                // Add noise scan distortion to glitch anomalies
                if (anomaly.type === 'glitch') {
                    ctxEl.fillStyle = 'rgba(255, 255, 255, 0.08)';
                    for (let i = 0; i < 5; i++) {
                        ctxEl.fillRect(0, Math.random() * canvasEl.height, canvasEl.width, 2);
                    }
                }
            }
        }
    });
    
    // Also update main view in case of active glitch animation
    renderViewer();
    
    requestAnimationFrame(renderLoop);
}

// Submit report to clear anomaly
function submitReport() {
    if (!gameRunning) return;
    
    const typeSelect = document.getElementById('anomaly-type');
    const selectedType = typeSelect.value;
    
    if (!selectedType) {
        logToTerminal(`[WARNING] 현상 분류를 선택하지 않았습니다.`, 'warn-line');
        return;
    }
    
    // Check if selected camera has active anomaly of selected type
    const anomalyIdx = activeAnomalies.findIndex(a => a.camIdx === activeCamIdx && a.type === selectedType && !a.cleared);
    
    if (anomalyIdx !== -1) {
        // Correct report!
        activeAnomalies[anomalyIdx].cleared = true;
        
        // Remove blinking border from monitor
        const screen = document.getElementById(`monitor-${activeCamIdx}`);
        if (screen) screen.classList.remove('has-anomaly');
        
        playSound('beep');
        logToTerminal(`[SUCCESS] 보고 수리됨: ${cameras[activeCamIdx].id} - ${typeSelect.options[typeSelect.selectedIndex].text}`, 'success-line');
        
        // Reset dropdown
        typeSelect.value = '';
        
        // Redraw immediately
        renderViewer();
    } else {
        // Incorrect report!
        playSound('error');
        logToTerminal(`[ERROR] 신호 무효: ${cameras[activeCamIdx].id}에 해당 현상(${selectedType}) 없음.`, 'error-line');
    }
}

// Game shift end
function endGame(won) {
    gameRunning = false;
    stopAmbientDrone();
    stopAlarmAudio();
    
    clearInterval(gameTimer);
    clearInterval(anomalySpawnTimer);
    
    const overlay = document.getElementById('result-overlay');
    const title = document.getElementById('result-title');
    const desc = document.getElementById('result-desc');
    
    if (won) {
        title.className = '';
        title.textContent = '근무 성공 (SHIFT CLEARED)';
        desc.textContent = '오전 06:00 종료. 모든 골목길 보안 위협 및 고양이 침입 징후를 성공적으로 보고하고 안전하게 교대했습니다.';
        playSound('morning');
    } else {
        title.className = 'danger';
        title.textContent = '관제 실패 (SYSTEM CRASH)';
        desc.textContent = '야간 이상 신호 누적으로 인해 관제 서버 및 CCTV 네트워크 통제권이 유실되었습니다.';
        playSound('error');
    }
    
    overlay.classList.remove('hidden');
}

// Handle window resize
window.onresize = () => {
    resizeMonitorCanvases();
    renderViewer();
};

window.onload = () => {
    resizeMonitorCanvases();
    selectCamera(0);
};
