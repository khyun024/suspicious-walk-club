const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let soundEnabled = true;

function playSound(type) {
    if (!soundEnabled) return;

    // Resume context if suspended (browser safety autoplay restriction)
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    switch (type) {
        case 'move': {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);

            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

            osc.start(now);
            osc.stop(now + 0.12);
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
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

            osc.start(now);
            osc.stop(now + 0.04);
            break;
        }
        case 'tick': {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200 + Math.random() * 200, now);

            gain.gain.setValueAtTime(0.02, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

            osc.start(now);
            osc.stop(now + 0.03);
            break;
        }
        case 'success': {
            // A major chord arpeggio
            const freqs = [330, 440, 554, 660, 880];
            freqs.forEach((f, idx) => {
                const t = now + idx * 0.06;
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);

                osc.type = 'sine';
                osc.frequency.setValueAtTime(f, t);

                gain.gain.setValueAtTime(0.08, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

                osc.start(t);
                osc.stop(t + 0.25);
            });
            break;
        }
        case 'fail': {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.linearRampToValueAtTime(70, now + 0.35);

            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

            osc.start(now);
            osc.stop(now + 0.35);
            break;
        }
        case 'meow': {
            // Synthesize a cute retro meow sound
            const osc1 = audioCtx.createOscillator();
            const osc2 = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            osc1.type = 'triangle';
            osc2.type = 'sawtooth';

            const startFreq = 420;
            const midFreq = 620;
            const endFreq = 480;

            osc1.frequency.setValueAtTime(startFreq, now);
            osc1.frequency.exponentialRampToValueAtTime(midFreq, now + 0.08);
            osc1.frequency.exponentialRampToValueAtTime(endFreq, now + 0.26);

            osc2.frequency.setValueAtTime(startFreq * 1.5, now);
            osc2.frequency.exponentialRampToValueAtTime(midFreq * 1.5, now + 0.08);
            osc2.frequency.exponentialRampToValueAtTime(endFreq * 1.5, now + 0.26);

            gainNode.gain.setValueAtTime(0.06, now);
            gainNode.gain.exponentialRampToValueAtTime(0.08, now + 0.06);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

            osc1.connect(gainNode);
            osc2.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 0.3);
            osc2.stop(now + 0.3);
            break;
        }
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('sound-btn');
    if (soundEnabled) {
        btn.textContent = '🔊 SOUND ON';
        playSound('click');
    } else {
        btn.textContent = '🔇 SOUND OFF';
    }
}

let currentPos = { ...gameData.startLocation };
let unlockedNodes = ["1_1"];
let clearedBarriers = [];
let isHacking = false;

const ui = {
    currentCoords: document.getElementById('current-coords'),
    scoreDisplay: document.getElementById('score'),
    nodeImg: document.getElementById('node-img'),
    nodeTitle: document.getElementById('node-title'),
    nodeDescription: document.getElementById('node-description'),
    terminalOutput: document.getElementById('terminal-output'),
    actionButtons: document.getElementById('action-buttons'),
    hackingOverlay: document.getElementById('hacking-overlay'),
    progressBar: document.querySelector('.progress'),
    hackingStatus: document.getElementById('hacking-status'),
    hackingTitle: document.getElementById('hacking-title'),
    mapGrid: document.getElementById('map-grid'),
    artModal: document.getElementById('art-modal')
};

// Log helper
function logToTerminal(message, type = 'log-system') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric", second: "numeric" });
    entry.textContent = `[${time}] ${message}`;
    ui.terminalOutput.appendChild(entry);
    ui.terminalOutput.scrollTop = ui.terminalOutput.scrollHeight;
}

// Check if coordinates are adjacent to player
function isAdjacent(r, c) {
    const rDiff = Math.abs(currentPos.r - r);
    const cDiff = Math.abs(currentPos.c - c);
    return (rDiff === 1 && cDiff === 0) || (rDiff === 0 && cDiff === 1);
}

