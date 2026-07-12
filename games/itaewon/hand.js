// Web Audio API Synthesis
let audioCtx;
let soundEnabled = true;
let drawOsc, drawGain;
let drawingAudioActive = false;

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
        case 'pop': { // Collage element pop-up sound
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(1000, now + 0.08);
            
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            
            osc.start(now);
            osc.stop(now + 0.08);
            break;
        }
        case 'success': { // Stage cleared chord
            const notes = [329.63, 392.00, 523.25, 659.25]; // E4, G4, C5, E5
            notes.forEach((f, idx) => {
                const t = now + idx * 0.06;
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(f, t);
                
                gain.gain.setValueAtTime(0.1, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
                
                osc.start(t);
                osc.stop(t + 0.3);
            });
            break;
        }
        case 'victory': { // Chime swell
            const notes = [261.63, 329.63, 392.00, 523.25, 587.33, 659.25, 783.99, 1046.50];
            notes.forEach((f, idx) => {
                const t = now + idx * 0.08;
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(f, t);
                
                gain.gain.setValueAtTime(0.12, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
                
                osc.start(t);
                osc.stop(t + 0.5);
            });
            break;
        }
        case 'click': {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(900, now);
            
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            
            osc.start(now);
            osc.stop(now + 0.05);
            break;
        }
    }
}

// Theremin drawing sound: changes pitch based on index finger height (Y)
function startDrawingSound() {
    if (!soundEnabled || !audioCtx || drawingAudioActive) return;
    
    const now = audioCtx.currentTime;
    drawOsc = audioCtx.createOscillator();
    drawGain = audioCtx.createGain();
    
    drawOsc.type = 'triangle'; // smooth synth sound
    drawOsc.frequency.setValueAtTime(300, now);
    
    // low volume
    drawGain.gain.setValueAtTime(0.04, now);
    
    drawOsc.connect(drawGain);
    drawGain.connect(audioCtx.destination);
    
    drawOsc.start(now);
    drawingAudioActive = true;
}

function updateDrawingSound(normY) {
    if (!drawingAudioActive || !drawOsc) return;
    const now = audioCtx.currentTime;
    // Map Y coordinate (0-1) to pitch frequency (150Hz to 550Hz)
    // Invert so higher finger = higher pitch
    const pitch = 150 + (1 - normY) * 400;
    drawOsc.frequency.setTargetAtTime(pitch, now, 0.05);
}

