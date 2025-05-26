let video;
let facemesh;
let handpose;
let predictions = [];
let handPredictions = [];
let circlePos = null;

function setup() {
  createCanvas(640, 480).position(
    (windowWidth - 640) / 2,
    (windowHeight - 480) / 2
  );
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  facemesh = ml5.facemesh(video, modelReady);
  facemesh.on('predict', results => {
    predictions = results;
  });

  handpose = ml5.handpose(video, handModelReady);
  handpose.on('predict', results => {
    handPredictions = results;
  });
}

function modelReady() {
  // 臉部模型載入完成
}

function handModelReady() {
  // 手部模型載入完成
}

function draw() {
  // 鏡像畫面
  translate(width, 0);
  scale(-1, 1);

  image(video, 0, 0, width, height);

  if (predictions.length > 0) {
    const keypoints = predictions[0].scaledMesh;
    // 臉部關鍵點
    const nose = keypoints[94];
    const forehead = keypoints[10];
    const leftCheek = keypoints[234];
    const rightCheek = keypoints[454];

    // 預設圓在鼻子
    circlePos = nose;

    // 根據手勢移動圓
    if (handPredictions.length > 0) {
      const gesture = detectGesture(handPredictions[0]);
      if (gesture === 'scissors') {
        circlePos = forehead;
      } else if (gesture === 'rock') {
        circlePos = leftCheek;
      } else if (gesture === 'paper') {
        circlePos = rightCheek;
      }
    }

    // 畫圓
    noFill();
    stroke(255, 0, 0);
    strokeWeight(4);
    ellipse(circlePos[0], circlePos[1], 50, 50);
  }
}

// 手勢偵測（簡易版，根據手指張開狀態判斷）
function detectGesture(hand) {
  // hand.landmarks: 21個手部關鍵點
  // 0:手腕, 4:大拇指, 8:食指, 12:中指, 16:無名指, 20:小指
  const landmarks = hand.landmarks;
  const fingers = [
    isFingerOpen(landmarks, 4, 3, 2),   // 大拇指
    isFingerOpen(landmarks, 8, 7, 6),   // 食指
    isFingerOpen(landmarks, 12, 11, 10),// 中指
    isFingerOpen(landmarks, 16, 15, 14),// 無名指
    isFingerOpen(landmarks, 20, 19, 18) // 小指
  ];

  // 剪刀: 只有食指和中指張開
  if (fingers[1] && fingers[2] && !fingers[0] && !fingers[3] && !fingers[4]) {
    return 'scissors';
  }
  // 石頭: 全部收起
  if (!fingers[0] && !fingers[1] && !fingers[2] && !fingers[3] && !fingers[4]) {
    return 'rock';
  }
  // 布: 全部張開
  if (fingers[0] && fingers[1] && fingers[2] && fingers[3] && fingers[4]) {
    return 'paper';
  }
  return null;
}

// 判斷手指是否張開
function isFingerOpen(landmarks, tip, pip, mcp) {
  // 大拇指用 x 座標判斷（因為大拇指是橫向張開）
  if (tip === 4) {
    return landmarks[tip][0] > landmarks[pip][0];
  }
  // 其他手指用 y 座標判斷（指尖在關節上方）
  return landmarks[tip][1] < landmarks[pip][1] && landmarks[pip][1] < landmarks[mcp][1];
}
