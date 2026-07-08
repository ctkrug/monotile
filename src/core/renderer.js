import { worldToScreen } from "./camera.js";

const GRID_SPACING = 48; // world units between graph-paper lines

/**
 * Draws the faint blueprint grid, then the visible spectre tiles, all
 * panned/zoomed by the camera. `tiles` is the array returned by a
 * `TileField#update()` call — each tile's `points` are already in world
 * space, so only the camera's world-to-screen mapping is applied here.
 */
export function draw(ctx, camera, size, palette, tiles = []) {
  const { width, height } = size;

  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, width, height);
  drawGrid(ctx, camera, size, palette);
  drawTiles(ctx, camera, palette, tiles);
}

function drawTiles(ctx, camera, palette, tiles) {
  ctx.lineJoin = "round";
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = palette.tile;
  ctx.fillStyle = `${palette.tile}1a`; // ~10% opacity fill, keeps outlines primary

  for (const tile of tiles) {
    const screenPoints = tile.points.map((p) => worldToScreen(camera, p));
    ctx.beginPath();
    ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
    for (let i = 1; i < screenPoints.length; i++) {
      ctx.lineTo(screenPoints[i].x, screenPoints[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
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