function stopDrawingSound() {
    if (drawOsc && drawingAudioActive) {
        try {
            drawOsc.stop();
        } catch(e){}
        drawOsc = null;
        drawingAudioActive = false;
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('sound-btn');
    if (soundEnabled) {
        initAudio();
        btn.textContent = '🔊 SOUND ON';
        playSound('click');
    } else {
        btn.textContent = '🔇 SOUND OFF';
        stopDrawingSound();
    }
}

function goToMenu() {
    playSound('click');
    stopDrawingSound();
    window.location.href = 'index.html';
}

function goToMicrobeGame() {
    playSound('click');
    stopDrawingSound();
    window.location.href = 'microbe.html';
}

function goToCctvGame() {
    playSound('click');
    stopDrawingSound();
    window.location.href = 'cctv.html';
}

// Collages Setup: mapping cropped photos to layers
const collageAssets = {
    stage1: [ // Background (Rooftops, basecamp, sky line)
        { key: "2_3", file: "extracted_photos/img_2_3.png" }, // Basecamp Namsan
        { key: "5_2", file: "extracted_photos/img_5_2.png" }, // Rooftop night west
        { key: "5_3", file: "extracted_photos/img_5_3.png" }, // Rooftop night lookout
        { key: "5_1", file: "extracted_photos/img_5_1.png" }  // Streetlight night
    ],
    stage2: [ // Midground (Buildings, signs, steps)
        { key: "1_3", file: "extracted_photos/img_1_3.png" }, // Red gate
        { key: "3_3", file: "extracted_photos/img_3_3.png" }, // sowolMoon sign
        { key: "3_2", file: "extracted_photos/img_3_2.png" }, // Windows
        { key: "2_2", file: "extracted_photos/img_2_2.png" }  // Stone wall steps
    ],
    stage3: [ // Foreground (Close-ups, plants, animals, indicators)
        { key: "1_1", file: "extracted_photos/img_1_1.png" }, // Cat food base
        { key: "2_1", file: "extracted_photos/img_2_1.png" }, // Car top cat
        { key: "1_2", file: "extracted_photos/img_1_2.png" }, // Wooden steps garden
        { key: "1_4", file: "extracted_photos/img_1_4.png" }, // Plants bench
        { key: "2_4", file: "extracted_photos/img_2_4.png" }  // Bollards
    ]
};

// Preload collage image files
const imagesMap = {};
Object.keys(collageAssets).forEach(stage => {
    collageAssets[stage].forEach(asset => {
        imagesMap[asset.key] = new Image();
        imagesMap[asset.key].src = asset.file;
    });
});

// Canvas & Camera handles
const video = document.getElementById('webcam');
const sCanvas = document.getElementById('sketch-canvas');
const sCtx = sCanvas.getContext('2d');
const pCanvas = document.getElementById('preview-canvas');
const pCtx = pCanvas.getContext('2d');
const termFeed = document.getElementById('terminal-feed');

function logToTerminal(msg, className = 'system-line') {
    if (!termFeed) return;
    const line = document.createElement('div');
    line.className = `log-line ${className}`;
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric", second: "numeric" });
    line.textContent = `[${time}] ${msg}`;
    termFeed.appendChild(line);
    termFeed.scrollTop = termFeed.scrollHeight;
}

// Game State
let currentStage = 1; // 1, 2, 3
let gameRunning = false;
let trackingActive = false;

// Drawing state for the current stage
let drawnPoints = []; // coordinates [{x, y}]
let spawnedCollages = []; // [{x, y, imgKey, size}]
let allStagesData = {
    stage1: { points: [], collages: [] },
    stage2: { points: [], collages: [] },
    stage3: { points: [], collages: [] }
};

// Smoothing coordinates
let smoothX = 0;
let smoothY = 0;

// Setup sizes
function resizeCanvases() {
    sCanvas.width = sCanvas.parentElement.clientWidth;
    sCanvas.height = sCanvas.parentElement.clientHeight;
    
    pCanvas.width = pCanvas.parentElement.clientWidth;
    pCanvas.height = pCanvas.parentElement.clientHeight;
}

// MediaPipe Results Handler
function onResults(results) {
    if (!gameRunning) return;
    
    // Draw mirrored webcam feed into the preview box
    pCtx.save();
    pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
    pCtx.drawImage(results.image, 0, 0, pCanvas.width, pCanvas.height);
    pCtx.restore();
    
    // Check if hands detected
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        if (!trackingActive) {
            trackingActive = true;
            document.getElementById('tracking-status').textContent = 'ACTIVE';
            document.getElementById('tracking-status').className = '';
            logToTerminal(`[SYSTEM] 손가락 인식됨. 드로잉 가능.`, 'system-line');
        }
        
        // Grab index finger tip (Landmark 8)
        const hand = results.multiHandLandmarks[0];
        const tip = hand[8];
        
        // Mirror X-coordinate (1 - tip.x) so left/right matches screen
        const targetX = (1 - tip.x) * sCanvas.width;
        const targetY = tip.y * sCanvas.height;
        const normY = tip.y;
        
        // Easing interpolation
        if (smoothX === 0 && smoothY === 0) {
            smoothX = targetX;
            smoothY = targetY;
        } else {
            smoothX += (targetX - smoothX) * 0.25;
            smoothY += (targetY - smoothY) * 0.25;
        }
        
        handleDrawing(smoothX, smoothY, normY);
    } else {
        if (trackingActive) {
            trackingActive = false;
            document.getElementById('tracking-status').textContent = 'WAITING';
            document.getElementById('tracking-status').className = 'waiting';
            logToTerminal(`[SYSTEM] 손가락 위치 유실됨. 드로잉 대기.`, 'system-line');
            stopDrawingSound();
        }
    }
    
    // Render the drawing scene frame
    renderScene();
}

