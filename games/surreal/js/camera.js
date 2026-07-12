/*
 * camera.js — 카메라 + MediaPipe Face Landmarker 초기화
 *
 * tasks-vision는 CDN에서 동적 import 한다.
 * (file:// 더블클릭 실행에서도 원격 ESM은 동적 import로 불러올 수 있음)
 */
window.Camera = (function () {
  const CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18";
  const FACE_MODEL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
  const HAND_MODEL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

  let faceLandmarker = null;
  let handLandmarker = null;

  // GPU 추론이 실패하는 PC가 있어 CPU로 자동 폴백
  async function createWithFallback(Klass, resolver, opts) {
    try {
      return await Klass.createFromOptions(resolver, {
        ...opts, baseOptions: { ...opts.baseOptions, delegate: "GPU" },
      });
    } catch (e) {
      console.warn("GPU 델리게이트 실패 → CPU로 폴백", e);
      return await Klass.createFromOptions(resolver, {
        ...opts, baseOptions: { ...opts.baseOptions, delegate: "CPU" },
      });
    }
  }

  async function setupLandmarker() {
    const vision = await import(CDN);
    const { FaceLandmarker, FilesetResolver } = vision;
    const resolver = await FilesetResolver.forVisionTasks(CDN + "/wasm");
    faceLandmarker = await createWithFallback(FaceLandmarker, resolver, {
      baseOptions: { modelAssetPath: FACE_MODEL },
      outputFaceBlendshapes: true,
      runningMode: "VIDEO",
      numFaces: 1,
    });
    return faceLandmarker;
  }

  async function setupHandLandmarker() {
    const vision = await import(CDN);
    const { HandLandmarker, FilesetResolver } = vision;
    const resolver = await FilesetResolver.forVisionTasks(CDN + "/wasm");
    handLandmarker = await createWithFallback(HandLandmarker, resolver, {
      baseOptions: { modelAssetPath: HAND_MODEL },
      runningMode: "VIDEO",
      numHands: 1,
    });
    return handLandmarker;
  }

  function detectHand(videoEl, timestampMs) {
    if (!handLandmarker) return null;
    return handLandmarker.detectForVideo(videoEl, timestampMs);
  }

  async function startCamera(videoEl) {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
    videoEl.srcObject = stream;
    await videoEl.play();
    await new Promise((resolve) => {
      if (videoEl.videoWidth) return resolve();
      videoEl.onloadedmetadata = () => resolve();
    });
    return stream;
  }

  function detect(videoEl, timestampMs) {
    if (!faceLandmarker) return null;
    return faceLandmarker.detectForVideo(videoEl, timestampMs);
  }

  function stop(videoEl) {
    const stream = videoEl.srcObject;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    videoEl.srcObject = null;
  }

  return { setupLandmarker, setupHandLandmarker, startCamera, detect, detectHand, stop };
})();
