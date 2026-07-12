(() => {
  'use strict';

  const els = {
    intro: document.getElementById('intro'),
    camera: document.getElementById('camera'),
    preview: document.getElementById('preview'),
    startBtn: document.getElementById('start-btn'),
    closeBtn: document.getElementById('close-btn'),
    video: document.getElementById('video'),
    maskSvg: document.getElementById('mask-svg'),
    captureBtn: document.getElementById('capture-btn'),
    previewImg: document.getElementById('preview-img'),
    retakeBtn: document.getElementById('retake-btn'),
    downloadBtn: document.getElementById('download-btn'),
    downloadHint: document.getElementById('download-hint'),
    errorOverlay: document.getElementById('error-overlay'),
    errorText: document.getElementById('error-text'),
    errorRetry: document.getElementById('error-retry'),
    shapeRow: document.getElementById('shape-row'),
    zoomBar: document.getElementById('zoom-bar'),
    zoomSlider: document.getElementById('zoom-slider'),
    zoomIn: document.getElementById('zoom-in'),
    zoomOut: document.getElementById('zoom-out'),
    zoomLabel: document.getElementById('zoom-label'),
  };

  // ============================================================
  // 도형 13가지 정의
  // ============================================================
  const SHAPES = [
    { id: 'circle',   label: '동그라미' },
    { id: 'square',   label: '네모' },
    { id: 'triangle', label: '세모' },
    { id: 'star',     label: '별' },
    { id: 'heart',    label: '하트' },
    { id: 'diamond',  label: '마름모' },
    { id: 'hexagon',  label: '육각형' },
    { id: 'pentagon', label: '오각형' },
    { id: 'cross',    label: '십자' },
    { id: 'cloud',    label: '구름' },
    { id: 'flower',   label: '꽃' },
    { id: 'leaf',     label: '잎' },
    { id: 'drop',     label: '물방울' },
  ];

  // 도형의 SVG path d="" 문자열 생성 (cx, cy 중심, half = 외접원 반지름)
  function getShapePath(shape, cx, cy, half) {
    switch (shape) {
      case 'circle': {
        const r = half;
        return `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2*r} 0 a ${r} ${r} 0 1 0 ${-2*r} 0 Z`;
      }
      case 'square':
        return `M ${cx - half} ${cy - half} L ${cx + half} ${cy - half} L ${cx + half} ${cy + half} L ${cx - half} ${cy + half} Z`;
      case 'triangle': {
        const cos30 = Math.cos(Math.PI / 6);
        const sin30 = Math.sin(Math.PI / 6);
        return `M ${cx} ${cy - half} L ${cx + half * cos30} ${cy + half * sin30} L ${cx - half * cos30} ${cy + half * sin30} Z`;
      }
      case 'star': {
        const pts = [];
        for (let i = 0; i < 10; i++) {
          const a = (Math.PI * 2 * i / 10) - Math.PI / 2;
          const r = i % 2 === 0 ? half : half * 0.45;
          pts.push(`${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`);
        }
        return 'M ' + pts.join(' L ') + ' Z';
      }
      case 'heart': {
        const w = half;
        return `M ${cx} ${cy + half * 0.85}
                C ${cx - w * 1.4} ${cy + half * 0.05}, ${cx - w * 1.0} ${cy - half * 0.85}, ${cx} ${cy - half * 0.15}
                C ${cx + w * 1.0} ${cy - half * 0.85}, ${cx + w * 1.4} ${cy + half * 0.05}, ${cx} ${cy + half * 0.85} Z`;
      }
      case 'diamond':
        return `M ${cx} ${cy - half} L ${cx + half} ${cy} L ${cx} ${cy + half} L ${cx - half} ${cy} Z`;
      case 'hexagon': {
        const pts = [];
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI * 2 * i / 6) - Math.PI / 2;
          pts.push(`${cx + half * Math.cos(a)} ${cy + half * Math.sin(a)}`);
        }
        return 'M ' + pts.join(' L ') + ' Z';
      }
      case 'pentagon': {
        const pts = [];
        for (let i = 0; i < 5; i++) {
          const a = (Math.PI * 2 * i / 5) - Math.PI / 2;
          pts.push(`${cx + half * Math.cos(a)} ${cy + half * Math.sin(a)}`);
        }
        return 'M ' + pts.join(' L ') + ' Z';
      }
      case 'cross': {
        const t = half * 0.34;
        return `M ${cx - t} ${cy - half} L ${cx + t} ${cy - half} L ${cx + t} ${cy - t} L ${cx + half} ${cy - t} L ${cx + half} ${cy + t} L ${cx + t} ${cy + t} L ${cx + t} ${cy + half} L ${cx - t} ${cy + half} L ${cx - t} ${cy + t} L ${cx - half} ${cy + t} L ${cx - half} ${cy - t} L ${cx - t} ${cy - t} Z`;
      }
      case 'cloud': {
        const w = half;
        return `M ${cx - w * 0.85} ${cy + half * 0.35}
                C ${cx - w * 1.25} ${cy + half * 0.35}, ${cx - w * 1.25} ${cy - half * 0.20}, ${cx - w * 0.7} ${cy - half * 0.15}
                C ${cx - w * 0.65} ${cy - half * 0.70}, ${cx - w * 0.10} ${cy - half * 0.85}, ${cx + w * 0.15} ${cy - half * 0.55}
                C ${cx + w * 0.30} ${cy - half * 0.95}, ${cx + w * 0.90} ${cy - half * 0.75}, ${cx + w * 0.80} ${cy - half * 0.20}
                C ${cx + w * 1.25} ${cy - half * 0.20}, ${cx + w * 1.25} ${cy + half * 0.35}, ${cx + w * 0.85} ${cy + half * 0.35} Z`;
      }
      case 'flower': {
        // 5장 꽃잎 — 각 꽃잎 = 중심에서 떨어진 원
        const petalR = half * 0.45;
        const dist = half * 0.55;
        let d = '';
        for (let i = 0; i < 5; i++) {
          const a = (Math.PI * 2 * i / 5) - Math.PI / 2;
          const px = cx + dist * Math.cos(a);
          const py = cy + dist * Math.sin(a);
          d += `M ${px - petalR} ${py} a ${petalR} ${petalR} 0 1 0 ${petalR * 2} 0 a ${petalR} ${petalR} 0 1 0 ${-petalR * 2} 0 Z `;
        }
        return d.trim();
      }
      case 'leaf':
        return `M ${cx - half * 0.85} ${cy + half * 0.4}
                Q ${cx - half * 0.2} ${cy - half * 0.9}, ${cx + half * 0.85} ${cy - half * 0.4}
                Q ${cx + half * 0.2} ${cy + half * 0.9}, ${cx - half * 0.85} ${cy + half * 0.4} Z`;
      case 'drop':
        return `M ${cx} ${cy - half}
                C ${cx + half * 0.95} ${cy - half * 0.3}, ${cx + half} ${cy + half * 0.4}, ${cx} ${cy + half}
                C ${cx - half} ${cy + half * 0.4}, ${cx - half * 0.95} ${cy - half * 0.3}, ${cx} ${cy - half} Z`;
      default:
        return '';
    }
  }

  // 미니 SVG 아이콘 (버튼용, viewBox 24x24, 중심 12, half 10)
  function makeShapeIconSVG(shape) {
    return `<svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="${getShapePath(shape, 12, 12, 10)}" fill="currentColor" fill-rule="evenodd" />
    </svg>`;
  }

  // ============================================================
  // 상태
  // ============================================================
  let currentShape = 'circle';
  let stream = null;
  let lastBlobUrl = null;
  let lastBlob = null;
  let shapeBtnEls = [];

  // 줌 상태
  let currentZoom = 1;
  let zoomRange = { min: 1, max: 3, step: 0.05 };
  let useHardwareZoom = false;
  let videoTrack = null;
  let zoomDebounce = null;

  // ============================================================
  // 에러 표시
  // ============================================================
  function showError(msg) {
    els.errorText.textContent = msg;
    els.errorOverlay.hidden = false;
  }
  function hideError() {
    els.errorOverlay.hidden = true;
  }

  // ============================================================
  // 카메라
  // ============================================================
  async function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showError('이 브라우저는 카메라를 지원하지 않아요.');
      return false;
    }
    const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);
    if (location.protocol !== 'https:' && !isLocal) {
      showError('카메라는 HTTPS 환경에서만 작동해요. https:// 주소로 접속해 주세요.');
      return false;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width:  { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      els.video.srcObject = stream;
      try { await els.video.play(); } catch (_) {}
      detectZoomCapability();
      return true;
    } catch (e) {
      console.error('Camera error:', e);
      let msg = '카메라를 켜지 못했어요.';
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        msg = '카메라 권한이 거부되었어요.\n브라우저 설정에서 카메라 접근을 허용해 주세요.';
      } else if (e.name === 'NotFoundError' || e.name === 'OverconstrainedError') {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          els.video.srcObject = stream;
          try { await els.video.play(); } catch (_) {}
          return true;
        } catch (e2) {
          msg = '카메라를 찾을 수 없어요.';
        }
      } else if (e.name === 'NotReadableError') {
        msg = '다른 앱이 카메라를 사용 중이에요.\n다른 앱을 닫고 다시 시도해 주세요.';
      }
      showError(msg);
      return false;
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }
    videoTrack = null;
    useHardwareZoom = false;
    currentZoom = 1;
    if (els.video) els.video.style.transform = '';
  }

  // ============================================================
  // 줌 (하드웨어 우선, CSS scale 폴백)
  // ============================================================
  function detectZoomCapability() {
    if (!stream) return;
    videoTrack = stream.getVideoTracks()[0];
    let hasHardware = false;
    if (videoTrack && typeof videoTrack.getCapabilities === 'function') {
      try {
        const caps = videoTrack.getCapabilities();
        if (caps && caps.zoom) {
          hasHardware = true;
          zoomRange = {
            min:  caps.zoom.min  ?? 1,
            max:  caps.zoom.max  ?? 3,
            step: caps.zoom.step ?? 0.05,
          };
          const settings = videoTrack.getSettings ? videoTrack.getSettings() : {};
          currentZoom = settings.zoom ?? zoomRange.min;
        }
      } catch (e) { /* ignore */ }
    }
    if (!hasHardware) {
      // 디지털 줌 (CSS scale)
      zoomRange = { min: 1, max: 3, step: 0.05 };
      currentZoom = 1;
    }
    useHardwareZoom = hasHardware;
    setupZoomUI();
  }

  function setupZoomUI() {
    if (!els.zoomBar || !els.zoomSlider) return;
    els.zoomBar.hidden = false;
    els.zoomSlider.min = zoomRange.min;
    els.zoomSlider.max = zoomRange.max;
    els.zoomSlider.step = zoomRange.step;
    els.zoomSlider.value = currentZoom;
    updateZoomLabel();
  }

  function updateZoomLabel() {
    if (els.zoomLabel) {
      els.zoomLabel.textContent = currentZoom.toFixed(1) + '×';
    }
    if (els.zoomSlider && Math.abs(Number(els.zoomSlider.value) - currentZoom) > 1e-6) {
      els.zoomSlider.value = currentZoom;
    }
  }

  function clampZoom(v) {
    return Math.max(zoomRange.min, Math.min(zoomRange.max, v));
  }

  function setZoom(value) {
    const z = clampZoom(value);
    currentZoom = z;
    if (useHardwareZoom && videoTrack) {
      // 하드웨어 줌은 너무 자주 호출하면 끊김. 디바운스.
      clearTimeout(zoomDebounce);
      zoomDebounce = setTimeout(() => {
        videoTrack.applyConstraints({ advanced: [{ zoom: z }] }).catch((e) => {
          console.warn('hardware zoom failed, fallback to css:', e);
          useHardwareZoom = false;
          els.video.style.transform = `scale(${z})`;
          els.video.style.transformOrigin = 'center center';
        });
      }, 40);
    } else {
      els.video.style.transform = `scale(${z})`;
      els.video.style.transformOrigin = 'center center';
    }
    updateZoomLabel();
  }

  // ============================================================
  // 마스크 (SVG 렌더링)
  // ============================================================
  function getShapeGeometry(w, h) {
    const size = Math.min(w, h) * 0.78;
    const cx = w / 2;
    const cy = h / 2 - h * 0.04;
    return { cx, cy, half: size / 2, size };
  }

  function renderMask() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const { cx, cy, half } = getShapeGeometry(w, h);
    const shape = getShapePath(currentShape, cx, cy, half);

    els.maskSvg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    els.maskSvg.setAttribute('width', w);
    els.maskSvg.setAttribute('height', h);
    // SVG mask 방식: 흰색 영역만 보이고, 검정 도형 영역은 뚫림
    els.maskSvg.innerHTML = `
      <defs>
        <mask id="shape-hole">
          <rect width="${w}" height="${h}" fill="white" />
          <path d="${shape}" fill="black" />
        </mask>
      </defs>
      <rect width="${w}" height="${h}" fill="#FFFFFF" mask="url(#shape-hole)" />
      <path d="${shape}" fill="none" stroke="#14224F" stroke-width="3" stroke-linejoin="round" />
    `;
  }

  // ============================================================
  // 도형 버튼 동적 생성
  // ============================================================
  function buildShapeButtons() {
    els.shapeRow.innerHTML = '';
    shapeBtnEls = [];
    SHAPES.forEach(s => {
      const btn = document.createElement('button');
      btn.className = 'shape-btn';
      btn.type = 'button';
      btn.dataset.shape = s.id;
      btn.setAttribute('aria-label', s.label);
      btn.innerHTML = makeShapeIconSVG(s.id);
      btn.addEventListener('click', () => {
        setShape(s.id);
        // 활성 버튼 가운데로 스크롤
        btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      });
      els.shapeRow.appendChild(btn);
      shapeBtnEls.push(btn);
    });
  }

  function setShape(shape) {
    if (!SHAPES.find(s => s.id === shape)) return;
    currentShape = shape;
    shapeBtnEls.forEach(b => {
      b.classList.toggle('active', b.dataset.shape === shape);
    });
    renderMask();
  }

  // ============================================================
  // 촬영
  // ============================================================
  function flashAnim() {
    const flash = document.createElement('div');
    flash.className = 'flash fire';
    els.camera.appendChild(flash);
    setTimeout(() => flash.remove(), 400);
  }

  // 알파 채널 기반 bounding box 계산 (투명하지 않은 픽셀의 외접 사각형)
  function findOpaqueBoundingBox(ctx, w, h) {
    const data = ctx.getImageData(0, 0, w, h).data;
    let minX = w, minY = h, maxX = -1, maxY = -1;
    for (let y = 0; y < h; y++) {
      const rowOffset = y * w * 4;
      for (let x = 0; x < w; x++) {
        if (data[rowOffset + x * 4 + 3] > 0) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX === -1) return { x: 0, y: 0, w, h };
    return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
  }

  function capture() {
    const v = els.video;
    if (!v.videoWidth || !v.videoHeight) return;

    flashAnim();

    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const canvasW = Math.round(screenW * dpr);
    const canvasH = Math.round(screenH * dpr);

    // 1) 작업용 캔버스 — 배경 비워둠 (투명)
    const canvas = document.createElement('canvas');
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d');

    // 비디오 cover 계산
    const screenRatio = canvasW / canvasH;
    const vRatio = v.videoWidth / v.videoHeight;
    let sx, sy, sw, sh;
    if (vRatio > screenRatio) {
      sh = v.videoHeight;
      sw = sh * screenRatio;
      sx = (v.videoWidth - sw) / 2;
      sy = 0;
    } else {
      sw = v.videoWidth;
      sh = sw / screenRatio;
      sx = 0;
      sy = (v.videoHeight - sh) / 2;
    }

    // 디지털 줌(CSS scale) 보정 — 비디오 중심의 1/zoom 영역을 잘라 캔버스에 채움
    if (!useHardwareZoom && currentZoom > 1) {
      const cf = 1 / currentZoom;
      const cw = sw * cf;
      const ch = sh * cf;
      sx = sx + (sw - cw) / 2;
      sy = sy + (sh - ch) / 2;
      sw = cw;
      sh = ch;
    }

    const { cx, cy, half } = getShapeGeometry(canvasW, canvasH);
    const shapeD = getShapePath(currentShape, cx, cy, half);
    const shapePath2D = new Path2D(shapeD);

    // 2) 도형 영역만 클립 + 비디오 그리기 → 도형 안쪽만 픽셀, 바깥은 투명
    ctx.save();
    ctx.clip(shapePath2D);
    ctx.drawImage(v, sx, sy, sw, sh, 0, 0, canvasW, canvasH);
    ctx.restore();

    // 3) 도형 외곽선 (네이비)
    const lineWidth = Math.max(2, 3 * dpr);
    ctx.strokeStyle = '#14224F';
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = 'round';
    ctx.stroke(shapePath2D);

    // 4) 알파 기준 bounding box 계산 후 그 영역만 잘라낸 새 캔버스 생성
    const pad = Math.ceil(lineWidth / 2) + 2; // 외곽선 두께 잘리지 않게 여유
    const bbox = findOpaqueBoundingBox(ctx, canvasW, canvasH);
    const cropX = Math.max(0, bbox.x - pad);
    const cropY = Math.max(0, bbox.y - pad);
    const cropW = Math.min(canvasW - cropX, bbox.w + pad * 2);
    const cropH = Math.min(canvasH - cropY, bbox.h + pad * 2);

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = cropW;
    cropCanvas.height = cropH;
    const cropCtx = cropCanvas.getContext('2d');
    cropCtx.drawImage(canvas, -cropX, -cropY);

    // 5) PNG로 (투명 배경 유지)
    cropCanvas.toBlob((blob) => {
      if (!blob) {
        showError('이미지를 만들지 못했어요. 다시 시도해 주세요.');
        return;
      }
      if (lastBlobUrl) URL.revokeObjectURL(lastBlobUrl);
      lastBlob = blob;
      lastBlobUrl = URL.createObjectURL(blob);
      els.previewImg.src = lastBlobUrl;
      els.camera.hidden = true;
      els.preview.hidden = false;
    }, 'image/png');
  }

  // ============================================================
  // 다운로드
  // ============================================================
  async function download() {
    if (!lastBlob) return;
    const filename = makeFilename();
    const file = new File([lastBlob], filename, { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: '수상한 사진' });
        return;
      } catch (e) {
        if (e.name === 'AbortError') return;
        console.warn('Share failed, fallback:', e);
      }
    }

    const a = document.createElement('a');
    a.href = lastBlobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    if (isIOS()) {
      els.downloadHint.hidden = false;
    }
  }

  function makeFilename() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const s = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    return `suspicious-walk-${s}.png`;
  }

  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  // ============================================================
  // 화면 전환
  // ============================================================
  function retake() {
    els.preview.hidden = true;
    els.camera.hidden = false;
    els.downloadHint.hidden = true;
    renderMask();
    // 줌 상태 다시 적용 (CSS scale 유지)
    if (!useHardwareZoom && currentZoom > 1) {
      els.video.style.transform = `scale(${currentZoom})`;
      els.video.style.transformOrigin = 'center center';
    }
  }

  function closeCamera() {
    stopCamera();
    els.camera.hidden = true;
    els.intro.hidden = false;
  }

  // ============================================================
  // 이벤트
  // ============================================================
  els.startBtn.addEventListener('click', async () => {
    els.intro.hidden = true;
    els.camera.hidden = false;
    setShape(currentShape);
    const ok = await startCamera();
    if (ok) renderMask();
  });

  els.errorRetry.addEventListener('click', async () => {
    hideError();
    const ok = await startCamera();
    if (ok) renderMask();
  });

  els.closeBtn.addEventListener('click', closeCamera);

  els.captureBtn.addEventListener('click', capture);
  els.retakeBtn.addEventListener('click', retake);
  els.downloadBtn.addEventListener('click', download);

  // 줌 컨트롤 이벤트
  if (els.zoomSlider) {
    els.zoomSlider.addEventListener('input', (e) => {
      setZoom(Number(e.target.value));
    });
  }
  if (els.zoomIn) {
    els.zoomIn.addEventListener('click', () => setZoom(currentZoom + 0.2));
  }
  if (els.zoomOut) {
    els.zoomOut.addEventListener('click', () => setZoom(currentZoom - 0.2));
  }

  // 핀치 줌 (비디오 위에서 두 손가락 늘이기/오므리기)
  let pinchStart = null;
  function pinchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
  els.video.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      pinchStart = { distance: pinchDistance(e.touches), zoom: currentZoom };
    }
  }, { passive: false });
  els.video.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && pinchStart) {
      e.preventDefault();
      const d = pinchDistance(e.touches);
      const scale = d / pinchStart.distance;
      setZoom(pinchStart.zoom * scale);
    }
  }, { passive: false });
  els.video.addEventListener('touchend', () => { pinchStart = null; });
  els.video.addEventListener('touchcancel', () => { pinchStart = null; });

  // 리사이즈
  let resizeTimer = null;
  function onResize() {
    if (els.camera.hidden) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => renderMask(), 100);
  }
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', () => setTimeout(onResize, 300));

  window.addEventListener('pagehide', stopCamera);

  // 초기화
  buildShapeButtons();
  setShape(currentShape);
})();
