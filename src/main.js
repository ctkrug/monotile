import { createCamera, panBy, zoomAt } from "./core/camera.js";
import { DEFAULT_PALETTE, PALETTES } from "./core/palette.js";
import { draw } from "./core/renderer.js";

const canvas = document.getElementById("tiling-canvas");
const ctx = canvas.getContext("2d");

let camera = createCamera();
let palette = PALETTES[DEFAULT_PALETTE];
let size = { width: 0, height: 0 };
let dragging = false;
let lastPointer = { x: 0, y: 0 };

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
  draw(ctx, camera, size, palette);
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

window.addEventListener("resize", resize);
resize();