// Draw logic
function handleDrawing(x, y, normY) {
    const minStartPercent = 0.12; // Start from left 12%
    const maxEndPercent = 0.88; // Ends at right 88%
    
    const progressPercent = x / sCanvas.width;
    
    // Check start
    if (drawnPoints.length === 0) {
        if (progressPercent < minStartPercent) {
            drawnPoints.push({ x, y });
            startDrawingSound();
            logToTerminal(`[스케치] 능선 ${currentStage} 드로잉 시작.`, 'info-line');
        }
    } else {
        const lastPt = drawnPoints[drawnPoints.length - 1];
        
        // We must progress to the right to draw continuously
        if (x > lastPt.x + 3) {
            // Fill coordinates gap between last index and current index
            drawnPoints.push({ x, y });
            updateDrawingSound(normY);
            
            // Spawn collage element every 70px along the line
            const lastCollage = spawnedCollages[spawnedCollages.length - 1];
            if (!lastCollage || x - lastCollage.x > 75) {
                spawnCollage(x, y);
            }
            
            // Check end
            if (progressPercent > maxEndPercent) {
                completeStage();
            }
        }
    }
    
    // Update progress HUD
    const maxProgress = Math.max(0, Math.min(100, Math.round(((progressPercent - minStartPercent) / (maxEndPercent - minStartPercent)) * 100)));
    document.getElementById('draw-progress').style.width = `${drawnPoints.length > 0 ? maxProgress : 0}%`;
}

// Spawn collage element sitting on the ridge
function spawnCollage(x, y) {
    const list = collageAssets[`stage${currentStage}`];
    const asset = list[Math.floor(Math.random() * list.length)];
    
    // Size scales depending on stage (Background is smaller, Foreground is larger)
    let size = 45;
    if (currentStage === 2) size = 58;
    if (currentStage === 3) size = 70;
    
    spawnedCollages.push({
        x,
        y,
        key: asset.key,
        size
    });
    
    playSound('pop');
}

// Clear current drawing layer
function completeStage() {
    stopDrawingSound();
    playSound('success');
    
    logToTerminal(`[성공] 능선 ${currentStage} 레이어 드로잉 완료!`, 'success-line');
    
    // Save data
    allStagesData[`stage${currentStage}`] = {
        points: [...drawnPoints],
        collages: [...spawnedCollages]
    };
    
    // Reset temporary buffers
    drawnPoints = [];
    spawnedCollages = [];
    smoothX = 0;
    smoothY = 0;
    
    if (currentStage < 3) {
        currentStage++;
        const stageLabels = ["", "능선 1 (배경 산맥)", "능선 2 (이태원 골목길)", "능선 3 (근경 수풀/바리케이드)"];
        document.getElementById('stage-val').textContent = stageLabels[currentStage];
        document.getElementById('draw-progress').style.width = '0%';
        logToTerminal(`[SYSTEM] 레이어 대기: ${stageLabels[currentStage]} 단계를 시작하세요.`, 'system-line');
    } else {
        // All layers completed!
        finishDrawingGame();
    }
}

