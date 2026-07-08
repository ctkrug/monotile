import { worldToScreen } from "./camera.js";

const GRID_SPACING = 48; // world units between graph-paper lines

/**
 * Placeholder render pass: draws the blueprint grid panned/zoomed by the
 * camera. Proves the render pipeline end to end; the real hat/spectre
 * substitution tiling replaces the grid in BUILD (see docs/BACKLOG.md).
 */
export function draw(ctx, camera, size, palette) {
  const { width, height } = size;

  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, width, height);
  drawGrid(ctx, camera, size, palette);
}

function drawGrid(ctx, camera, size, palette) {
  const { width, height } = size;
  const spacing = GRID_SPACING * camera.zoom;
  if (spacing < 4) return;

  const originScreen = worldToScreen(camera, { x: 0, y: 0 });
  const offsetX = ((originScreen.x % spacing) + spacing) % spacing;
  const offsetY = ((originScreen.y % spacing) + spacing) % spacing;

  ctx.strokeStyle = palette.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = offsetX; x <= width; x += spacing) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let y = offsetY; y <= height; y += spacing) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();
}
