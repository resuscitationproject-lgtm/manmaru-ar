import { addStamp, countValidStamps, createStampStore } from "./stamp-store.js";

const $ = (selector) => document.querySelector(selector);
const ui = {
  welcome: $("#welcome"), welcomeCharacter: $("#welcome-character"), title: $("#event-title"),
  description: $("#event-description"), start: $("#start-button"), reset: $("#reset-button"),
  resetStatus: $("#reset-status"), arView: $("#ar-view"),
  arContainer: $("#ar-container"), eventNameSmall: $("#event-name-small"), progress: $("#progress-label"),
  close: $("#close-button"), guide: $("#guide"), guideMessage: $("#guide-message"),
  stampCard: $("#stamp-card"), discovery: $("#discovery-message"), stamp: $("#stamp-button"),
  success: $("#success-card"), successTitle: $("#success-title"), successMessage: $("#success-message"),
  continueButton: $("#continue-button"), error: $("#error-card"), errorMessage: $("#error-message"),
  retry: $("#retry-button")
};

let config;
let scene;
let arSystem;
let store;
let progress;
let activePoint = null;
let activeTarget = null;
let targetVisible = false;
let successTimer = null;
const targetEntries = new Map();

async function loadConfig() {
  const response = await fetch("./event-config.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`設定ファイルを読み込めませんでした (${response.status})`);
  const value = await response.json();
  if (!value.event?.id || !value.ar?.targetFile || !Array.isArray(value.points) || value.points.length === 0) {
    throw new Error("event-config.json の必須項目が不足しています");
  }
  return value;
}

function assetId(prefix, point) {
  return `${prefix}-${point.id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

function modelScale(point) {
  const scale = Number(point.modelScale) || 0.35;
  return `${scale} ${scale} ${scale}`;
}

function createTarget(point, assets) {
  const modelAsset = document.createElement("a-asset-item");
  modelAsset.id = assetId("model", point);
  modelAsset.setAttribute("src", point.modelFile);
  assets.append(modelAsset);

  const target = document.createElement("a-entity");
  target.setAttribute("mindar-image-target", `targetIndex: ${point.targetIndex}`);

  const shadow = document.createElement("a-circle");
  shadow.setAttribute("position", "0 -0.38 0.03");
  shadow.setAttribute("rotation", "-90 0 0");
  shadow.setAttribute("radius", "0.34");
  shadow.setAttribute("material", "color: #111; opacity: 0.22; transparent: true; shader: flat");
  shadow.setAttribute("visible", "false");

  const popRig = document.createElement("a-entity");
  popRig.setAttribute("position", point.modelPosition || "0 -0.05 0.15");
  popRig.setAttribute("scale", "0.001 0.001 0.001");
  popRig.setAttribute("visible", "false");
  popRig.setAttribute("animation__pop", `property: scale; from: 0.001 0.001 0.001; to: ${modelScale(point)}; dur: 900; easing: easeOutElastic; startEvents: model-pop`);
  popRig.setAttribute("animation__rise", `property: position; from: 0 -0.42 0.06; to: ${point.modelPosition || "0 -0.05 0.15"}; dur: 700; easing: easeOutCubic; startEvents: model-pop`);

  const model = document.createElement("a-gltf-model");
  model.setAttribute("src", `#${modelAsset.id}`);
  model.setAttribute("rotation", point.modelRotation || "0 0 0");
  model.setAttribute("animation__turn", "property: rotation; from: 0 -12 0; to: 0 12 0; dur: 1800; easing: easeInOutSine; loop: true; dir: alternate");
  popRig.append(model);
  target.append(shadow, popRig);

  const entry = {
    point, target, popRig, shadow, model,
    modelReady: false,
    modelError: false,
    targetVisible: false
  };
  model.addEventListener("model-loaded", () => {
    entry.modelReady = true;
    entry.modelError = false;
    if (entry.targetVisible && progress?.stamps[point.id]) revealModel(entry, false);
    if (activeTarget === entry) updateProgress();
  });
  model.addEventListener("model-error", () => {
    entry.modelError = true;
    if (activeTarget === entry) {
      ui.discovery.textContent = "3Dモデルを読み込めませんでした。ページを再読み込みしてください。";
      updateProgress();
    }
  });
  targetEntries.set(point.id, entry);
  target.addEventListener("targetFound", () => onTargetFound(entry));
  target.addEventListener("targetLost", () => onTargetLost(entry));
  return target;
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
    "autoStart: false", "uiLoading: no", "uiScanning: no", "uiError: no",
    `filterMinCF: ${config.ar.filterMinCF ?? 0.001}`,
    `filterBeta: ${config.ar.filterBeta ?? 1000}`,
    `warmupTolerance: ${config.ar.warmupTolerance ?? 5}`,
    `missTolerance: ${config.ar.missTolerance ?? 5}`
  ].join("; "));

  const assets = document.createElement("a-assets");
  assets.setAttribute("timeout", "30000");
  const ambientLight = document.createElement("a-entity");
  ambientLight.setAttribute("light", "type: ambient; color: #ffffff; intensity: 1.25");
  const directionalLight = document.createElement("a-entity");
  directionalLight.setAttribute("light", "type: directional; color: #ffffff; intensity: 1.8");
  directionalLight.setAttribute("position", "-1 2 3");
  const camera = document.createElement("a-camera");
  camera.setAttribute("position", "0 0 0");
  camera.setAttribute("look-controls", "enabled: false");

  const targets = config.points.map((point) => createTarget(point, assets));
  scene.append(assets, ambientLight, directionalLight, camera, ...targets);
  ui.arContainer.append(scene);
  return new Promise((resolve) => scene.addEventListener("loaded", resolve, { once: true }));
}