// Render overall scene on canvas
function renderScene() {
    sCtx.clearRect(0, 0, sCanvas.width, sCanvas.height);
    
    // Draw grid background
    sCtx.save();
    sCtx.strokeStyle = 'rgba(0, 229, 255, 0.04)';
    sCtx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x < sCanvas.width; x += step) {
        sCtx.beginPath();
        sCtx.moveTo(x, 0);
        sCtx.lineTo(x, sCanvas.height);
        sCtx.stroke();
    }
    for (let y = 0; y < sCanvas.height; y += step) {
        sCtx.beginPath();
        sCtx.moveTo(0, y);
        sCtx.lineTo(sCanvas.width, y);
        sCtx.stroke();
    }
    sCtx.restore();
    
    // Draw all completed stages
    for (let stageNum = 1; stageNum <= 3; stageNum++) {
        const stageKey = `stage${stageNum}`;
        
        let pts, colls;
        if (stageNum === currentStage) {
            pts = drawnPoints;
            colls = spawnedCollages;
        } else {
            pts = allStagesData[stageKey].points;
            colls = allStagesData[stageKey].collages;
        }
        
        if (pts.length === 0) continue;
        
        // Style variables based on stage
        let strokeColor = '#00e5ff'; // stage 1
        let fillColor = 'rgba(0, 229, 255, 0.08)';
        if (stageNum === 2) {
            strokeColor = '#ff0077';
            fillColor = 'rgba(255, 0, 119, 0.08)';
        } else if (stageNum === 3) {
            strokeColor = '#ffea00';
            fillColor = 'rgba(255, 234, 0, 0.08)';
        }
        
        // 1. Draw filled area below the ridge
        sCtx.save();
        sCtx.beginPath();
        sCtx.moveTo(pts[0].x, sCanvas.height);
        pts.forEach(p => {
            sCtx.lineTo(p.x, p.y);
        });
        sCtx.lineTo(pts[pts.length - 1].x, sCanvas.height);
        sCtx.closePath();
        sCtx.fillStyle = fillColor;
        sCtx.fill();
        sCtx.restore();
        
        // 2. Draw the glowing neon ridge line
        sCtx.save();
        sCtx.beginPath();
        sCtx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
            sCtx.lineTo(pts[i].x, pts[i].y);
        }
        sCtx.strokeStyle = strokeColor;
        sCtx.lineWidth = 3.5;
        sCtx.shadowBlur = 10;
        sCtx.shadowColor = strokeColor;
        sCtx.stroke();
        sCtx.restore();
        
        // 3. Draw collage photos on top of the ridge
        sCtx.save();
        colls.forEach(col => {
            const img = imagesMap[col.key];
            if (img && img.complete) {
                // Glow effect around collage items
                sCtx.shadowBlur = 4;
                sCtx.shadowColor = strokeColor;
                
                // Draw photo sitting on top of the y coordinates
                sCtx.drawImage(img, col.x - col.size/2, col.y - col.size, col.size, col.size);
            }
        });
        sCtx.restore();
    }
    
    // Draw tracking cursor over the index finger tip position
    if (trackingActive && smoothX > 0 && smoothY > 0) {
        sCtx.save();
        sCtx.shadowBlur = 15;
        sCtx.shadowColor = '#00ff66';
        sCtx.strokeStyle = '#00ff66';
        sCtx.lineWidth = 2;
        sCtx.beginPath();
        sCtx.arc(smoothX, smoothY, 12, 0, Math.PI * 2);
        sCtx.fillStyle = 'rgba(0, 255, 102, 0.2)';
        sCtx.fill();
        sCtx.stroke();
        
        // Crosshair
        sCtx.beginPath();
        sCtx.moveTo(smoothX - 18, smoothY); sCtx.lineTo(smoothX + 18, smoothY);
        sCtx.moveTo(smoothX, smoothY - 18); sCtx.lineTo(smoothX, smoothY + 18);
        sCtx.stroke();
        
        // Finger guide text
        sCtx.font = '10px Share Tech Mono';
        sCtx.fillStyle = '#00ff66';
        sCtx.fillText('🐾 INDEX_TIP', smoothX + 18, smoothY - 5);
        sCtx.restore();
    }
}

// Finish Drawing and trigger narrative story
function finishDrawingGame() {
    gameRunning = false;
    stopDrawingSound();
    playSound('victory');
    
    logToTerminal(`[SYSTEM] 3단계 드로잉 전과정 완성됨.`, 'success-line');
    logToTerminal(`[SYSTEM] 지형 구조 정밀 분석 중...`, 'system-line');
    
    setTimeout(() => {
        analyzeAndGenerateStory();
    }, 1200);
}