// Generate the 4x5 grid visual elements
function generateGrid() {
    ui.mapGrid.innerHTML = '';
    for (let r = 1; r <= gameData.gridSize.rows; r++) {
        for (let c = 1; c <= gameData.gridSize.cols; c++) {
            const key = `${r}_${c}`;
            const node = gameData.nodes[key];

            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.id = `cell_${key}`;

            const img = document.createElement('img');

            // If unlocked, show photo; else show masked version
            if (unlockedNodes.includes(key)) {
                img.src = node.image;
                cell.classList.add('unlocked');
            } else {
                img.src = node.mask;
                cell.classList.add('masked');
            }

            cell.appendChild(img);

            // Highlight current cell
            if (currentPos.r === r && currentPos.c === c) {
                cell.classList.add('active');
            }

            // Mark obstacles
            if (node.barrier && !clearedBarriers.includes(node.barrier.id)) {
                cell.classList.add('obstacle');
            } else if (node.barrier && clearedBarriers.includes(node.barrier.id)) {
                cell.classList.add('obstacle-cleared');
            }

            // Allow clicking grid cells to attempt moving
            cell.onclick = () => {
                attemptMove(r, c);
            };

            ui.mapGrid.appendChild(cell);
        }
    }
}

// Update current node view
function updateNodeDetails() {
    const key = `${currentPos.r}_${currentPos.c}`;
    const node = gameData.nodes[key];

    ui.currentCoords.textContent = `${currentPos.r}, ${currentPos.c}`;
    ui.nodeTitle.textContent = node.name;
    ui.nodeDescription.textContent = node.description;

    // Always show full image for the current active node
    ui.nodeImg.src = node.image;

    // Add to unlocked nodes
    if (!unlockedNodes.includes(key)) {
        unlockedNodes.push(key);
        // Regenerate grid to remove mask for this node
        generateGrid();
    }

    logToTerminal(`Arrived at Node [${currentPos.r}, ${currentPos.c}]: ${node.name}`, 'log-info');

    renderActions();
}

// Render actions inside the terminal
function renderActions() {
    ui.actionButtons.innerHTML = '';

    // Check possible move directions
    const directions = [
        { r: -1, c: 0, label: "북 (UP)" },
        { r: 1, c: 0, label: "남 (DOWN)" },
        { r: 0, c: -1, label: "서 (LEFT)" },
        { r: 0, c: 1, label: "동 (RIGHT)" }
    ];

    directions.forEach(dir => {
        const targetR = currentPos.r + dir.r;
        const targetC = currentPos.c + dir.c;
        const targetKey = `${targetR}_${targetC}`;
        const targetNode = gameData.nodes[targetKey];

        if (targetNode) {
            const btn = document.createElement('button');
            btn.className = 'btn-move';
            btn.textContent = dir.label;

            btn.onclick = () => {
                attemptMove(targetR, targetC);
            };
            ui.actionButtons.appendChild(btn);
        }
    });

    // If adjacent nodes have active barriers, display bypass/hack option
    directions.forEach(dir => {
        const targetR = currentPos.r + dir.r;
        const targetC = currentPos.c + dir.c;
        const targetKey = `${targetR}_${targetC}`;
        const targetNode = gameData.nodes[targetKey];

        if (targetNode && targetNode.barrier && !clearedBarriers.includes(targetNode.barrier.id)) {
            const barrier = targetNode.barrier;
            const btn = document.createElement('button');
            btn.className = 'btn-hack';
            btn.textContent = `[해킹] ${barrier.hackLabel}`;
            btn.onclick = () => {
                startHacking(barrier, targetR, targetC);
            };
            ui.actionButtons.appendChild(btn);
        }
    });
}

// Attempt to move to a target grid cell
function attemptMove(r, c) {
    if (isHacking) return;

    // Must be adjacent
    if (!isAdjacent(r, c)) {
        logToTerminal(`경고: 현재 위치에서 멀리 떨어져 있습니다. 인접한 칸으로만 이동 가능합니다.`, 'log-error');
        playSound('fail');
        return;
    }

    const targetKey = `${r}_${c}`;
    const targetNode = gameData.nodes[targetKey];

    // Check barrier
    if (targetNode.barrier && !clearedBarriers.includes(targetNode.barrier.id)) {
        logToTerminal(`차단됨: ${targetNode.barrier.msg}`, 'log-error');
        logToTerminal(`[${targetNode.name}] 구역으로 진입하려면 먼저 보안을 무력화해야 합니다.`, 'log-system');
        playSound('fail');
        return;
    }

    // Move
    currentPos = { r, c };
    playSound('move');
    generateGrid();
    updateNodeDetails();
}

