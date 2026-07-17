/**
 * Barcode-Decode für Fotos/Canvas — iPhone-Safari-tauglich.
 *
 * iOS-Kamera-Fotos sind oft 10–12 MP. ZXing scheitert daran ohne
 * Downscale. Deshalb mehrere Auflösungen + optional native BarcodeDetector.
 */

import {
  BrowserMultiFormatReader,
  BarcodeFormat,
} from "@zxing/browser";
import { DecodeHintType } from "@zxing/library";

const FORMATS_ZX = [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
];

const FORMATS_BD = [
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
  "code_39",
];

export function normalizeBarcode(raw) {
  const code = String(raw ?? "").replace(/\D/g, "");
  if (code.length < 8 || code.length > 18) return "";
  return code;
}

function makeReader() {
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, FORMATS_ZX);
  hints.set(DecodeHintType.TRY_HARDER, true);
  return new BrowserMultiFormatReader(hints, {
    delayBetweenScanAttempts: 100,
    tryPlayVideoTimeout: 5000,
  });
}

function createDetector() {
  try {
    if (typeof window === "undefined" || !("BarcodeDetector" in window)) {
      return null;
    }
    try {
      return new window.BarcodeDetector({ formats: FORMATS_BD });
    } catch {
      return new window.BarcodeDetector();
    }
  } catch {
    return null;
  }
}

/** Zeichnet ImageBitmap/Image auf Canvas (max. Kantenlänge) */
function drawScaled(source, maxEdge) {
  const sw = source.videoWidth || source.naturalWidth || source.width;
  const sh = source.videoHeight || source.naturalHeight || source.height;
  if (!sw || !sh) return null;
  const scale = Math.min(1, maxEdge / Math.max(sw, sh));
  const w = Math.max(1, Math.round(sw * scale));
  const h = Math.max(1, Math.round(sh * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, w, h);
  return canvas;
}

/** Optional: Kontrast hochziehen (hilft bei matten Verpackungen) */
function boostContrast(canvas) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return canvas;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  const factor = 1.35;
  const intercept = 128 * (1 - factor);
  for (let i = 0; i < d.length; i += 4) {
    // grayscale + contrast
    const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    const v = Math.max(0, Math.min(255, g * factor + intercept));
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

async function tryBarcodeDetector(source) {
  const detector = createDetector();
  if (!detector) return "";
  try {
    const codes = await detector.detect(source);
    for (const c of codes || []) {
      const n = normalizeBarcode(c.rawValue);
      if (n) return n;
    }
  } catch {
    /* unsupported format / frame */
  }
  return "";
}

function tryZxingCanvas(reader, canvas) {
  try {
    const result = reader.decodeFromCanvas(canvas);
    const text = result?.getText?.() || "";
    return normalizeBarcode(text);
  } catch {
    return "";
  }
}

/**
 * Dekodiert ein Foto (File/Blob) — optimiert für iPhone-Safari.
 * @returns {Promise<string>} normalisierter Code oder ""
 */
export async function decodeBarcodeFromFile(file) {
  if (!file) return "";

  // 1) Native BarcodeDetector auf ImageBitmap (Safari 17.4+ manchmal)
  let bitmap = null;
  try {
    if (typeof createImageBitmap === "function") {
      bitmap = await createImageBitmap(file);
      const n = await tryBarcodeDetector(bitmap);
      if (n) {
        bitmap.close?.();
        return n;
      }
    }
  } catch {
    /* continue */
  }

  // 2) ZXing auf mehreren Auflösungen (große iPhone-Fotos sonst Fail)
  const reader = makeReader();
  const maxEdges = [900, 1400, 600, 1800];

  try {
    if (!bitmap && typeof createImageBitmap === "function") {
      try {
        bitmap = await createImageBitmap(file);
      } catch {
        bitmap = null;
      }
    }

    if (bitmap) {
      for (const edge of maxEdges) {
        const canvas = drawScaled(bitmap, edge);
        if (!canvas) continue;
        let hit = tryZxingCanvas(reader, canvas);
        if (hit) return hit;
        // Kontrast-Boost zweiter Versuch
        hit = tryZxingCanvas(reader, boostContrast(canvas));
        if (hit) return hit;
      }
    }

    // 3) Fallback: Image-Element (manche HEIC→JPEG Pfade)
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.decoding = "async";
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error("image load"));
        img.src = url;
      });
      // native detector on img
      const nBd = await tryBarcodeDetector(img);
      if (nBd) return nBd;

      for (const edge of maxEdges) {
        const canvas = drawScaled(img, edge);
        if (!canvas) continue;
        let hit = tryZxingCanvas(reader, canvas);
        if (hit) return hit;
        hit = tryZxingCanvas(reader, boostContrast(canvas));
        if (hit) return hit;
      }

      // last resort: full element decode
      try {
        const result = await reader.decodeFromImageElement(img);
        const n = normalizeBarcode(result?.getText?.() || "");
        if (n) return n;
      } catch {
        /* ignore */
      }
    } finally {
      URL.revokeObjectURL(url);
    }
  } finally {
    bitmap?.close?.();
    try {
      reader.reset();
    } catch {
      /* ignore */
    }
  }

  return "";
}

export { makeReader };
