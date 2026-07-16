import sharp from "sharp";
import { writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dir, "..", "public");
const SRC = join(outDir, "logo-source-oz.png");
if (!existsSync(SRC)) {
  console.error("Missing public/logo-source-oz.png");
  process.exit(1);
}

const BRAND = { r: 20, g: 20, b: 22, alpha: 1 };

async function cover(name, size) {
  const buf = await sharp(SRC)
    .resize(size, size, { fit: "cover", position: "centre" })
    .png({ compressionLevel: 9 })
    .toBuffer();
  writeFileSync(join(outDir, name), buf);
  console.log(`✅ ${name} (${size}x${size})`);
}

async function maskable(name, size) {
  const inner = Math.round(size * 0.8);
  const logo = await sharp(SRC)
    .resize(inner, inner, { fit: "cover" })
    .png()
    .toBuffer();
  const buf = await sharp({
    create: { width: size, height: size, channels: 4, background: BRAND },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png({ compressionLevel: 9 })
    .toBuffer();
  writeFileSync(join(outDir, name), buf);
  console.log(`✅ ${name} maskable`);
}

await cover("oz-mark.png", 512);
await cover("apple-touch-icon.png", 180);
await cover("pwa-192x192.png", 192);
await cover("pwa-512x512.png", 512);
await maskable("pwa-512x512-maskable.png", 512);
await cover("favicon-32.png", 32);

const b64 = (
  await sharp(SRC).resize(32, 32).png().toBuffer()
).toString("base64");
writeFileSync(
  join(outDir, "favicon.svg"),
  `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <image width="32" height="32" href="data:image/png;base64,${b64}"/>
</svg>
`,
);
console.log("✅ favicon.svg");
console.log("Done — icons from logo-source-oz.png");
