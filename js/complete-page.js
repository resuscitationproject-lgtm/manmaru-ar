import { createStampStore, countValidStamps } from "./stamp-store.js";
import { isComplete } from "./completion.js?v=20261116-1";

const $ = (selector) => document.querySelector(selector);
let config;
let store;

function showCompletion() {
  const progress = store.load();
  if (!isComplete(progress, config)) {
    $("#completion-card").hidden = true;
    window.location.replace(new URL("./", window.location.href).href);
    return;
  }
  document.title = `${config.event.name} コンプリート！`;
  $("#completion-event").textContent = config.event.name;
  $("#completion-count").textContent = `${countValidStamps(progress, config.points.map(p => p.id))} / ${config.completion.requiredStampCount}`;
  $("#completion-message").textContent = config.completion.message;
  $("#completion-stamps").replaceChildren(...config.points.filter(p => progress.stamps[p.id]).map(point => {
    const item = document.createElement("li");
    item.textContent = `✓ ${point.name}`;
    return item;
  }));
  $("#completion-loading").hidden = true;
  $("#completion-card").hidden = false;
}

async function init() {
  try {
    const response = await fetch("./event-config.json", { cache: "no-store" });
    if (!response.ok) throw new Error("イベント設定を読み込めませんでした");
    config = await response.json();
    store = createStampStore(config.event.id);
    showCompletion();
  } catch (error) {
    console.error(error);
    $("#completion-loading").hidden = true;
    $("#completion-error").hidden = false;
  }
}

$("#completion-reset").addEventListener("click", () => {
  if (!window.confirm("この端末に保存されているスタンプをリセットしますか？")) return;
  store.clear();
  showCompletion();
});
$("#completion-retry").addEventListener("click", () => window.location.reload());
window.addEventListener("pageshow", () => { if (store) showCompletion(); });
window.addEventListener("storage", () => { if (store) showCompletion(); });
init();
