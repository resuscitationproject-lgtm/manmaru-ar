// Resize only the drawing surface. MindAR owns the calibrated camera projection.
export function syncRendererSize(scene, container) {
  const width = container.clientWidth;
  const height = container.clientHeight;
  if (!(width > 0 && height > 0) || !scene?.renderer || !scene.canvas) return false;
  const size = scene.renderer.getSize({ set(x, y) { this.x = x; this.y = y; return this; } });
  if (size.x !== width || size.y !== height || !scene.canvas.width || !scene.canvas.height) {
    scene.renderer.setSize(width, height, false);
  }
  return scene.canvas.width > 0 && scene.canvas.height > 0;
}

export function hasTrackedPose(entry) {
  const root = entry?.target?.object3D;
  const matrix = root?.matrix?.elements;
  return Boolean(entry?.targetVisible && root?.visible && matrix?.length === 16 &&
    matrix.every(Number.isFinite) && matrix[15] !== 0);
}

export function canDisplayModel(entry, scene) {
  return Boolean(entry?.modelReady && !entry.modelError && hasTrackedPose(entry) &&
    scene?.canvas?.width > 0 && scene.canvas.height > 0 &&
    !scene.renderer?.getContext().isContextLost());
}

// Never write the target parent: MindAR uses its visible state to emit tracking events.
export function syncModelVisibility(entry) {
  const visible = Boolean(entry.targetVisible && entry.modelReady && !entry.modelError);
  for (const child of [entry.shadow, entry.popRig, entry.model]) {
    child.setAttribute("visible", visible);
  }
  return visible;
}
