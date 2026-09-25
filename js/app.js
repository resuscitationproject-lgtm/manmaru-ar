import { addStamp, countValidStamps, createStampStore } from "./stamp-store.js";

const $ = (selector) => document.querySelector(selector);
const ui = {
  welcome: $("#welcome"), welcomeCharacter: $("#welcome-character"), title: $("#event-title"),
  description: $("#event-description"), start: $("#start-button"), arView: $("#ar-view"),
  arContainer: $("#ar-container"), eventNameSmall: $("#event-name-small"), progress: $("#progress-label"),
  close: $("#close-button"), guide: $("#guide"), guideMessage: $("#guide-message"),
  stampCard: $("#stamp-card"), discovery: $("#discovery-message"), stamp: $("#stamp-button"),
  success: $("#success-card"), successTitle: $("#success-title"), successMessage: $("#success-message"),
  continueButton: $("#continue-button"), error: $("#error-card"), errorMessage: $("#error-message"),
  retry: $("#retry-button")
};

let config;
let point;
let scene;
let target;
let arSystem;
let store;
let progress;
let targetVisible = false;

async function loadConfig() {
  const response = await fetch("./event-config.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`設定ファイルを読み込めませんでした (${response.status})`);
  const value = await response.json();
  if (!value.event?.id || !value.ar?.targetFile || !Array.isArray(value.points) || value.points.length === 0) {
    throw new Error("event-config.json の必須項目が不足しています");
  }
  return value;
}

function drawSpeech(canvas, speech) {
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(255,255,255,.96)";
  context.strokeStyle = "#30251f";
  context.lineWidth = 16;
  context.beginPath();
  context.roundRect(24, 24, 976, 292, 54);
  context.fill();
  context.stroke();
  context.beginPath();
  context.moveTo(230, 312);
  context.lineTo(320, 312);
  context.lineTo(260, 370);
  context.closePath();
  context.fill();
  context.stroke();
  context.fillStyle = "#30251f";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "bold 62px sans-serif";
  const lines = speech.split("\n").slice(0, 3);
  const firstY = 170 - ((lines.length - 1) * 42);
  lines.forEach((line, index) => context.fillText(line, 512, firstY + (index * 84), 900));
}

function makeScene() {
  scene = document.createElement("a-scene");
  scene.setAttribute("embedded", "");
  scene.setAttribute("color-space", "sRGB");
  scene.setAttribute("renderer", "colorManagement: true; physicallyCorrectLights: true; antialias: true");
  scene.setAttribute("vr-mode-ui", "enabled: false");
  scene.setAttribute("device-orientation-permission-ui", "enabled: false");
  scene.setAttribute("mindar-image", [
    `imageTargetSrc: ${config.ar.targetFile}`,
    "autoStart: false",
    "uiLoading: no", "uiScanning: no", "uiError: no",
    `filterMinCF: ${config.ar.filterMinCF ?? 0.001}`,
    `filterBeta: ${config.ar.filterBeta ?? 1000}`,
    `warmupTolerance: ${config.ar.warmupTolerance ?? 5}`,
    `missTolerance: ${config.ar.missTolerance ?? 5}`
  ].join("; "));

  const assets = document.createElement("a-assets");
  assets.setAttribute("timeout", "15000");
  const character = document.createElement("img");
  character.id = "ar-character";
  character.src = point.characterImage;
  character.alt = point.characterAlt || "ARキャラクター";
  character.crossOrigin = "anonymous";
  const speechCanvas = document.createElement("canvas");
  speechCanvas.id = "speech-canvas";
  speechCanvas.width = 1024;
  speechCanvas.height = 384;
  drawSpeech(speechCanvas, point.speech);
  assets.append(character, speechCanvas);

  const camera = document.createElement("a-camera");
  camera.setAttribute("position", "0 0 0");
  camera.setAttribute("look-controls", "enabled: false");

  target = document.createElement("a-entity");
  target.setAttribute("mindar-image-target", `targetIndex: ${point.targetIndex}`);
  const characterPlane = document.createElement("a-plane");
  characterPlane.setAttribute("src", "#ar-character");
  characterPlane.setAttribute("position", "0 0.05 0.02");
  characterPlane.setAttribute("width", "1.12");
  characterPlane.setAttribute("height", "1.12");
  characterPlane.setAttribute("material", "shader: flat; transparent: true; alphaTest: 0.02");
  characterPlane.setAttribute("animation", "property: position; from: 0 0.02 0.02; to: 0 0.1 0.02; dur: 800; easing: easeInOutSine; loop: true; dir: alternate");
  const speechPlane = document.createElement("a-plane");
  speechPlane.setAttribute("src", "#speech-canvas");
  speechPlane.setAttribute("position", "0 0.82 0.04");
  speechPlane.setAttribute("width", "1.42");
  speechPlane.setAttribute("height", ".533");
  speechPlane.setAttribute("material", "shader: flat; transparent: true; alphaTest: 0.02");
  target.append(characterPlane, speechPlane);
  scene.append(assets, camera, target);
  ui.arContainer.append(scene);

  target.addEventListener("targetFound", onTargetFound);
  target.addEventListener("targetLost", onTargetLost);
  return new Promise((resolve) => scene.addEventListener("loaded", resolve, { once: true }));
}

function updateProgress() {
  const pointIds = config.points.map(({ id }) => id);
  const count = countValidStamps(progress, pointIds);
  ui.progress.textContent = `スタンプ ${count} / ${config.completion.requiredStampCount}`;
  const collected = Boolean(progress.stamps[point.id]);
  ui.stamp.textContent = collected ? "スタンプ獲得済み ✓" : "スタンプを貯める";
  ui.stamp.disabled = collected;
}

function setEventTitle(title) {
  const separator = title.indexOf(" AR");
  const lines = separator > 0 ? [title.slice(0, separator), title.slice(separator + 1)] : [title];
  ui.title.replaceChildren(...lines.map((line) => {
    const span = document.createElement("span");
    span.className = "title-line";
    span.textContent = line;
    return span;
  }));
}

function onTargetFound() {
  targetVisible = true;
  ui.guide.hidden = true;
  ui.discovery.textContent = point.foundMessage;
  ui.stampCard.hidden = false;
}

function onTargetLost() {
  targetVisible = false;
  ui.stampCard.hidden = true;
  ui.guideMessage.textContent = "見失いました。もう一度マークを映してね";
  ui.guide.hidden = false;
}

async function startAr() {
  ui.error.hidden = true;
  ui.welcome.hidden = true;
  ui.arView.hidden = false;
  ui.guide.hidden = false;
  ui.guideMessage.textContent = "会場のマークを枠の中に入れてね";
  try {
    arSystem ||= scene.systems["mindar-image-system"];
    await arSystem.start();
  } catch (error) {
    console.error(error);
    ui.arView.hidden = true;
    ui.errorMessage.textContent = "カメラの利用を許可し、HTTPSのURLで開いていることを確認してください。";
    ui.error.hidden = false;
  }
}

function stopAr() {
  if (arSystem) arSystem.stop();
  targetVisible = false;
  ui.arView.hidden = true;
  ui.success.hidden = true;
  ui.stampCard.hidden = true;
  ui.welcome.hidden = false;
}

function collectStamp() {
  if (!targetVisible || progress.stamps[point.id]) return;
  progress = store.save(addStamp(progress, point.id));
  updateProgress();
  const count = countValidStamps(progress, config.points.map(({ id }) => id));
  const completed = count >= config.completion.requiredStampCount;
  ui.successTitle.textContent = completed ? "コンプリート！" : "やったね！";
  ui.successMessage.textContent = completed ? config.completion.message : point.stampMessage;
  ui.success.hidden = false;
}

async function init() {
  try {
    config = await loadConfig();
    point = config.points[0];
    store = createStampStore(config.event.id);
    progress = store.load();
    document.title = config.event.title;
    setEventTitle(config.event.title);
    ui.description.textContent = config.event.description;
    ui.eventNameSmall.textContent = config.event.name;
    ui.welcomeCharacter.src = point.characterImage;
    ui.welcomeCharacter.alt = point.characterAlt;
    await makeScene();
    updateProgress();
    ui.start.disabled = false;
    ui.start.textContent = "カメラを起動する";
  } catch (error) {
    console.error(error);
    ui.welcome.hidden = true;
    ui.errorMessage.textContent = error.message;
    ui.error.hidden = false;
  }
}

ui.start.addEventListener("click", startAr);
ui.retry.addEventListener("click", () => location.reload());
ui.close.addEventListener("click", stopAr);
ui.stamp.addEventListener("click", collectStamp);
ui.continueButton.addEventListener("click", () => { ui.success.hidden = true; });
init();
