import * as THREE from "three";

/**
 * MacBook Pro–style keyboard: black keys in a black well, full-height
 * function row with Touch ID, and inverted-T arrow keys.
 * Layout is in key units (each row is 14.5u wide).
 */
export function createKeyboardTexture() {
  const c = document.createElement("canvas");
  c.width = 1048;
  c.height = 400;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#1e1e21";
  ctx.fillRect(0, 0, c.width, c.height);

  const pad = 12;
  const gap = 7;
  const unit = (c.width - pad * 2 + gap) / 14.5; // includes one gap per key
  const rowH = (c.height - pad * 2 - gap * 5) / 5.6;
  const rows: { h: number; keys: (number | "arrows")[] }[] = [
    { h: 0.6, keys: [1.5, ...Array(12).fill(1), 1] },
    { h: 1, keys: [...Array(13).fill(1), 1.5] },
    { h: 1, keys: [1.5, ...Array(12).fill(1), 1] },
    { h: 1, keys: [1.75, ...Array(11).fill(1), 1.75] },
    { h: 1, keys: [2.25, ...Array(10).fill(1), 2.25] },
    { h: 1, keys: [1, 1, 1, 1.25, 5, 1.25, 1, "arrows"] },
  ];

  let y = pad;
  rows.forEach((row, r) => {
    const h = rowH * row.h;
    let x = pad;
    row.keys.forEach((k, i) => {
      if (k === "arrows") {
        // ← (half height) · ↑ over ↓ · → (half height), bottom-aligned.
        const w = unit - gap;
        const half = (h - gap) / 2;
        drawKey(ctx, x, y + half + gap, w, half);
        drawKey(ctx, x + unit, y, w, half);
        drawKey(ctx, x + unit, y + half + gap, w, half);
        drawKey(ctx, x + unit * 2, y + half + gap, w, half);
        return;
      }
      const w = unit * k - gap;
      const touchId = r === 0 && i === row.keys.length - 1;
      drawKey(ctx, x, y, w, h, touchId);
      x += unit * k;
    });
    y += h + gap;
  });

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function drawKey(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, touchId = false) {
  const r = Math.min(7, h / 4);
  ctx.fillStyle = "#060607";
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  // Top-edge highlight so keys read as raised caps against the well.
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, "rgba(255,255,255,0.16)");
  g.addColorStop(0.25, "rgba(255,255,255,0.02)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fill();
  if (touchId) {
    ctx.strokeStyle = "rgba(200,204,210,0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x + 3, y + 3, w - 6, h - 6, r - 2);
    ctx.stroke();
  }
}

/** Perforated speaker grille: dark holes on a transparent background. */
export function createSpeakerTexture() {
  const c = document.createElement("canvas");
  c.width = 96;
  c.height = 400;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "rgba(10,10,12,0.9)";
  const step = 8;
  for (let y = step / 2; y < c.height; y += step) {
    const offset = (Math.round(y / step) % 2) * (step / 2);
    for (let x = step / 2 + offset; x < c.width; x += step) {
      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Soft elliptical shadow, blurred once on a canvas. */
export function createShadowTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 160;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(128, 80, 10, 128, 80, 120);
  g.addColorStop(0, "rgba(0,0,0,0.7)");
  g.addColorStop(0.55, "rgba(0,0,0,0.35)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.setTransform(1, 0, 0, 0.66, 0, 27);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 240);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Boot screen, drawn for a given boot progress (0..1), the same on every device:
 * 0–0.08 off · 0.08–0.8 loading bar · 0.8–1 the bar fades out, leaving a plain
 * graphite screen (no glow), so the camera dives into darkness and the hero
 * plays its own entrance.
 */
export function drawScreen(ctx: CanvasRenderingContext2D, boot: number) {
  const { width: W, height: H } = ctx.canvas;
  const u = Math.min(W, H) / 640; // scale relative to a 640px short side
  ctx.clearRect(0, 0, W, H);
  if (boot < 0.08) {
    ctx.fillStyle = "#020203";
    ctx.fillRect(0, 0, W, H);
    return;
  }

  // Graphite background; its soft top light fades with the loading bar.
  ctx.fillStyle = "#0f1012";
  ctx.fillRect(0, 0, W, H);
  const fadeIn = Math.min(1, (boot - 0.08) / 0.12);
  const fadeOut = 1 - easeOut(Math.min(1, Math.max(0, (boot - 0.8) / 0.2)));
  const alpha = fadeIn * fadeOut;
  if (alpha <= 0) return;
  const reach = Math.max(W, H) * 0.9;
  const glow = ctx.createRadialGradient(W / 2, -H * 0.1, 0, W / 2, -H * 0.1, reach);
  glow.addColorStop(0, `rgba(255,255,255,${0.1 * alpha})`);
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const loading = Math.min(1, (boot - 0.08) / 0.62);
  const bw = Math.min(W, H) * 0.34;
  const bx = (W - bw) / 2;
  const by = H * 0.5;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, 4 * u, 2 * u);
  ctx.fill();
  ctx.fillStyle = "#e9ebee";
  ctx.beginPath();
  ctx.roundRect(bx, by, bw * loading, 4 * u, 2 * u);
  ctx.fill();
  ctx.globalAlpha = 1;
}

const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
