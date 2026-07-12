/*
 * main.js — 모드 라우팅 · 루프 · 사운드 · HUD · 결말
 */
(function () {
  const $ = (id) => document.getElementById(id);
  const video = $("video");
  const overlay = $("overlay");
  const ctx = overlay.getContext("2d");

  const startScreen = $("startScreen");
  const faceBtn = $("faceBtn");
  const handBtn = $("handBtn");
  const guideFace = $("guideFace");
  const guideHand = $("guideHand");
  const note = $("note");
  const controls = $("controls");
  const clearBtn = $("clearBtn");
  const readout = $("readout");
  const exprLabel = $("exprLabel");
  const objectLabel = $("objectLabel");
  const meterFill = $("meterFill");
  const collection = $("collection");
  const toast = $("toast");

  const ending = $("ending");
  const endingCollage = $("endingCollage");
  const endingStory = $("endingStory");
  const endingTitle = ending.querySelector("h2");

  let mode = null;            // 'face' | 'hand'
  let running = false;
  let lastTime = 0;
  let lastVideoTime = -1;
  let toastTimer = null;
  let endingKind = null;      // 'face' | 'hand'

  /* ---------- 가이드 토글 ---------- */
  function showGuide(which) {
    guideFace.hidden = which !== "face";
    guideHand.hidden = which !== "hand";
  }
  faceBtn.addEventListener("mouseenter", () => showGuide("face"));
  handBtn.addEventListener("mouseenter", () => showGuide("hand"));
  faceBtn.addEventListener("focus", () => showGuide("face"));
  handBtn.addEventListener("focus", () => showGuide("hand"));

  function showToast(msg) {
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast.hidden = true), 1500);
  }

  function resizeCanvas() {
    overlay.width = video.videoWidth || 1280;
    overlay.height = video.videoHeight || 720;
  }

  /* ---------- 시작 ---------- */
  async function start(which) {
    mode = which;
    faceBtn.disabled = handBtn.disabled = true;
    try {
      note.textContent = "모델을 불러오는 중… (최초 1회, 네트워크 필요)";
      SFX.load();
      if (mode === "face") await Camera.setupLandmarker();
      else await Camera.setupHandLandmarker();
      note.textContent = "카메라 권한을 확인하세요…";
      await Camera.startCamera(video);
      if (mode === "face") await Game.load();
      else await Horizon.load();

      SFX.unlock();
      resizeCanvas();

      startScreen.style.display = "none";
      controls.hidden = false;
      readout.hidden = false;
      clearBtn.hidden = mode !== "hand";

      if (mode === "face") SFX.ambientOn(true);
      running = true;
      lastTime = performance.now();
      requestAnimationFrame(loop);
    } catch (err) {
      console.error(err);
      faceBtn.disabled = handBtn.disabled = false;
      note.style.whiteSpace = "pre-line";
      note.style.color = "#ff8a8a";
      note.textContent = "오류: " + err.message +
        "\n카메라가 안 켜지면 README의 '로컬 서버로 실행'을 따라주세요.";
    }
  }

  /* ---------- 루프 ---------- */
  function loop(now) {
    if (!running) return;
    const dt = Math.min(60, now - lastTime);
    lastTime = now;

    let result = null;
    if (video.readyState >= 2 && video.currentTime !== lastVideoTime) {
      lastVideoTime = video.currentTime;
      try {
        result = mode === "face" ? Camera.detect(video, now) : Camera.detectHand(video, now);
      } catch (e) { /* 일시 오류 무시 */ }
    }

    ctx.clearRect(0, 0, overlay.width, overlay.height);
    if (mode === "face") {
      const info = Game.render(ctx, overlay, result, dt);
      updateFaceHUD(info);
      if (info && info.ended) { finishFace(); return; }
    } else {
      const info = Horizon.render(ctx, overlay, result, dt);
      updateHandHUD(info);
      if (info && info.completed) { finishHorizon(); return; }
    }
    SFX.tick(dt);
    requestAnimationFrame(loop);
  }

  function updateFaceHUD(info) {
    if (!info) return;
    exprLabel.textContent = info.emoji + " " + info.label;
    if (info.developing) {
      objectLabel.textContent = "현상 중 " + Math.round(info.progress * 100) + "%";
      meterFill.style.width = Math.round(info.progress * 100) + "%";
    } else {
      objectLabel.textContent = info.hasImage ? "무표정으로 쉬었다 새 표정" : "표정을 지어 3초 유지";
      meterFill.style.width = "0%";
    }
    collection.textContent = `수집 ${info.count} / ${info.target}`;
    if (info.wake) SFX.play(info.wake);
    if (info.justSummoned) showToast(info.emoji + " " + info.label + " · " + info.count + "장째 확정!");
  }

  function updateHandHUD(info) {
    if (!info) return;
    exprLabel.textContent = info.hasHand ? "그리는 중" : "손을 보여주세요";
    objectLabel.textContent = `건물 ${info.buildings}`;
    meterFill.style.width = Math.round(info.speed01 * 100) + "%";
    collection.textContent = `지평선 ${Math.round(info.coverage * 100)}%`;
    SFX.setAmbientLevel(0.12 + info.speed01 * 0.5);
    if (info.spawned) SFX.play("spawn", 0.45);
  }

  /* ---------- 결말: 표정(콜라주 + 이야기) ---------- */
  function finishFace() {
    running = false;
    SFX.play("applause");
    const data = Game.getEnding();
    endingTitle.innerHTML = '수상한 산책클럽<span class="ending-sub">오늘의 산책 기록 · 표정 룰렛</span>';
    endingCollage.className = "ending-collage";
    endingCollage.innerHTML = "";
    data.cards.forEach((c) => {
      const cv = document.createElement("canvas");
      cv.width = cv.height = 160;
      cv.getContext("2d").drawImage(c.blob, 0, 0, 160, 160);
      endingCollage.appendChild(cv);
    });
    endingStory.innerHTML = data.story.map((line) => `<p>${line}</p>`).join("") +
      '<p class="club-sign">— 수상한 산책클럽 ✦ 좋은 산책자 인증</p>';
    endingKind = "face";
    ending.hidden = false;
  }

  /* ---------- 결말: 지평선(완성된 풍경 감상) ---------- */
  function finishHorizon() {
    running = false;
    SFX.play("applause");
    SFX.setAmbientLevel(0.4);
    endingTitle.innerHTML = '수상한 산책클럽<span class="ending-sub">오늘 그린 지평선</span>';
    endingCollage.className = "ending-collage ending-single";
    endingCollage.innerHTML = "";
    const poster = composite();             // 영상+그림 합성(셀카 방향)
    poster.classList.add("poster");
    endingCollage.appendChild(poster);
    endingStory.innerHTML =
      "<p>당신의 손이 그은 선 아래로 이태원이 떠올랐다.</p>" +
      "<p>하나의 도시가, 우연한 손길로 완성되었다.</p>" +
      '<p class="club-sign">— 수상한 산책클럽 ✦ 오늘의 지평선</p>';
    endingKind = "hand";
    ending.hidden = false;
  }

  /* ---------- 합성 캔버스(셀카 방향) ---------- */
  function composite() {
    const out = document.createElement("canvas");
    out.width = overlay.width;
    out.height = overlay.height;
    const c = out.getContext("2d");
    c.save();
    c.translate(out.width, 0);
    c.scale(-1, 1);
    c.drawImage(video, 0, 0, out.width, out.height);
    c.drawImage(overlay, 0, 0);
    c.restore();
    return out;
  }

  function download(canvas, name) {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name + "_" + Date.now() + ".png";
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  /* ---------- 일반 캡처 ---------- */
  function capture() {
    SFX.play("shutter");
    const out = composite();
    const c = out.getContext("2d");
    c.fillStyle = "rgba(0,0,0,0.45)";
    c.fillRect(0, out.height - 46, out.width, 46);
    c.fillStyle = "#fff";
    c.font = "20px -apple-system, sans-serif";
    c.fillText("이태원 초현실주의 놀이 · " + (mode === "face" ? "표정 룰렛" : "자동 지평선"), 18, out.height - 16);
    download(out, "초현실놀이");
  }

  /* ---------- 결말 저장(포스터) ---------- */
  function saveEnding() {
    SFX.play("shutter");
    if (endingKind === "hand") {
      const poster = composite();
      const c = poster.getContext("2d");
      c.fillStyle = "rgba(0,0,0,0.5)";
      c.fillRect(0, poster.height - 52, poster.width, 52);
      c.fillStyle = "#fff";
      c.font = "22px -apple-system, sans-serif";
      c.fillText("수상한 산책클럽 · 오늘 그린 지평선", 18, poster.height - 18);
      download(poster, "수상한산책클럽_지평선");
      return;
    }
    download(buildFacePoster(), "산책의결말");
  }

  function buildFacePoster() {
    const data = Game.getEnding();
    const W = 1080, H = 1350, pad = 48, cols = 5, rows = 2;
    const out = document.createElement("canvas");
    out.width = W; out.height = H;
    const c = out.getContext("2d");
    const bg = c.createRadialGradient(W/2, H*0.25, 80, W/2, H*0.5, H);
    bg.addColorStop(0, "#1a1320"); bg.addColorStop(1, "#0b0b0e");
    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    c.textAlign = "center";
    c.fillStyle = "#ff9ec0";
    c.font = "bold 46px -apple-system, sans-serif";
    c.fillText("수상한 산책클럽", W/2, 84);
    c.fillStyle = "rgba(244,241,234,0.6)";
    c.font = "22px -apple-system, sans-serif";
    c.fillText("오늘의 산책 기록 · 표정 룰렛", W/2, 120);

    const top = 156;
    const gw = (W - pad*2 - (cols-1)*12) / cols;
    data.cards.forEach((card, i) => {
      const cx = pad + (i % cols) * (gw + 12);
      const cy = top + Math.floor(i / cols) * (gw + 12);
      c.drawImage(card.blob, cx, cy, gw, gw);
    });

    let y = top + rows * (gw + 12) + 46;
    c.textAlign = "left";
    c.fillStyle = "#f4f1ea";
    c.font = "26px -apple-system, sans-serif";
    data.story.forEach((line) => { y = wrapText(c, line, pad, y, W - pad*2, 38) + 14; });

    c.textAlign = "center";
    c.fillStyle = "#ff9ec0";
    c.font = "italic 22px -apple-system, sans-serif";
    c.fillText("— 수상한 산책클럽 ✦ 좋은 산책자 인증", W/2, H - 56);
    return out;
  }

  function wrapText(c, text, x, y, maxW, lh) {
    let line = "";
    for (const ch of text) {
      if (c.measureText(line + ch).width > maxW && line) {
        c.fillText(line, x, y); line = ch; y += lh;
      } else line += ch;
    }
    if (line) { c.fillText(line, x, y); }
    return y;
  }

  /* ---------- 다시 시작 ---------- */
  function again() {
    ending.hidden = true;
    if (mode === "face") { Game.reset(); SFX.ambientOn(true); }
    else Horizon.reset();
    running = true;
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    Camera.stop(video);
    SFX.stopAll();
    ending.hidden = true;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    if (mode === "face") Game.reset(); else Horizon.reset();
    controls.hidden = true;
    readout.hidden = true;
    startScreen.style.display = "flex";
    faceBtn.disabled = handBtn.disabled = false;
    note.style.color = "";
    note.textContent = "위 모드를 누르면 카메라 권한을 요청합니다.";
  }

  faceBtn.addEventListener("click", () => start("face"));
  handBtn.addEventListener("click", () => start("hand"));
  $("captureBtn").addEventListener("click", capture);
  $("stopBtn").addEventListener("click", stop);
  clearBtn.addEventListener("click", () => { if (mode === "hand") Horizon.reset(); });
  $("endingSaveBtn").addEventListener("click", saveEnding);
  $("endingAgainBtn").addEventListener("click", again);
})();