function revealModel(entry, animate = true) {
  entry.shadow.setAttribute("visible", "true");
  entry.popRig.setAttribute("visible", "true");
  if (entry.shadow.object3D) entry.shadow.object3D.visible = true;
  if (entry.popRig.object3D) entry.popRig.object3D.visible = true;
  if (animate) {
    entry.popRig.setAttribute("scale", "0.001 0.001 0.001");
    requestAnimationFrame(() => entry.popRig.emit("model-pop"));
  } else {
    entry.popRig.setAttribute("scale", modelScale(entry.point));
    const scale = Number(entry.point.modelScale) || 0.35;
    if (entry.popRig.object3D) entry.popRig.object3D.scale.set(scale, scale, scale);
  }
}

function hideUncollectedModel(entry) {
  if (progress.stamps[entry.point.id]) return;
  entry.shadow.setAttribute("visible", "false");
  entry.popRig.setAttribute("visible", "false");
}

function updateProgress() {
  const pointIds = config.points.map(({ id }) => id);
  const count = countValidStamps(progress, pointIds);
  ui.progress.textContent = `スタンプ ${count} / ${config.completion.requiredStampCount}`;
  if (!activePoint) return;
  const collected = Boolean(progress.stamps[activePoint.id]);
  const loading = activeTarget && !activeTarget.modelReady && !activeTarget.modelError;
  const failed = Boolean(activeTarget?.modelError);
  ui.stamp.textContent = failed ? "3D読み込み失敗" : loading ? "3Dを準備中…" : collected ? "スタンプ獲得済み ✓" : "スタンプを貯める";
  ui.stamp.disabled = failed || loading || collected;
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

function onTargetFound(entry) {
  entry.targetVisible = true;
  activePoint = entry.point;
  activeTarget = entry;
  targetVisible = true;
  ui.guide.hidden = true;
  ui.discovery.textContent = entry.point.foundMessage;
  ui.stampCard.hidden = false;
  updateProgress();
  if (progress.stamps[entry.point.id] && entry.modelReady) revealModel(entry, false);
  else hideUncollectedModel(entry);
}

function onTargetLost(entry) {
  entry.targetVisible = false;
  if (activeTarget !== entry) return;
  targetVisible = false;
  ui.stampCard.hidden = true;
  ui.guideMessage.textContent = "見失いました。もう一度、子どもたちの絵を映してね";
  ui.guide.hidden = false;
}

async function startAr() {
  ui.error.hidden = true;
  ui.welcome.hidden = true;
  ui.arView.hidden = false;
  ui.guide.hidden = false;
  ui.guideMessage.textContent = "子どもたちの絵を枠の中に入れてね";
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
  clearTimeout(successTimer);
  targetVisible = false;
  activePoint = null;
  activeTarget = null;
  ui.arView.hidden = true;
  ui.success.hidden = true;
  ui.stampCard.hidden = true;
  ui.welcome.hidden = false;
}

function collectStamp() {
  if (!targetVisible || !activePoint || !activeTarget || !activeTarget.modelReady || progress.stamps[activePoint.id]) return;
  const collectedPoint = activePoint;
  const collectedTarget = activeTarget;
  progress = store.save(addStamp(progress, collectedPoint.id));
  revealModel(collectedTarget, true);
  updateProgress();
  ui.discovery.textContent = `${collectedPoint.name}が3Dになって飛び出した！`;

  const count = countValidStamps(progress, config.points.map(({ id }) => id));
  const completed = count >= config.completion.requiredStampCount;
  clearTimeout(successTimer);
  successTimer = setTimeout(() => {
    ui.successTitle.textContent = completed ? "コンプリート！" : "3Dキャラ誕生！";
    ui.successMessage.textContent = completed ? config.completion.message : collectedPoint.stampMessage;
    ui.success.hidden = false;
  }, 1700);
}

function resetStamps() {
  const pointIds = config.points.map(({ id }) => id);
  if (countValidStamps(progress, pointIds) === 0) {
    ui.resetStatus.textContent = "保存されているスタンプはありません。";
    return;
  }
  if (!window.confirm("この端末に保存されているスタンプをリセットしますか？")) return;
  store.clear();
  progress = store.load();
  targetEntries.forEach(hideUncollectedModel);
  updateProgress();
  ui.success.hidden = true;
  ui.resetStatus.textContent = "スタンプをリセットしました。";
}

async function init() {
  try {
    config = await loadConfig();
    store = createStampStore(config.event.id);
    progress = store.load();
    document.title = config.event.title;
    setEventTitle(config.event.title);
    ui.description.textContent = config.event.description;
    ui.eventNameSmall.textContent = config.event.name;
    ui.welcomeCharacter.src = config.event.heroImage;
    ui.welcomeCharacter.alt = config.event.heroAlt || config.event.title;
    await makeScene();
    updateProgress();
    ui.start.disabled = false;
    ui.reset.disabled = false;
    ui.start.textContent = "カメラを起動する";
  } catch (error) {
    console.error(error);
    ui.welcome.hidden = true;
    ui.errorMessage.textContent = error.message;
    ui.error.hidden = false;
  }
}

ui.start.addEventListener("click", startAr);
ui.reset.addEventListener("click", resetStamps);
ui.retry.addEventListener("click", () => location.reload());
ui.close.addEventListener("click", stopAr);
ui.stamp.addEventListener("click", collectStamp);
ui.continueButton.addEventListener("click", () => { ui.success.hidden = true; });
init();