// Analyze coordinates mathematical variance to tailor a story
function analyzeAndGenerateStory() {
    const midPts = allStagesData.stage2.points; // Stage 2 is the main cityscape
    if (midPts.length === 0) return;
    
    // Compute Y variance & Average Y
    const ys = midPts.map(p => p.y);
    const avgY = ys.reduce((sum, val) => sum + val, 0) / ys.length;
    const sqDiffs = ys.map(y => Math.pow(y - avgY, 2));
    const varianceY = sqDiffs.reduce((sum, val) => sum + val, 0) / ys.length;
    
    // Count peaks (local maxima)
    let peaksCount = 0;
    for (let i = 5; i < ys.length - 5; i++) {
        const isPeak = ys[i] < ys[i - 1] && ys[i] < ys[i - 2] && ys[i] < ys[i + 1] && ys[i] < ys[i + 2];
        if (isPeak) {
            peaksCount++;
            i += 5; // offset double detections
        }
    }
    
    let storyTitle = "";
    let storyText = "";
    
    // High variance = jagged/steep curves
    if (varianceY > 1500) { 
        storyTitle = "⛰️ 가파른 골목길에 피어난 활기찬 소동";
        storyText = `당신이 스케치한 능선은 가파르고 굴곡진 이태원의 좁은 계단길을 닮았습니다. 경사가 심한 돌축대 계단(CAM_02)을 지나 숨 가쁘게 오르면, 비좁은 틈새 사이로 빼곡히 올라선 집들과 갤러리 쇼윈도(CAM_05)가 나타납니다. 이 가파른 골짜기를 자유롭게 드나드는 고양이들은 가로등 불빛 아래에서 소월로의 경계를 교란하며 그들만의 은밀한 공화국을 해킹해 나갑니다. 밤하늘 아래 별빛처럼 흩어지는 이태원의 역동적인 에너지가 가득 차 오른 그림입니다. 당신이 만든 가파른 능선 위에서 오늘도 이태원의 밤은 새로운 이야기를 피워 올립니다.`;
    } 
    // Low variance but high altitude (Y pixel coordinate is low = physically high up on screen)
    else if (avgY < sCanvas.height * 0.45) { 
        storyTitle = "🌤️ 남산자락 아래, 소월길의 평화로운 오후";
        storyText = `당신이 스케치한 능선은 남산 산책로(소월길)를 따라 부드럽게 뻗어나간 고지대 산책길을 닮았습니다. 'BASECAMP NAMSAN'의 파란 글귀(CAM_03)가 적힌 옥상 위로 시원한 솔바람이 불어오고, 옥상 전망대(CAM_06) 아래로는 해방촌과 소월로 일대가 평화로운 바다처럼 내려다보집니다. 검은 차 지붕 위(CAM_02)에서 여유롭게 식빵을 굽는 고양이와 담벼락 화단에 곱게 핀 분홍빛 꽃들이 어우러지는 느긋한 오후, 이태원의 높은 언덕길은 세상을 내려다보는 고요하고 아늑한 미술적 캔버스가 됩니다.`;
    } 
    // Default / Flat low altitude terrain
    else { 
        storyTitle = "🏘️ 도시의 교차로, 열린 광장의 불빛";
        storyText = `당신이 스케치한 능선은 막힘없이 탁 트인 평탄한 아스팔트 지형을 닮았습니다. 넓게 펼쳐진 광장(CAM_01)과 골목 어귀의 볼라드들이 경계를 이루며, 수많은 사람들과 고양이들의 발걸음이 수평선처럼 교차하는 열린 공간입니다. 이곳에서는 삼엄한 감시도 넓은 골목길의 열기에 녹아내리며, 식물 벤치 아래 그늘에서 속닥거리는 사람들의 소리와 길고양이들의 기분 좋은 울음소리가 잔잔하게 퍼져나갑니다. 경계가 허물어지고 소통이 가득한 따뜻한 이태원의 풍경이 완성되었습니다.`;
    }
    
    // Typewriting effect inside right terminal
    document.getElementById('story-title').textContent = storyTitle;
    document.getElementById('story-content').innerHTML = `<p><strong>[지형 분석 결과: Y-분산 ${Math.round(varianceY)}, 봉우리수 ${peaksCount}개]</strong></p><p>${storyText}</p>`;
    
    logToTerminal(`[STORY] 지형 코드 해독 완료.`, 'success-line');
    
    // Typewrite story into terminal feed
    let charIdx = 0;
    const logLine = document.createElement('div');
    logLine.className = 'log-line story-line';
    termFeed.appendChild(logLine);
    
    const typeInterval = setInterval(() => {
        logLine.textContent += storyText[charIdx];
        charIdx++;
        termFeed.scrollTop = termFeed.scrollHeight;
        if (charIdx >= storyText.length) {
            clearInterval(typeInterval);
            
            // Pop open final story modal
            setTimeout(() => {
                document.getElementById('story-modal').classList.remove('hidden');
                playSound('success');
            }, 800);
        }
    }, 15);
}

