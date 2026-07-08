# Design — Monotile

## 1. Aesthetic direction

**Blueprint / technical.** Monotile is a drafting table for a piece of real mathematics: deep
indigo-navy canvas, chalk-cyan line work, a faint graph-paper grid underneath the tiling, and
monospace annotations (coordinates, generation number, tile type) that read like a surveyor's
notes. The tone is precise and quietly impressive — a tool for looking closely at a hard proof,
not a toy with cartoon chrome. This direction hasn't been used by recent sibling ships (which
lean warm/tactile or neo-brutalist), so it also keeps the portfolio visually varied.

One sentence: *Monotile is a drafting table for a 2023 proof — indigo-navy blueprint canvas,
chalk-cyan tile outlines, and monospace survey annotations that track your cursor.*

## 2. Tokens

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0b1220` | page background |
| `--surface-1` | `#101b30` | toolbar, panels |
| `--surface-2` | `#16223c` | raised cards, popovers |
| `--text` | `#e8f1ff` | primary text (chalk white) |
| `--text-muted` | `#8fa3c4` | secondary text, labels |
| `--accent` | `#5ec8ff` | blueprint cyan — tile lines, primary actions, focus ring |
| `--accent-support` | `#ffb454` | warm amber — export CTA, active/selected state |
| `--success` | `#6bcf8f` | copy/export confirmation |
| `--danger` | `#ff6b6b` | errors |

- **Display font:** [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) — wordmark
  and headings. Geometric, slightly technical, holds up large.
- **UI font:** [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) — toolbar
  labels, coordinate readout, tile inspector. Reinforces the survey/annotation feel and doubles
  as a system-mono fallback chain (`ui-monospace, "SFMono-Regular", Menlo, monospace`).
- **Spacing unit:** 8px scale — 4, 8, 12, 16, 24, 32, 48, 64.
- **Corner radius:** 4px. Sharp and technical, not soft — this isn't a warm/tactile direction.
- **Shadow / glow:** panels get a soft `0 8px 24px rgba(0,0,0,0.35)` drop shadow; interactive
  elements get a low-opacity cyan glow on focus/hover (`0 0 0 3px rgba(94,200,255,0.25)`)
  instead of a hard outline.
- **Motion:** UI transitions 160ms ease-out. Pan uses momentum easing that settles over ~200ms.
  Recolor and export actions get a 200–250ms cross-fade/flash — see §5.

## 3. Layout intent

The canvas **is** the hero — the tiling itself, not a chrome-heavy app shell around it.

- **1440×900 desktop:** a 56px toolbar pinned to the top (wordmark, generation counter, mute
  toggle). Below it, the canvas fills the full remaining viewport. A 280px control panel
  (palette picker, export button, tile inspector) docks to the right as an overlay with a
  translucent blueprint-panel background, collapsible to a slim icon rail — the canvas never
  shrinks to make room for it. Canvas share of viewport: ~100% width, minus the collapsible
  panel only when expanded (~80%+ typical).
- **390×844 phone:** a 48px compact toolbar on top; the canvas fills everything below it. The
  control panel becomes a bottom sheet, collapsed to a single drag-handle tab by default, so the
  canvas keeps ≥70% of the viewport until the user explicitly opens it.
- No dead margins: the canvas always sizes to its container via `devicePixelRatio`, recomputed
  on resize/orientation change.

## 4. Signature detail

A **live survey readout** — a small crosshair that follows the pointer/drag point across the
canvas, paired with a monospace label (`x: 128, y: -44 · gen 6 · hat`) that updates in real
time, styled like a drafting instrument's annotation. It's unique to Monotile, reinforces the
"you're inspecting real math" framing, and doubles as the tile inspector's entry point (click to
pin it).

## 5. Juice plan

Monotile is a toy, not a game, but every action still gets a felt response:

- **Pan:** dragging never teleports — the view follows the pointer 1:1 with momentum easing on
  release (settles over ~200ms, ease-out).
- **Recolor:** clicking a palette swatch cross-fades the whole tiling's fill colors over 250ms
  (staggered ~4ms per tile by distance from the click point, so the recolor visibly ripples
  outward) instead of snapping.
- **Export:** the export button gives a brief camera-flash overlay (120ms white flash at 8%
  opacity) plus a toast ("Exported monotile-export.svg") that auto-dismisses.
- **Tile inspector pin:** the pinned tile gets a brief pulse outline (2 repeats, 140ms each).

**Synth SFX (WebAudio, generated in code, no audio files):**
- Recolor: a soft two-note chime (sine, ~440Hz → 660Hz, 80ms each, low gain).
- Export: a short percussive "shutter" click (filtered noise burst, ~40ms).
- Tile pin: a single soft tick (sine blip, ~30ms).

All SFX are subtle (peak gain ≤ 0.15), rate-throttled, created lazily on first user gesture, and
skipped entirely in environments without `AudioContext`. A mute toggle lives in the toolbar and
persists via `localStorage`. `prefers-reduced-motion` disables the recolor ripple/flash timing
(cross-fades become instant) but keeps pan and export functional.