// Trigger hacking progress modal
function startHacking(barrier, targetR, targetC) {
    if (isHacking) return;
    isHacking = true;

    ui.hackingOverlay.classList.remove('hidden');
    ui.hackingTitle.textContent = "BYPASSING PROTOCOL: " + barrier.id.toUpperCase();
    ui.progressBar.style.width = '0%';
    ui.hackingStatus.textContent = "Scanning obstacle pattern...";

    logToTerminal(`경로 차단막 분석 시작: ${barrier.hackLabel}`, 'log-system');

    // Play custom meow for cat-interaction barrier, click for others
    if (barrier.id === 'meet_cat') {
        playSound('meow');
    } else {
        playSound('click');
    }

    let progress = 0;
    const hackInterval = setInterval(() => {
        progress += Math.random() * (12 / barrier.difficulty);
        if (progress >= 100) progress = 100;

        ui.progressBar.style.width = `${progress}%`;
        playSound('tick');

        if (Math.random() > 0.7) {
            const statuses = [
                '시선 동선 트래킹 중...',
                '경고 인자 감쇄 처리...',
                '비인간 발자국 우회 노선 확보 중...',
                '인간 통제용 파형 역위상 변조...'
            ];
            ui.hackingStatus.textContent = statuses[Math.floor(Math.random() * statuses.length)];
        }

        if (progress === 100) {
            clearInterval(hackInterval);
            finishHacking(barrier, targetR, targetC);
        }
    }, 100);
}

// Complete hacking attempt
function finishHacking(barrier, targetR, targetC) {
    setTimeout(() => {
        ui.hackingOverlay.classList.add('hidden');
        isHacking = false;

        // Success check
        const chance = 1.0 - (barrier.difficulty * 0.12);
        const isSuccess = Math.random() < chance;

        if (isSuccess) {
            logToTerminal(`[성공] ${barrier.successMsg}`, 'log-success');
            clearedBarriers.push(barrier.id);
            playSound('success');

            // Unlock the target node image even before moving there
            const targetKey = `${targetR}_${targetC}`;
            if (!unlockedNodes.includes(targetKey)) {
                unlockedNodes.push(targetKey);
            }

            generateGrid();
            renderActions();

            // Check winning condition (Final target cell cleared and reached)
            if (barrier.id === 'final_escape') {
                triggerWin();
            } else {
                // Auto move to the cleared cell
                setTimeout(() => {
                    attemptMove(targetR, targetC);
                }, 600);
            }
        } else {
            logToTerminal(`[실패] ${barrier.failMsg}`, 'log-error');
            playSound('fail');
        }
    }, 500);
}

// Trigger win state
function triggerWin() {
    logToTerminal(`-------------------------------------------`, 'log-success');
    logToTerminal(`🎉 HACKING SUCCESS: ITAEWON_CAT_NET COMPROMISED!`, 'log-success');
    logToTerminal(`축하합니다! 이태원의 모든 감시망을 무너뜨리고`, 'log-success');
    logToTerminal(`남산으로 통하는 궁극의 고양이길 네트워크를 구축했습니다!`, 'log-success');
    logToTerminal(`-------------------------------------------`, 'log-success');

    // Unlock all nodes to reveal full picture
    for (let r = 1; r <= gameData.gridSize.rows; r++) {
        for (let c = 1; c <= gameData.gridSize.cols; c++) {
            const key = `${r}_${c}`;
            if (!unlockedNodes.includes(key)) {
                unlockedNodes.push(key);
            }
        }
    }

    // Move to final location
    currentPos = { ...gameData.endLocation };
    generateGrid();
    updateNodeDetails();

    playSound('success');
    setTimeout(() => {
        playSound('meow');
    }, 400);

    setTimeout(() => {
        alert("🎉 해킹 성공! 이태원의 모든 골목길 마스크가 열리며 고양이들만의 비밀 지도가 완성되었습니다!");
    }, 500);
}

// Art context popup toggle
function toggleArtContext() {
    ui.artModal.classList.toggle('hidden');
    playSound('click');
}

function goToCctvGame() {
    playSound('click');
    window.location.href = 'cctv.html';
}

function goToHandGame() {
    playSound('click');
    window.location.href = 'hand.html';
}

function goToMicrobeGame() {
    playSound('click');
    window.location.href = 'microbe.html';
}

// Initialize game
window.onload = () => {
    logToTerminal("CAT_OS v0.96 initialized.");
    logToTerminal("Target Area: Itaewon 2-dong (Sowol-ro).");
    logToTerminal("Scanning local networks and feline pathways...");

    setTimeout(() => {
        generateGrid();
        updateNodeDetails();
        logToTerminal("시스템 준비 완료. (1,1) 고양이 급식소 노드에서 우회 전송을 시작합니다.", 'log-success');
        playSound('meow');
    }, 800);
};
