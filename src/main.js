import { isMuted, playExportShutter, playRecolorChime, setMuted } from "./core/audio.js";
import { createCamera, panBy, screenToWorld, zoomAt } from "./core/camera.js";
import { orientationDegrees } from "./core/coloring.js";
import { boundsIntersect, boundsOf } from "./core/geometry.js";
import { hasSeenHint, markHintSeen } from "./core/hint.js";
import { findTileAt } from "./core/inspector.js";
import { isResetKey, panStepForKey, zoomFactorForKey } from "./core/keyboardNav.js";
import { DEFAULT_PALETTE, PALETTES } from "./core/palette.js";
import { isPulseComplete, pulseIntensity } from "./core/pulse.js";
import { nextRailExpanded, railToggleGlyph, railToggleLabel } from "./core/railToggle.js";
import { draw } from "./core/renderer.js";
import { createRipple, isRippleComplete, rippleColor } from "./core/ripple.js";
import { buildSvg } from "./core/svgExport.js";
import { createTileField } from "./core/tileField.js";
import { pinchState } from "./core/touch.js";
import { decodeViewHash, encodeViewHash } from "./core/viewLink.js";

const canvas = document.getElementById("tiling-canvas");
const ctx = canvas.getContext("2d");
const zoomReadout = document.getElementById("zoom-readout");
const exportBtn = document.getElementById("export-btn");
const shareBtn = document.getElementById("share-btn");
const flashEl = document.getElementById("export-flash");
const toastEl = document.getElementById("toast");
const muteToggle = document.getElementById("mute-toggle");
const schemePanel = document.getElementById("scheme-panel");
const sheetHandle = document.getElementById("sheet-handle");
const railToggle = document.getElementById("rail-toggle");
const panHintEl = document.getElementById("pan-hint");
const crosshairEl = document.getElementById("crosshair");
const surveyReadout = document.getElementById("survey-readout");
const inspectorPanel = document.getElementById("inspector-panel");
const inspectorClose = document.getElementById("inspector-close");
const inspectorType = document.getElementById("inspector-type");
const inspectorGeneration = document.getElementById("inspector-generation");
const inspectorOrientation = document.getElementById("inspector-orientation");
const inspectorLineage = document.getElementById("inspector-lineage");
let toastTimer = null;

function syncMuteToggle() {
  const muted = isMuted();
  muteToggle.textContent = `Sound: ${muted ? "Off" : "On"}`;
  muteToggle.setAttribute("aria-pressed", String(muted));
}

muteToggle.addEventListener("click", () => {
  setMuted(!isMuted());
  syncMuteToggle();
});

syncMuteToggle();

if (hasSeenHint()) {
  panHintEl.classList.add("pan-hint-dismissed");
}

// Dismissed the first time the visitor pans, zooms, or uses a keyboard
// shortcut, then never shown again (persisted via hint.js). A no-op once
// already dismissed, so every gesture handler can call it unconditionally.
function dismissPanHint() {
  panHintEl.classList.add("pan-hint-dismissed");
  markHintSeen();
}

// Mobile-only bottom sheet: inert at desktop widths where CSS never applies
// the collapsed transform, so this toggle is harmless to leave wired up.
sheetHandle.addEventListener("click", () => {
  const open = schemePanel.classList.toggle("sheet-open");
  sheetHandle.setAttribute("aria-expanded", String(open));
});

// Desktop-only rail collapse: inert below 481px, where CSS keeps rail-toggle
// hidden so the mobile sheet-handle is the only visible collapse control.
let railExpanded = true;

railToggle.addEventListener("click", () => {
  railExpanded = nextRailExpanded(railExpanded);
  railToggle.setAttribute("aria-expanded", String(railExpanded));
  railToggle.setAttribute("aria-label", railToggleLabel(railExpanded));
  railToggle.querySelector("span").textContent = railToggleGlyph(railExpanded);
  schemePanel.classList.toggle("rail-collapsed", !railExpanded);
});

let camera = createCamera();
let palette = PALETTES[DEFAULT_PALETTE];
let size = { width: 0, height: 0 };
let dragging = false;
let lastPointer = { x: 0, y: 0 };
let scheme = "";
let activeRipple = null;
let rippleStartTime = 0;
let pinnedTile = null;
let pulseStartTime = 0;
let pointerDownPos = null;

// Tracks every finger/pointer currently down so a second touch can promote a
// single-finger pan into a two-finger pinch-zoom mid-gesture.
const activePointers = new Map();
let gestureMode = "none"; // "pan" | "pinch"
let pinchAnchor = null;

const tileField = createTileField();

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

// Fetch tiles for a region larger than the viewport so panning reveals
// tiles that are already generated, instead of popping in at the edge.
const CULL_MARGIN_RATIO = 0.5;

