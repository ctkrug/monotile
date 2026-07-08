import { createCamera, panBy, screenToWorld, zoomAt } from "./core/camera.js";
import { DEFAULT_PALETTE, PALETTES } from "./core/palette.js";
import { draw } from "./core/renderer.js";
import { createTileField } from "./core/tileField.js";

const canvas = document.getElementById("tiling-canvas");
const ctx = canvas.getContext("2d");
const zoomReadout = document.getElementById("zoom-readout");

let camera = createCamera();
let palette = PALETTES[DEFAULT_PALETTE];
let size = { width: 0, height: 0 };
let dragging = false;
let lastPointer = { x: 0, y: 0 };
let scheme = "";

const tileField = createTileField();

// Fetch tiles for a region larger than the viewport so panning reveals
// tiles that are already generated, instead of popping in at the edge.
const CULL_MARGIN_RATIO = 0.5;

function visibleTiles() {
  const topLeft = screenToWorld(camera, { x: 0, y: 0 });
  const bottomRight = screenToWorld(camera, { x: size.width, y: size.height });
  const bounds = [
    Math.min(topLeft.x, bottomRight.x),
    Math.min(topLeft.y, bottomRight.y),
    Math.max(topLeft.x, bottomRight.x),
    Math.max(topLeft.y, bottomRight.y),
  ];
  const margin = (bounds[2] - bounds[0]) * CULL_MARGIN_RATIO;
  return tileField.update(bounds, margin).tiles;
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

function render() {
  draw(ctx, camera, size, palette, visibleTiles(), scheme);
  zoomReadout.textContent = `zoom ${camera.zoom.toFixed(2)}×`;
}

function pointerPos(event) {
  const rect = canvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

canvas.addEventListener("pointerdown", (event) => {
  dragging = true;
  lastPointer = pointerPos(event);
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", (event) => {
  if (!dragging) return;
  const pos = pointerPos(event);
  const delta = { x: pos.x - lastPointer.x, y: pos.y - lastPointer.y };
  camera = panBy(camera, delta);
  lastPointer = pos;
  render();
});

function endDrag() {
  dragging = false;
}

canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", endDrag);
canvas.addEventListener("pointerleave", endDrag);

canvas.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    const factor = Math.exp(-event.deltaY * 0.001);
    camera = zoomAt(camera, pointerPos(event), factor);
    render();
  },
  { passive: false },
);

const schemeButtons = [...document.querySelectorAll(".scheme-btn")];
schemeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    scheme = button.dataset.scheme;
    schemeButtons.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
    render();
  });
});

window.addEventListener("resize", resize);
resize();
