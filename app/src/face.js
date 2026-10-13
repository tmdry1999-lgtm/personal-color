// MediaPipe: 얼굴 점 478개 + 머리카락 분리 (raw/web/mediapipe-segmenter.md)
const VISION = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.0';
const FACE_MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const SEG_MODEL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite';

async function withGpuFallback(create) {
  try {
    return await create('GPU');
  } catch {
    return create('CPU');
  }
}

export async function createDetectors() {
  const { FilesetResolver, FaceLandmarker, ImageSegmenter } = await import(`${VISION}/vision_bundle.mjs`);
  const fileset = await FilesetResolver.forVisionTasks(`${VISION}/wasm`);
  const landmarker = await withGpuFallback((delegate) => FaceLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: FACE_MODEL, delegate },
    runningMode: 'VIDEO',
    numFaces: 2,
  }));
  const segmenter = await withGpuFallback((delegate) => ImageSegmenter.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: SEG_MODEL, delegate },
    runningMode: 'VIDEO',
    outputCategoryMask: true,
    outputConfidenceMasks: false,
  }));

  let ts = 0;
  const nextTs = () => (ts = Math.max(ts + 1, Math.round(performance.now())));

  return {
    detectFaces(source) {
      return landmarker.detectForVideo(source, nextTs()).faceLandmarks;
    },
    segmentHair(source) {
      const result = segmenter.segmentForVideo(source, nextTs());
      const mask = result.categoryMask;
      const out = mask ? { data: mask.getAsUint8Array().slice(), width: mask.width, height: mask.height } : null;
      result.close();
      return out;
    },
  };
}