function viewportBounds() {
  const topLeft = screenToWorld(camera, { x: 0, y: 0 });
  const bottomRight = screenToWorld(camera, { x: size.width, y: size.height });
  return [
    Math.min(topLeft.x, bottomRight.x),
    Math.min(topLeft.y, bottomRight.y),
    Math.max(topLeft.x, bottomRight.x),
    Math.max(topLeft.y, bottomRight.y),
  ];
}

function visibleTiles() {
  const bounds = viewportBounds();
  const margin = (bounds[2] - bounds[0]) * CULL_MARGIN_RATIO;
  return tileField.update(bounds, margin).tiles;
}

function triggerDownload(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("toast-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("toast-visible"), 2200);
}

function showExportFeedback(filename) {
  if (!prefersReducedMotion()) {
    flashEl.classList.remove("flash-active");
    void flashEl.offsetWidth; // restart the keyframe animation
    flashEl.classList.add("flash-active");
  }
  showToast(`Exported ${filename}`);
}

function resize() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  size = { width: rect.width, height: rect.height };
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  render();
}

function render(rippleElapsedMs) {
  const tiles = visibleTiles();
  const colorFor =
    activeRipple != null ? (tile) => rippleColor(activeRipple, tile, rippleElapsedMs) : null;
  const highlight = pinnedTile
    ? { tile: pinnedTile, intensity: pulseIntensity(performance.now() - pulseStartTime) }
    : null;
  draw(ctx, camera, size, palette, tiles, scheme, colorFor, highlight);
  zoomReadout.textContent = `zoom ${camera.zoom.toFixed(2)}×`;
}

function tickRipple(now) {
  if (!activeRipple) return;
  const elapsed = now - rippleStartTime;
  render(elapsed);
  if (isRippleComplete(elapsed)) {
    activeRipple = null;
    return;
  }
  requestAnimationFrame(tickRipple);
}

function tickPulse(now) {
  if (!pinnedTile) return;
  render();
  if (!isPulseComplete(now - pulseStartTime)) {
    requestAnimationFrame(tickPulse);
  }
}

function updateSurveyReadout(pos) {
  const worldPoint = screenToWorld(camera, pos);
  const tile = findTileAt(visibleTiles(), worldPoint);
  crosshairEl.style.left = `${pos.x}px`;
  crosshairEl.style.top = `${pos.y}px`;
  crosshairEl.classList.add("visible");
  surveyReadout.style.left = `${pos.x}px`;
  surveyReadout.style.top = `${pos.y}px`;
  surveyReadout.textContent =
    `x: ${Math.round(worldPoint.x)}, y: ${Math.round(worldPoint.y)} · ` +
    `gen ${tile ? tile.depth : "–"} · ${tile ? tile.label : "—"}`;
  surveyReadout.classList.add("visible");
}

function hideSurveyReadout() {
  crosshairEl.classList.remove("visible");
  surveyReadout.classList.remove("visible");
}

function showInspector(tile) {
  inspectorType.textContent = tile.label;
  inspectorGeneration.textContent = String(tile.depth);
  inspectorOrientation.textContent = `${Math.round(orientationDegrees(tile.transform))}°`;
  inspectorLineage.textContent = tile.id || "(root)";
  inspectorPanel.hidden = false;
}

function pinTileAt(pos) {
  const worldPoint = screenToWorld(camera, pos);
  const tile = findTileAt(visibleTiles(), worldPoint);
  if (!tile) {
    pinnedTile = null;
    inspectorPanel.hidden = true;
    render();
    return;
  }
  pinnedTile = tile;
  showInspector(tile);
  pulseStartTime = performance.now();
  requestAnimationFrame(tickPulse);
}

inspectorClose.addEventListener("click", () => {
  pinnedTile = null;
  inspectorPanel.hidden = true;
  render();
});

