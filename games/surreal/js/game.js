/*
 * game.js — 표정 룰렛 (8가지 표정 · 이미지 풀 · 10장 결말)
 *
 * 초현실주의 "객관적 우연(le hasard objectif)":
 * 표정은 '소리와 분위기'를 정하고, 떠오르는 이미지는 도시가 던지는 우연.
 * 10장을 불러내면 그 표정들의 순서로 '산책의 결말'이 직조된다.
 */
window.Game = (function () {
  const TARGET = 10;                 // 결말까지 모을 이미지 수
  const POOL_COUNT = 50;             // assets/photos/pool/p01..p50.jpg
  const BLOB_SIZE = 384;

  // 한 글자라도 켜지면 그 표정으로 — 표정마다 임계값/소리/분위기
  function g(m, n) { return m[n] || 0; }
  const EXPR = [
    { key: "smile",    label: "미소",      emoji: "😊", sound: "smile",    tint: "#ff7aa8", th: 0.22, f: (m) => (g(m,"mouthSmileLeft")+g(m,"mouthSmileRight"))/2 },
    { key: "surprise", label: "놀람",      emoji: "😮", sound: "surprise", tint: "#ff7a3c", th: 0.28, f: (m) => g(m,"jawOpen") },
    { key: "frown",    label: "찡그림",    emoji: "😠", sound: "frown",    tint: "#ffd23c", th: 0.20, f: (m) => (g(m,"browDownLeft")+g(m,"browDownRight"))/2 },
    { key: "pucker",   label: "뽀뽀",      emoji: "😗", sound: "smile",    tint: "#ff9ecf", th: 0.26, f: (m) => g(m,"mouthPucker") },
    { key: "cheek",    label: "볼 풍선",   emoji: "🐡", sound: "surprise", tint: "#8fd3ff", th: 0.15, f: (m) => g(m,"cheekPuff") },
    { key: "wink",     label: "윙크",      emoji: "😉", sound: "frown",    tint: "#c79cff", th: 0.28, f: (m) => Math.max(0, Math.abs(g(m,"eyeBlinkLeft")-g(m,"eyeBlinkRight")) - 0.08) },
    { key: "wide",     label: "눈 동그래", emoji: "😳", sound: "surprise", tint: "#9cffd1", th: 0.24, f: (m) => (g(m,"eyeWideLeft")+g(m,"eyeWideRight"))/2 },
    { key: "sneer",    label: "코 찡긋",   emoji: "😤", sound: "frown",    tint: "#ffa07a", th: 0.16, f: (m) => (g(m,"noseSneerLeft")+g(m,"noseSneerRight"))/2 },
  ];

  const HOLD_MS = 3000;     // 한 이미지를 확정하려면 3초간 같은 표정 유지
  const MAX_BLUR = 16;      // 현상 시작 시 흐림 정도(px) → 0으로 갈수록 선명
  const state = {
    scale: 0, x: 0, y: 0, targetSize: 0,
    sfx: null, sfy: null, sfw: null,   // 얼굴 기준점/크기 평활화(떨림 방지)
    shown: null,        // 화면의 단 하나 이미지 { blob, idx, def, committed }
    holdMs: 0,          // 현상 진행 시간
    relaxMs: 0,         // 무표정 지속 시간
    armed: true,        // 새 이미지를 시작할 준비 (무표정으로 쉰 뒤 true)
    expressing: false,  // 표정 on/off (히스테리시스)
    log: [],            // [{ exprKey, label, emoji, idx, blob }]
    order: [], orderPtr: 0,
    ended: false,
  };

  /* ---------- 이미지 풀 로드 ---------- */
  const pool = [];          // blob canvas 배열

  function makeBlob(img, size) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d");
    const iw = img.naturalWidth || size, ih = img.naturalHeight || size;
    const s = Math.max(size / iw, size / ih);
    const w = iw * s, h = ih * s;
    ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
    ctx.globalCompositeOperation = "destination-in";
    const grd = ctx.createRadialGradient(size/2, size/2, size*0.30, size/2, size/2, size*0.5);
    grd.addColorStop(0, "rgba(0,0,0,1)");
    grd.addColorStop(0.8, "rgba(0,0,0,0.9)");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, size, size);
    return c;
  }
  function loadImage(src) {
    return new Promise((res) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => res(null);
      im.src = src;
    });
  }
  async function load() {
    const tasks = [];
    for (let i = 1; i <= POOL_COUNT; i++) {
      const src = "assets/photos/pool/p" + String(i).padStart(2, "0") + ".jpg";
      tasks.push(loadImage(src).then((im) => (im ? makeBlob(im, BLOB_SIZE) : null)));
    }
    const res = await Promise.all(tasks);
    pool.length = 0;
    res.forEach((b) => { if (b) pool.push(b); });
    shuffleOrder();
  }
  function shuffleOrder() {
    state.order = pool.map((_, i) => i);
    for (let i = state.order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [state.order[i], state.order[j]] = [state.order[j], state.order[i]];
    }
    state.orderPtr = 0;
  }
  function nextImage() {
    if (pool.length === 0) return -1;
    if (state.orderPtr >= state.order.length) shuffleOrder();
    return state.order[state.orderPtr++];
  }

  /* ---------- 표정 점수 (EMA 평활화) ---------- */
  const EXPR_BY_KEY = {};
  EXPR.forEach((e) => (EXPR_BY_KEY[e.key] = e));
  const smooth = {};
  function updateScores(categories) {
    const m = {};
    for (const c of categories) m[c.categoryName] = c.score;
    for (const e of EXPR) {
      const raw = e.f(m);
      const prev = smooth[e.key] || 0;
      smooth[e.key] = prev + (raw - prev) * 0.22;   // 무거운 EMA → 표정 흔들림 억제
    }
  }
  function sc(key) { return smooth[key] || 0; }
  // 가장 강한 표정과 그 강도(임계값 대비 비율)
  function dominant() {
    let best = null, bestRatio = 0;
    for (const e of EXPR) {
      const r = sc(e.key) / e.th;
      if (r > bestRatio) { bestRatio = r; best = e; }
    }
    return { best, ratio: bestRatio };
  }

  /* ---------- 얼굴 기준점 ---------- */
  function faceMetrics(lm, W, H) {
    const f = lm[10], l = lm[234], r = lm[454];
    return {
      foreheadX: f.x * W,
      foreheadY: f.y * H,
      faceW: Math.hypot((r.x - l.x) * W, (r.y - l.y) * H),
    };
  }

  /* ---------- 렌더 ----------
   * 이미지는 "한 번 뜨면 저절로 안 바뀜". 새 이미지는 오직
   *   무표정으로 0.6초 쉬었다가(armed) → 다시 표정을 지을 때만 교체.
   * 표정 on/off에 히스테리시스(켜짐 1.0 / 꺼짐 0.6)를 둬 깜빡임 제거.
   */
  const RELAX_MS = 600;     // 새 이미지를 준비하려면 무표정 0.6초
  const ENTER = 1.0;        // 표정 '켜짐' 임계 비율
  const EXIT = 0.6;         // 표정 '꺼짐' 임계 비율 (이 아래로 떨어져야 무표정 인정)

  function render(ctx, canvas, result, dt) {
    const W = canvas.width, H = canvas.height;
    const hasFace = result && result.faceLandmarks && result.faceLandmarks.length > 0;

    if (!hasFace) {
      state.scale += (0 - state.scale) * Math.min(1, dt / 220);
      state.expressing = false; state.relaxMs = 0; state.sfw = null;
      if (state.shown && state.scale > 0.01) {
        const blur = state.shown.committed ? 0 : 8;
        drawImageBlob(ctx, state.shown.blob, blur, 0.4);
      }
      return baseInfo(state.shown ? state.shown.def : null, 0, false, 0, null, false);
    }

    const lm = result.faceLandmarks[0];
    const bs = (result.faceBlendshapes && result.faceBlendshapes[0]) ? result.faceBlendshapes[0].categories : [];
    updateScores(bs);

    // 얼굴 기준점/크기 EMA 평활화 → 떨림 제거
    const met = faceMetrics(lm, W, H);
    const a = Math.min(1, dt / 160);
    if (state.sfw == null) { state.sfw = met.faceW; state.sfx = met.foreheadX; state.sfy = met.foreheadY; }
    state.sfw += (met.faceW - state.sfw) * a;
    state.sfx += (met.foreheadX - state.sfx) * a;
    state.sfy += (met.foreheadY - state.sfy) * a;
    const tx = state.sfx, ty = state.sfy - state.sfw * 0.18;

    // 표정 on/off (히스테리시스)
    const dom = dominant();
    if (!state.expressing && dom.ratio >= ENTER) state.expressing = true;
    else if (state.expressing && dom.ratio < EXIT) state.expressing = false;

    let wake = null, justCommitted = false;

    if (state.expressing) {
      state.relaxMs = 0;
      // armed일 때만 새 이미지 시작 (= 직전에 충분히 쉰 경우)
      if (state.armed && !state.ended) {
        const idx = nextImage();
        if (idx >= 0) {
          state.shown = { blob: pool[idx], idx, def: dom.best, committed: false };
          state.holdMs = 0; state.x = tx; state.y = ty;   // 스냅
        }
        state.armed = false;
      }
      // 현재 이미지 현상/확정
      if (state.shown && !state.shown.committed) {
        state.holdMs += dt;
        if (!state.ended && state.holdMs >= HOLD_MS) {
          state.shown.committed = true;
          const d = state.shown.def;
          state.log.push({ exprKey: d.key, label: d.label, emoji: d.emoji, idx: state.shown.idx, blob: state.shown.blob });
          wake = d.sound; justCommitted = true;
          if (state.log.length >= TARGET) state.ended = true;
        }
      }
    } else {
      // 무표정 — 현재 이미지는 그대로 두고, 충분히 쉬면 다음 이미지 준비
      state.relaxMs += dt;
      if (state.relaxMs > RELAX_MS) state.armed = true;
    }

    const developing = !!(state.shown && !state.shown.committed);
    const progress = developing ? Math.min(1, state.holdMs / HOLD_MS) : 0;

    // 크기/위치 보간
    const grow = developing ? (0.5 + 0.5 * progress) : 1.0;
    state.targetSize = state.sfw * (1.5 + grow);
    const k = Math.min(1, dt / 110);
    state.x += (tx - state.x) * k;
    state.y += (ty - state.y) * k;
    state.scale += (1 - state.scale) * k;

    if (state.shown) {
      const blur = developing ? (1 - progress) * MAX_BLUR : 0;
      const alpha = developing ? (0.55 + 0.4 * progress) : 0.95;
      drawImageBlob(ctx, state.shown.blob, blur, alpha);
    }

    const def = state.shown ? state.shown.def : null;
    return baseInfo(def, progress, developing, progress, wake, justCommitted);
  }

  function baseInfo(def, intensity, developing, progress, wake, justCommitted) {
    return {
      label: def ? def.label : "무표정",
      emoji: def ? def.emoji : "😐",
      intensity: intensity || 0,
      developing, progress,
      armed: state.armed,
      hasImage: !!state.shown,
      count: state.log.length,
      target: TARGET,
      wake, justSummoned: justCommitted,
      ended: state.ended,
    };
  }

  function drawImageBlob(ctx, blob, blurPx, alpha) {
    if (!blob || state.scale <= 0.01) return;
    const s = state.targetSize * state.scale;
    if (s <= 1) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    if (blurPx > 0.1) ctx.filter = "blur(" + blurPx.toFixed(1) + "px)";
    ctx.drawImage(blob, state.x - s / 2, state.y - s / 2, s, s);
    ctx.restore();
  }

  /* ---------- 결말(이야기) 생성 ---------- */
  // 수상한 산책클럽 — eumgil 사운드저니의 거점(파프리 스튜디오·계단/옥상·공원 무대·고양이 통로·편의점·반사경)을 모티프로
  const STORY = {
    open: [
      "수상한 산책클럽이 오늘도 문을 열었다. 파프리 스튜디오 앞, 오늘의 산책자는 당신.",
      "좋은 산책자가 되기로 한 당신이 이태원의 비탈로 걸어 들어갔다.",
      "수상한 산책클럽의 신호가 울리자, 당신은 표정으로 도시를 깨우기 시작했다.",
    ],
    smile:    ["미소를 짓자 거점의 화단이 당신을 알아보고 분홍빛으로 부풀었다.", "입꼬리가 올라가자 골목이 살며시 따라 웃었다."],
    surprise: ["입을 벌리자 가파른 계단이 옥상까지 솟아올랐다.", "놀란 순간, 공원 무대 위 운동기구가 살아 움직였다."],
    frown:    ["미간을 모으자 전봇대 옆 또 다른 수상한 산책자가 돌아보았다.", "찡그리자 거리가 잠시, 계단처럼 침묵했다."],
    pucker:   ["입을 모으자 고양이 통로에서 바람이 휘파람처럼 빠져나갔다.", "뽀뽀하듯, 파란 모자 안내자가 다음 길을 가리켰다."],
    cheek:    ["볼을 부풀리자 편의점 아이스크림이 두 배로 커졌다.", "숨을 가두자 도시가 풍선처럼 둥글어졌다."],
    wink:     ["한쪽 눈을 감자 반사경 속 단체사진이 공모하듯 깜빡였다.", "윙크하자 수상한 산책클럽의 비밀이 하나 늘었다."],
    wide:     ["눈을 크게 뜨자 옥상 전망에 온 동네 불빛이 한꺼번에 들어찼다.", "동그래진 눈에 오늘 지난 모든 거점이 담겼다."],
    sneer:    ["코를 찡긋하자 통로의 고양이가 야옹, 하고 동의했다.", "찡긋한 순간, 도시가 짓궂게 함께 웃었다."],
    close: [
      "산책의 끝, 반사경 앞에서 당신은 어느새 좋은 산책자가 되어 있었다.",
      "오늘도 도시는 조금 더 수상해졌다. 다음 산책에서 또 만나요.",
      "좋은 산책자는 도시를 바꾸지 않는다 — 다만 표정으로 함께 호흡할 뿐.",
    ],
  };
  function pick(arr, avoid) {
    const opts = arr.length > 1 && avoid ? arr.filter((x) => x !== avoid) : arr;
    return opts[Math.floor(Math.random() * opts.length)];
  }
  function buildStory() {
    const lines = [pick(STORY.open)];
    let last = null;
    state.log.forEach((c) => {
      const line = pick(STORY[c.exprKey] || ["도시가 한 번 더 뒤척였다."], last);
      lines.push(line);
      last = line;
    });
    lines.push(pick(STORY.close));
    return lines;
  }

  function getEnding() {
    return { cards: state.log.slice(), story: buildStory() };
  }

  function reset() {
    state.scale = 0;
    state.sfx = null; state.sfy = null; state.sfw = null;
    state.shown = null; state.holdMs = 0; state.relaxMs = 0;
    state.armed = true; state.expressing = false;
    state.log = []; state.ended = false;
    for (const k in smooth) smooth[k] = 0;
    shuffleOrder();
  }

  return { EXPR, load, render, getEnding, reset, state, TARGET };
})();
