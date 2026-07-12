/*
 * audio.js — 사운드 엔진
 *
 * 표정/제스처가 깨어나는 순간 효과음을 재생하고,
 * 도시 앰비언스를 바닥에 깔아준다.
 *
 * 효과음은 eumgil-sound-journey에서 가져온 파일.
 * ElevenLabs 등으로 새로 만든 mp3를 같은 경로/이름으로 덮어쓰면 자동 교체됨.
 *   assets/sounds/smile.m4a · surprise.m4a · frown.mp3 · ambient_city.mp3 ...
 */
window.SFX = (function () {
  const SRC = {
    smile: "assets/sounds/smile.m4a",       // ✨ 반짝 → 꽃
    surprise: "assets/sounds/surprise.m4a", // 🔔 띵동 → 라바콘
    frown: "assets/sounds/frown.mp3",       // 🐈 야옹 → 경고판
    shutter: "assets/sounds/shutter.m4a",   // 📸 캡처
    applause: "assets/sounds/applause.m4a", // 👏 전부 수집
    spawn: "assets/sounds/surprise.m4a",    // 지평선 건물 솟음(띵동 재활용, 작게)
  };

  const pool = {};
  let ambient = null;
  let ambientTarget = 0;
  let ambientVol = 0;
  let unlocked = false;

  function make(src, loop, vol) {
    const a = new Audio(src);
    a.loop = !!loop;
    a.volume = vol == null ? 1 : vol;
    a.preload = "auto";
    return a;
  }

  function load() {
    for (const [k, src] of Object.entries(SRC)) pool[k] = make(src);
    ambient = make("assets/sounds/ambient_city.mp3", true, 0);
  }

  // 사용자 제스처(시작 버튼)에서 호출 → 모바일 자동재생 잠금 해제
  function unlock() {
    unlocked = true;
    const all = [...Object.values(pool), ambient];
    all.forEach((a) => {
      if (!a) return;
      a.play().then(() => { a.pause(); a.currentTime = 0; }).catch(() => {});
    });
    if (ambient) ambient.play().catch(() => {});
  }

  // 한 방 효과음 (겹쳐 재생 가능하도록 복제)
  function play(key, vol) {
    const base = pool[key];
    if (!base) return;
    const a = base.cloneNode(true);
    a.volume = vol == null ? 1 : vol;
    a.play().catch(() => {});
  }

  function ambientOn(on) {
    ambientTarget = on ? 0.32 : 0;
    if (on && ambient && unlocked && ambient.paused) ambient.play().catch(() => {});
  }

  // 지평선 모드: 그리는 속도에 따라 도시 소리 크기 변화 (0~1)
  function setAmbientLevel(v) {
    ambientTarget = Math.max(0, Math.min(0.7, v));
    if (ambient && unlocked && ambient.paused) ambient.play().catch(() => {});
  }

  // 매 프레임 앰비언스 볼륨 부드럽게 보간
  function tick(dt) {
    if (!ambient) return;
    ambientVol += (ambientTarget - ambientVol) * Math.min(1, dt / 300);
    ambient.volume = Math.max(0, Math.min(1, ambientVol));
  }

  function stopAll() {
    if (ambient) { ambient.pause(); ambient.currentTime = 0; }
    ambientTarget = 0;
    ambientVol = 0;
  }

  return { load, unlock, play, ambientOn, setAmbientLevel, tick, stopAll };
})();