function pointerPos(event) {
  const rect = canvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

// Below this distance (in screen px), a pointerdown/pointerup pair counts as
// a click-to-pin rather than a pan drag.
const CLICK_DRAG_THRESHOLD = 4;

canvas.addEventListener("pointerdown", (event) => {
  dismissPanHint();
  const pos = pointerPos(event);
  activePointers.set(event.pointerId, pos);

  if (activePointers.size === 2) {
    gestureMode = "pinch";
    dragging = false;
    pointerDownPos = null;
    const [a, b] = [...activePointers.values()];
    pinchAnchor = pinchState(a, b);
  } else if (activePointers.size === 1) {
    gestureMode = "pan";
    dragging = true;
    lastPointer = pos;
    pointerDownPos = pos;
  }

  // Capture last: a bookkeeping update above should never be skipped by an
  // exception this call can throw for a pointer id the browser doesn't
  // recognize as active.
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", (event) => {
  const pos = pointerPos(event);
  if (activePointers.has(event.pointerId)) activePointers.set(event.pointerId, pos);

  if (gestureMode === "pinch" && activePointers.size === 2) {
    const [a, b] = [...activePointers.values()];
    const next = pinchState(a, b);
    if (pinchAnchor.distance > 0) {
      camera = zoomAt(camera, next.midpoint, next.distance / pinchAnchor.distance);
      render();
    }
    pinchAnchor = next;
    return;
  }

  if (dragging) {
    const delta = { x: pos.x - lastPointer.x, y: pos.y - lastPointer.y };
    camera = panBy(camera, delta);
    lastPointer = pos;
    render();
  }
  updateSurveyReadout(pos);
});

function endDrag() {
  dragging = false;
  pointerDownPos = null;
}

// Ends the whole gesture (pan or pinch) for one lifted/cancelled pointer. A
// pinch that loses a finger resets fully rather than trying to resume as a
// pan from the remaining finger's current position, which would otherwise
// jump the camera by the distance that finger moved during the pinch.
function endGesture(pointerId) {
  activePointers.delete(pointerId);
  if (gestureMode === "pinch") {
    gestureMode = "none";
    pinchAnchor = null;
    endDrag();
    return;
  }
  gestureMode = "none";
  endDrag();
}

canvas.addEventListener("pointerup", (event) => {
  if (gestureMode === "pan" && pointerDownPos) {
    const pos = pointerPos(event);
    const moved = Math.hypot(pos.x - pointerDownPos.x, pos.y - pointerDownPos.y);
    if (moved < CLICK_DRAG_THRESHOLD) pinTileAt(pos);
  }
  endGesture(event.pointerId);
});
canvas.addEventListener("pointercancel", (event) => endGesture(event.pointerId));
canvas.addEventListener("pointerleave", () => {
  activePointers.clear();
  gestureMode = "none";
  pinchAnchor = null;
  endDrag();
  hideSurveyReadout();
});

canvas.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    dismissPanHint();
    const factor = Math.exp(-event.deltaY * 0.001);
    camera = zoomAt(camera, pointerPos(event), factor);
    render();
  },
  { passive: false },
);

canvas.addEventListener("keydown", (event) => {
  if (isResetKey(event.key)) {
    event.preventDefault();
    dismissPanHint();
    camera = createCamera();
    render();
    return;
  }

  const panStep = panStepForKey(event.key, { shiftKey: event.shiftKey });
  if (panStep) {
    event.preventDefault();
    dismissPanHint();
    camera = panBy(camera, panStep);
    render();
    return;
  }

  const zoomFactor = zoomFactorForKey(event.key);
  if (zoomFactor) {
    event.preventDefault();
    dismissPanHint();
    camera = zoomAt(camera, { x: size.width / 2, y: size.height / 2 }, zoomFactor);
    render();
  }
});

// [data-scheme] excludes export-btn: it shares the .scheme-btn class for
// styling only, and must not trigger a scheme switch on click.
const schemeButtons = [...document.querySelectorAll(".scheme-btn[data-scheme]")];
schemeButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    const nextScheme = button.dataset.scheme;
    if (nextScheme === scheme) return;
    schemeButtons.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
    playRecolorChime();

    if (prefersReducedMotion()) {
      scheme = nextScheme;
      activeRipple = null;
      render();
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const clickPoint = screenToWorld(camera, {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
    activeRipple = createRipple({
      tiles: visibleTiles(),
      fromScheme: scheme,
      toScheme: nextScheme,
      clickPoint,
      fallbackColor: palette.tile,
    });
    scheme = nextScheme;
    rippleStartTime = performance.now();
    requestAnimationFrame(tickRipple);
  });
});

// A valid #x=..&y=..&z=..[&scheme=..] hash (from a previously copied share
// link) restores that exact view; anything empty/malformed/unrecognized
// falls back to the default view decodeViewHash already returns null for.
const restoredView = decodeViewHash(window.location.hash);
if (restoredView) {
  camera = restoredView.camera;
  scheme = restoredView.scheme;
  schemeButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.scheme === scheme)));
}

shareBtn.addEventListener("click", async () => {
  window.location.hash = encodeViewHash(camera, scheme);
  try {
    await navigator.clipboard.writeText(window.location.href);
    showToast("Link copied");
  } catch {
    showToast("Link updated — copy it from the address bar");
  }
});

exportBtn.addEventListener("click", () => {
  const bounds = viewportBounds();
  const tiles = visibleTiles().filter((tile) => boundsIntersect(boundsOf(tile.points), bounds));
  const svg = buildSvg(tiles, palette, scheme, bounds);
  const filename = "monotile-export.svg";
  triggerDownload(filename, svg, "image/svg+xml");
  showExportFeedback(filename);
  playExportShutter();
});

window.addEventListener("resize", resize);
resize();