// Close overlay modal
function closeStoryModal() {
    document.getElementById('story-modal').classList.add('hidden');
}

// Reset and draw again
function restartDrawing() {
    closeStoryModal();
    currentStage = 1;
    drawnPoints = [];
    spawnedCollages = [];
    allStagesData = {
        stage1: { points: [], collages: [] },
        stage2: { points: [], collages: [] },
        stage3: { points: [], collages: [] }
    };
    
    document.getElementById('stage-val').textContent = "능선 1 (배경 산맥)";
    document.getElementById('draw-progress').style.width = '0%';
    termFeed.innerHTML = '<div class="log-line system-line">[SYSTEM] 캔버스 초기화됨. 처음부터 스케치를 시작하세요.</div>';
    
    gameRunning = true;
    sCtx.clearRect(0, 0, sCanvas.width, sCanvas.height);
}

// Camera activation & hand model loading using native getUserMedia
async function startCamera() {
    initAudio();
    document.getElementById('start-btn').disabled = true;
    document.getElementById('start-btn').textContent = "모델 로딩 중 (LOADING MODEL)...";
    
    // Initialize MediaPipe Hands Object
    const hands = new Hands({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
    });
    
    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.65,
        minTrackingConfidence: 0.65
    });
    
    hands.onResults(onResults);
    
    try {
        // Request camera access natively
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: "user"
            },
            audio: false
        });
        
        video.srcObject = stream;
        await video.play();
        
        // Custom animation frame processing loop for MediaPipe
        async function processFrame() {
            if (!gameRunning) return;
            if (video.readyState >= 2) { // HAVE_CURRENT_DATA or higher
                try {
                    await hands.send({ image: video });
                } catch (e) {
                    console.error("MediaPipe processing error:", e);
                }
            }
            if (video.srcObject) {
                requestAnimationFrame(processFrame);
            }
        }
        
        // Start loop
        requestAnimationFrame(processFrame);
        
        // Dismiss startup screen
        document.getElementById('start-overlay').classList.add('hidden');
        gameRunning = true;
        resizeCanvases();
        logToTerminal(`[SYSTEM] 웹캠 카메라 활성화 성공.`, 'system-line');
        logToTerminal(`[SYSTEM] MediaPipe Hands 로딩 완료.`, 'success-line');
        logToTerminal(`[SYSTEM] 화면 왼쪽 가장자리(10%)에 검지끝을 대고 그려보세요.`, 'system-line');
        
    } catch (err) {
        console.error("Webcam activation failed:", err);
        let errorMsg = "카메라를 시작할 수 없습니다.\n\n";
        
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            errorMsg += "권한 오류: 브라우저 주소창 왼쪽의 자물쇠나 카메라 아이콘을 클릭하여 카메라 설정이 '허용'되어 있는지 확인해 주세요.\n\n또한 macOS의 경우, [시스템 설정 -> 개인정보 보호 및 보안 -> 카메라]에서 사용하는 브라우저(Google Chrome 등)의 접근 권한이 활성화되어 있는지 반드시 확인해 주십시오.";
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            errorMsg += "장치 오류: 연결된 카메라(웹캠) 장치를 찾을 수 없습니다.";
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
            errorMsg += "장치 점유 오류: 카메라가 다른 프로그램(FaceTime, Zoom, OBS, 또는 다른 브라우저 탭)에서 사용 중입니다. 다른 프로그램들을 종료한 후 다시 시도해 주십시오.";
        } else {
            errorMsg += `상세 오류: ${err.name} - ${err.message}`;
        }
        
        alert(errorMsg);
        document.getElementById('start-btn').disabled = false;
        document.getElementById('start-btn').textContent = "카메라 활성화 및 시작 (START)";
    }
}

// Window resize
window.onresize = () => {
    resizeCanvases();
};

window.onload = () => {
    resizeCanvases();
};
