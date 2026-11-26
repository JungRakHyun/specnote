#!/usr/bin/env node
/**
 * SpecNote PWA PNG 아이콘 생성기 (의존성 없는 순수 Node 4x 슈퍼샘플링 안티앨리어싱)
 * public/favicon.svg 로고를 192, 512, maskable 512, apple-touch-icon 180 PNG로 렌더링합니다.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, pngChunk('IHDR', ihdr), pngChunk('IDAT', idat), pngChunk('IEND', Buffer.alloc(0))]);
}

function inRoundRect(x, y, rx, ry, w, h, r) {
  if (x < rx || x > rx + w || y < ry || y > ry + h) return false;
  const cx = Math.max(rx + r, Math.min(x, rx + w - r));
  const cy = Math.max(ry + r, Math.min(y, ry + h - r));
  return (x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r;
}

function inCircle(x, y, cx, cy, r) {
  return (x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r;
}

function sampleLogo(u, v, { fullBleed, safeScale }) {
  // u, v in [0, 64]
  const bg = [15, 23, 42, 255]; // #0F172A
  const insideBg = fullBleed ? true : inRoundRect(u, v, 0, 0, 64, 64, 14);
  if (!insideBg) return [0, 0, 0, 0];

  // Scale inner artwork around center (32, 32) for maskable safe-zone padding
  const sx = (u - 32) / safeScale + 32;
  const sy = (v - 32) / safeScale + 32;

  if (inRoundRect(sx, sy, 14, 16, 22, 6, 3)) return [255, 255, 255, 255]; // #FFFFFF
  if (inRoundRect(sx, sy, 14, 29, 36, 6, 3)) return [37, 99, 235, 255];  // #2563EB
  if (inRoundRect(sx, sy, 14, 42, 28, 6, 3)) return [16, 185, 129, 255]; // #10B981
  if (inCircle(sx, sy, 48, 19, 4)) return [56, 189, 248, 255];           // #38BDF8
  return bg;
}

function renderIcon(size, opts) {
  const rgba = Buffer.alloc(size * size * 4);
  const ss = 4; // 4x4 supersampling
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const u = ((x + (sx + 0.5) / ss) / size) * 64;
          const v = ((y + (sy + 0.5) / ss) / size) * 64;
          const [cr, cg, cb, ca] = sampleLogo(u, v, opts);
          r += cr; g += cg; b += cb; a += ca;
        }
      }
      const idx = (y * size + x) * 4;
      const n = ss * ss;
      rgba[idx] = Math.round(r / n);
      rgba[idx + 1] = Math.round(g / n);
      rgba[idx + 2] = Math.round(b / n);
      rgba[idx + 3] = Math.round(a / n);
    }
  }
  return encodePng(size, size, rgba);
}

const outDir = path.resolve('public/icons');
fs.mkdirSync(outDir, { recursive: true });

const targets = [
  { file: 'icon-192.png', size: 192, fullBleed: false, safeScale: 1.0 },
  { file: 'icon-512.png', size: 512, fullBleed: false, safeScale: 1.0 },
  { file: 'icon-maskable-512.png', size: 512, fullBleed: true, safeScale: 0.78 },
  { file: 'apple-touch-icon.png', size: 180, fullBleed: true, safeScale: 0.92 },
];

for (const t of targets) {
  const png = renderIcon(t.size, t);
  fs.writeFileSync(path.join(outDir, t.file), png);
  console.log(`✅ PWA 아이콘 생성: /icons/${t.file} (${t.size}x${t.size}, ${(png.length / 1024).toFixed(1)} KB)`);
}
