import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';

const sizes = [192, 512];

for (const size of sizes) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const s = size / 100;

  // Dark rounded bg
  ctx.fillStyle = '#14161a';
  ctx.beginPath();
  ctx.moveTo(20 * s, 0);
  ctx.lineTo(size - 20 * s, 0);
  ctx.quadraticCurveTo(size, 0, size, 20 * s);
  ctx.lineTo(size, size - 20 * s);
  ctx.quadraticCurveTo(size, size, size - 20 * s, size);
  ctx.lineTo(20 * s, size);
  ctx.quadraticCurveTo(0, size, 0, size - 20 * s);
  ctx.lineTo(0, 20 * s);
  ctx.quadraticCurveTo(0, 0, 20 * s, 0);
  ctx.closePath();
  ctx.fill();

  // Barbell - vertical bars
  ctx.fillStyle = '#e3b23c';
  const bars = [
    [28, 22, 8, 56],
    [48, 18, 8, 64],
    [68, 26, 8, 48],
  ];
  for (const [x, y, w, h] of bars) {
    ctx.beginPath();
    ctx.moveTo(x * s, (y + 4) * s);
    ctx.quadraticCurveTo(x * s, y * s, (x + 4) * s, y * s);
    ctx.lineTo((x + w - 4) * s, y * s);
    ctx.quadraticCurveTo((x + w) * s, y * s, (x + w) * s, (y + 4) * s);
    ctx.lineTo((x + w) * s, (y + h - 4) * s);
    ctx.quadraticCurveTo((x + w) * s, (y + h) * s, (x + w - 4) * s, (y + h) * s);
    ctx.lineTo((x + 4) * s, (y + h) * s);
    ctx.quadraticCurveTo(x * s, (y + h) * s, x * s, (y + h - 4) * s);
    ctx.closePath();
    ctx.fill();
  }

  // Horizontal bar
  ctx.beginPath();
  ctx.moveTo(24 * s, 42 * s);
  ctx.lineTo(76 * s, 42 * s);
  ctx.lineTo(76 * s, 42 * s);
  ctx.quadraticCurveTo(80 * s, 42 * s, 80 * s, 44 * s);
  ctx.lineTo(80 * s, 48 * s);
  ctx.quadraticCurveTo(80 * s, 50 * s, 76 * s, 50 * s);
  ctx.lineTo(24 * s, 50 * s);
  ctx.quadraticCurveTo(20 * s, 50 * s, 20 * s, 48 * s);
  ctx.lineTo(20 * s, 44 * s);
  ctx.quadraticCurveTo(20 * s, 42 * s, 24 * s, 42 * s);
  ctx.closePath();
  ctx.fill();

  // Weight plates (circles)
  const circles = [
    [32, 34, 6],
    [52, 30, 6],
    [72, 38, 6],
  ];
  for (const [cx, cy, r] of circles) {
    ctx.beginPath();
    ctx.arc(cx * s, cy * s, r * s, 0, Math.PI * 2);
    ctx.fill();
  }

  const buffer = canvas.toBuffer('image/png');
  writeFileSync(`public/pwa-${size}x${size}.png`, buffer);
  console.log(`✅ public/pwa-${size}x${size}.png (${size}x${size})`);
}
