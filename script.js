const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const info = document.getElementById("info");
const wordEl = document.getElementById("word");
const sentenceEl = document.getElementById("sentence");

canvas.width = 640;
canvas.height = 480;

/* =========================
   KATA & KALIMAT
========================= */
const fingerWords = {
  1: "Aku",
  2: "Mau",
  3: "Nikah",
  4: "Sama",
  5: "Kamu",
  6: "Cipung",
  7: "Kamalia",
  8: "Ngambbekku",
  9: "Cantikku",
};

const finalSentence =
  "Aku Mau Nikah Sama Kamu Cipung Kamalia Ngambbekku Cantikku";

/* =========================
   STABILIZER
========================= */
let lastCount = -1;
let stableCount = 0;
let sameFrame = 0;

function stabilizeFingerCount(current) {
  if (current === lastCount) {
    sameFrame++;
    if (sameFrame > 6) stableCount = current;
  } else {
    sameFrame = 0;
  }
  lastCount = current;
  return stableCount;
}

/* =========================
   ANGLE-BASED FINGER LOGIC
========================= */
function angle(a, b, c) {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAB = Math.hypot(ab.x, ab.y);
  const magCB = Math.hypot(cb.x, cb.y);
  return Math.acos(dot / (magAB * magCB)) * (180 / Math.PI);
}

function isFingerStraight(tip, pip, mcp) {
  return angle(tip, pip, mcp) > 160;
}

function countFingers(landmarks) {
  let count = 0;

  // Telunjuk
  if (isFingerStraight(landmarks[8], landmarks[6], landmarks[5])) count++;
  // Tengah
  if (isFingerStraight(landmarks[12], landmarks[10], landmarks[9])) count++;
  // Manis
  if (isFingerStraight(landmarks[16], landmarks[14], landmarks[13])) count++;
  // Kelingking
  if (isFingerStraight(landmarks[20], landmarks[18], landmarks[17])) count++;

  // Ibu jari (horizontal check)
  if (Math.abs(landmarks[4].x - landmarks[2].x) > 0.05) count++;

  return count;
}

/* =========================
   MEDIAPIPE HANDS
========================= */
const hands = new Hands({
  locateFile: (file) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
});

hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7,
});

hands.onResults((results) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

  let totalFingers = 0;

  if (results.multiHandLandmarks) {
    results.multiHandLandmarks.forEach((landmarks) => {
      totalFingers += countFingers(landmarks);

      drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
        color: "#00e5ff",
        lineWidth: 3,
      });
      drawLandmarks(ctx, landmarks, {
        color: "#ffffff",
        lineWidth: 2,
      });
    });
  }

  const stable = stabilizeFingerCount(totalFingers);
  info.innerText = stable;

  if (stable >= 1 && stable <= 9) {
    wordEl.innerText = fingerWords[stable];
    sentenceEl.innerText = "-";
  } else if (stable === 10) {
    wordEl.innerText = "-";
    sentenceEl.innerText = finalSentence;
  } else {
    wordEl.innerText = "-";
    sentenceEl.innerText = "-";
  }
});

/* =========================
   CAMERA
========================= */
const camera = new Camera(video, {
  onFrame: async () => {
    await hands.send({ image: video });
  },
  width: 640,
  height: 480,
});

camera.start();
