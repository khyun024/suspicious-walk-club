/*
 * horizon.js — 자동 지평선 (Automatic Horizon)
 *
 * 초현실주의 자동기술법(automatic drawing)의 손 버전.
 * 검지 끝이 지나간 자리에 빛나는 지평선이 남고,
 * 그 선 아래로 이태원의 도시가 떠오르며 사물들이 솟아난다.
 * 손을 빠르게 움직일수록 도시의 소리가 커진다.
 */
window.Horizon = (function () {
  const PHOTOS = {
    city: "assets/photos/city.jpg",
    cone: "assets/photos/cone.jpg",
    sign: "assets/photos/sign.jpg",
    flower: "assets/photos/flower.jpg",
    bonsai: "assets/photos/bonsai.jpg",
  };
  const BUILDING_KEYS = ["cone", "sign", "flower", "bonsai", "city"];

  const imgs = {};
  const strips = {}; // 세로 '건물' 스트립(부드러운 위쪽 페이드)

  const NCOL = 240;
  let columns = null;       // 각 열의 지평선 y (NaN = 미입력)
  let W = 0, H = 0, colW = 0;

  const state = {
    buildings: [],
    lastSpawnX: null,
    lastTip: null,
    speed: 0,
    hasHand: false,
    done: false,
  };
  const COVER_TARGET = 0.92;   // 지평선이 가로폭의 92% 이상 채워지면 완성

  /* ---------- 로드 ---------- */
  function loadImage(src) {
    return new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => rej(new Error("로드 실패: " + src));
      im.src = src;
    });
  }

  function makeStrip(img, w, h) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d");
    const iw = img.naturalWidth || w, ih = img.naturalHeight || h;
    const s = Math.max(w / iw, h / ih);
    const dw = iw * s, dh = ih * s;
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    // 위쪽으로 갈수록 투명 (지평선에서 솟아나는 느낌) + 좌우 살짝 페이드
    ctx.globalCompositeOperation = "destination-in";
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.35, "rgba(0,0,0,0.85)");
    g.addColorStop(1, "rgba(0,0,0,1)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    return c;
  }

  async function load() {
    const entries = Object.entries(PHOTOS);
    await Promise.all(entries.map(async ([k, src]) => { imgs[k] = await loadImage(src); }));
    for (const k of BUILDING_KEYS) strips[k] = makeStrip(imgs[k], 256, 384);
  }

  /* ---------- 초기화 ---------- */
  function ensureSize(canvas) {
    if (canvas.width === W && canvas.height === H && columns) return;
    W = canvas.width; H = canvas.height; colW = W / NCOL;
    columns = new Float32Array(NCOL).fill(NaN);
  }

  function reset() {
    if (columns) columns.fill(NaN);
    state.buildings.length = 0;
    state.lastSpawnX = null;
    state.lastTip = null;
    state.speed = 0;
    state.done = false;
  }

  function coverage() {
    if (!columns) return 0;
    let n = 0;
    for (let i = 0; i < NCOL; i++) if (!isNaN(columns[i])) n++;
    return n / NCOL;
  }

  /* ---------- 보간된 지평선 라인 ---------- */
  function buildLine() {
    const known = [];
    for (let i = 0; i < NCOL; i++) if (!isNaN(columns[i])) known.push(i);
    if (known.length === 0) return null;
    const line = new Float32Array(NCOL);
    let ki = 0;
    for (let i = 0; i < NCOL; i++) {
      if (i <= known[0]) { line[i] = columns[known[0]]; continue; }
      if (i >= known[known.length - 1]) { line[i] = columns[known[known.length - 1]]; continue; }
      while (ki < known.length - 1 && known[ki + 1] < i) ki++;
      const a = known[ki], b = known[ki + 1];
      const t = (i - a) / (b - a);
      line[i] = columns[a] + (columns[b] - columns[a]) * t;
    }
    return line;
  }

  /* ---------- 한 프레임 ---------- */
  // 반환: HUD용 {hasHand, speed01, buildings}
  function render(ctx, canvas, handResult, dt) {
    ensureSize(canvas);
    const hasHand = handResult && handResult.landmarks && handResult.landmarks.length > 0;
    state.hasHand = hasHand;

    let cursor = null;
    if (hasHand && !state.done) {
      const lm = handResult.landmarks[0];
      const tip = lm[8];      // 검지 끝
      const thumb = lm[4];    // 엄지 끝
      const tx = tip.x * W, ty = tip.y * H;

      // 엄지-검지를 붙이면(핀치) 펜 업: 그리지 않고 이동만
      const pinch = Math.hypot((tip.x - thumb.x) * W, (tip.y - thumb.y) * H) < W * 0.05;

      if (state.lastTip) {
        const d = Math.hypot(tx - state.lastTip.x, ty - state.lastTip.y);
        state.speed = state.speed * 0.8 + (d / Math.max(1, dt)) * 0.2;
      }

      if (!pinch) {
        const col = Math.max(0, Math.min(NCOL - 1, Math.floor(tx / colW)));
        columns[col] = isNaN(columns[col]) ? ty : Math.min(columns[col], ty);

        if (state.lastSpawnX === null || Math.abs(tx - state.lastSpawnX) > 95) {
          state.buildings.push({
            x: tx, baseY: ty,
            key: BUILDING_KEYS[state.buildings.length % BUILDING_KEYS.length],
            w: 80 + (state.buildings.length % 3) * 26,
            hTarget: 120 + ((state.buildings.length * 53) % 140),
            grow: 0, fresh: true,
          });
          if (state.buildings.length > 40) state.buildings.shift();
          state.lastSpawnX = tx;
        }
      }
      state.lastTip = { x: tx, y: ty };
      cursor = { tx, ty, pinch };
    } else {
      state.speed *= 0.9;
      state.lastTip = null;
    }

    // 완성 판정: 지평선이 가로폭을 거의 채우면 — 커서 없이 깨끗한 최종 프레임
    const cov = coverage();
    let completed = false;
    if (!state.done && cov >= COVER_TARGET && state.buildings.length > 3) {
      state.done = true;
      completed = true;
    }

    const line = buildLine();
    if (line) {
      drawReveal(ctx, line);
      drawBuildings(ctx, dt);
      drawLine(ctx, line);
    }
    if (cursor && !completed && !state.done) drawCursor(ctx, cursor.tx, cursor.ty, cursor.pinch);

    let spawned = false;
    for (const b of state.buildings) if (b.fresh) { b.fresh = false; spawned = true; }

    const speed01 = Math.min(1, state.speed * 12);
    return { hasHand, speed01, buildings: state.buildings.length, spawned, coverage: cov, completed };
  }

  function drawReveal(ctx, line) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let i = 0; i < NCOL; i++) ctx.lineTo(i * colW, line[i]);
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.clip();
    // 도시 사진을 cover로 채우기
    const im = imgs.city;
    if (im) {
      const iw = im.naturalWidth, ih = im.naturalHeight;
      const s = Math.max(W / iw, H / ih);
      const dw = iw * s, dh = ih * s;
      ctx.globalAlpha = 0.82;
      ctx.drawImage(im, (W - dw) / 2, (H - dh) / 2, dw, dh);
      ctx.globalAlpha = 1;
    }
    // 깊이감용 어둠
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "rgba(8,8,16,0.15)");
    g.addColorStop(1, "rgba(8,8,16,0.55)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  function drawBuildings(ctx, dt) {
    const k = Math.min(1, dt / 140);
    for (const b of state.buildings) {
      b.grow += (1 - b.grow) * k;
      const strip = strips[b.key];
      if (!strip) continue;
      const h = b.hTarget * b.grow;
      const w = b.w;
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.drawImage(strip, b.x - w / 2, b.baseY - h, w, h);
      ctx.restore();
    }
  }

  function drawLine(ctx, line) {
    ctx.save();
    ctx.shadowColor = "rgba(255,170,90,0.9)";
    ctx.shadowBlur = 18;
    ctx.strokeStyle = "rgba(255,210,140,0.95)";
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(0, line[0]);
    for (let i = 1; i < NCOL; i++) ctx.lineTo(i * colW, line[i]);
    ctx.stroke();
    ctx.restore();
  }

  function drawCursor(ctx, x, y, pinch) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, pinch ? 7 : 11, 0, Math.PI * 2);
    ctx.fillStyle = pinch ? "rgba(255,255,255,0.35)" : "rgba(255,170,90,0.9)";
    ctx.shadowColor = "rgba(255,170,90,0.9)";
    ctx.shadowBlur = 16;
    ctx.fill();
    ctx.restore();
  }

  return { load, reset, render, state };
})();
