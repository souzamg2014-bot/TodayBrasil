// ============================================================
// TodayBrasil - gerador dos icones do PWA (custo zero, sem tool nova).
// Usa `fflate` (ja e dependencia) para o zlib do PNG. Desenha o monograma "T"
// (branco sobre preto = a "porta preta" da marca). Maskable-safe: o T fica na
// area central segura.
//
// Rodar:  node scripts/gen-icons.mjs
// Gera:   public/icon-192.png, public/icon-512.png, public/apple-touch-icon.png
// ============================================================

import { writeFileSync } from "node:fs";
import { zlibSync } from "fflate";

// CRC32 (PNG)
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function u32(n) {
  return Uint8Array.of((n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255);
}
function chunk(type, data) {
  const typeBytes = new TextEncoder().encode(type);
  const body = new Uint8Array(typeBytes.length + data.length);
  body.set(typeBytes, 0);
  body.set(data, typeBytes.length);
  return [u32(data.length), body, u32(crc32(body))];
}

function png(size) {
  const N = size;
  // RGBA, fundo preto
  const px = new Uint8Array(N * N * 4);
  for (let i = 0; i < N * N; i++) px[i * 4 + 3] = 255; // alpha
  const white = (x, y) => {
    const o = (y * N + x) * 4;
    px[o] = 255; px[o + 1] = 255; px[o + 2] = 255; px[o + 3] = 255;
  };
  const rect = (x0, y0, x1, y1) => {
    for (let y = Math.round(y0); y < Math.round(y1); y++)
      for (let x = Math.round(x0); x < Math.round(x1); x++) white(x, y);
  };
  // monograma "T": barra + haste, dentro da area segura (~64%)
  rect(0.2 * N, 0.24 * N, 0.8 * N, 0.36 * N);   // barra horizontal
  rect(0.44 * N, 0.24 * N, 0.56 * N, 0.76 * N); // haste vertical

  // filtra (filtro 0 = none por linha)
  const raw = new Uint8Array(N * (N * 4 + 1));
  for (let y = 0; y < N; y++) {
    raw[y * (N * 4 + 1)] = 0;
    raw.set(px.subarray(y * N * 4, (y + 1) * N * 4), y * (N * 4 + 1) + 1);
  }
  const idat = zlibSync(raw, { level: 6 });

  const ihdr = new Uint8Array(13);
  ihdr.set(u32(N), 0);
  ihdr.set(u32(N), 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const sig = Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10);
  const parts = [sig, ...chunk("IHDR", ihdr), ...chunk("IDAT", idat), ...chunk("IEND", new Uint8Array(0))];
  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) { out.set(p, off); off += p.length; }
  return out;
}

const targets = [
  ["public/icon-192.png", 192],
  ["public/icon-512.png", 512],
  ["public/apple-touch-icon.png", 180],
];
for (const [path, size] of targets) {
  writeFileSync(new URL(`../${path}`, import.meta.url), png(size));
  console.log(`OK: ${path} (${size}x${size})`);
}
