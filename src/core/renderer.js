import { worldToScreen } from "./camera.js";
import { colorForTile, withAlpha } from "./coloring.js";

const GRID_SPACING = 48; // world units between graph-paper lines
const HIGHLIGHT_COLOR = "#ffb454"; // --accent-support, docs/DESIGN.md

/**
 * Draws the faint blueprint grid, then the visible spectre tiles, all
 * panned/zoomed by the camera. `tiles` is the array returned by a
 * `TileField#update()` call — each tile's `points` are already in world
 * space, so only the camera's world-to-screen mapping is applied here.
 * `scheme` selects a coloring scheme (see coloring.js); falsy means the
 * flat, single-color line-art look from `docs/DESIGN.md`. `colorFor`, when
 * given, overrides per-tile color resolution entirely (used by main.js to
 * drive the recolor ripple animation frame-by-frame). `highlight`, when
 * given as `{ tile, intensity }`, draws an extra outline around a pinned
 * tile (see pulse.js) for the tile inspector.
 */
export function draw(
  ctx,
  camera,
  size,
  palette,
  tiles = [],
  scheme = null,
  colorFor = null,
  highlight = null,
) {
  const { width, height } = size;

  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, width, height);
  drawGrid(ctx, camera, size, palette);
  drawTiles(ctx, camera, palette, tiles, scheme, colorFor);
  if (highlight) drawHighlight(ctx, camera, highlight);
}

function tracePolygon(ctx, camera, points) {
  const screenPoints = points.map((p) => worldToScreen(camera, p));
  ctx.beginPath();
  ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
  for (let i = 1; i < screenPoints.length; i++) {
    ctx.lineTo(screenPoints[i].x, screenPoints[i].y);
  }
  ctx.closePath();
}

function drawTiles(ctx, camera, palette, tiles, scheme, colorFor) {
  ctx.lineJoin = "round";
  ctx.lineWidth = 1.5;

  for (const tile of tiles) {
    const color = colorFor ? colorFor(tile) : (colorForTile(tile, scheme) ?? palette.tile);
    ctx.strokeStyle = color;
    ctx.fillStyle = withAlpha(color, 0.12); // keeps outlines primary, fill just for legibility

    tracePolygon(ctx, camera, tile.points);
    ctx.fill();
    ctx.stroke();
  }
}

function drawHighlight(ctx, camera, { tile, intensity }) {
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineWidth = 2 + intensity * 2;
  ctx.strokeStyle = withAlpha(HIGHLIGHT_COLOR, Math.min(1, intensity));
  tracePolygon(ctx, camera, tile.points);
  ctx.stroke();
  ctx.restore();
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
