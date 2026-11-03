// Gera os ícones PWA (public/pwa-192x192.png e public/pwa-512x512.png) sem
// dependências externas. Rode com: node scripts/gerar-icones.mjs

import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

const VERDE = [14, 124, 102]
const BRANCO = [255, 255, 255]

function crc32(buf) {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i]
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(tipo, dados) {
  const t = Buffer.from(tipo, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(dados.length)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([t, dados])))
  return Buffer.concat([len, t, dados, crc])
}

function png(largura, altura, corDe) {
  const linhas = []
  for (let y = 0; y < altura; y++) {
    linhas.push(0) // filtro "none"
    for (let x = 0; x < largura; x++) {
      const [r, g, b, a] = corDe(x, y)
      linhas.push(r, g, b, a)
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(largura, 0)
  ihdr.writeUInt32BE(altura, 4)
  ihdr[8] = 8 // profundidade de bits
  ihdr[9] = 6 // RGBA
  const assinatura = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  return Buffer.concat([
    assinatura,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.from(linhas), { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/** Retângulo arredondado centrado em (cx, cy), meia largura rx, meia altura ry, raio r. */
function dentroRetanguloArredondado(x, y, cx, cy, rx, ry, r) {
  const qx = Math.abs(x - cx) - (rx - r)
  const qy = Math.abs(y - cy) - (ry - r)
  const dx = Math.max(qx, 0)
  const dy = Math.max(qy, 0)
  return Math.hypot(dx, dy) + Math.min(Math.max(qx, qy), 0) - r <= 0
}

// Fundo verde (quadrado com cantos arredondados) + cápsula branca (comprimido)
// com o "entalhe" verde ao centro.
function corIcone(x, y, s) {
  const raio = s * 0.18
  const foraFundo = !dentroRetanguloArredondado(x, y, s / 2, s / 2, s / 2 - raio, s / 2 - raio, raio)
  if (foraFundo) return [0, 0, 0, 0]
  const dentroPilula = dentroRetanguloArredondado(x, y, s / 2, s / 2, s * 0.185, s * 0.3, s * 0.185)
  if (dentroPilula && Math.abs(y - s / 2) < s * 0.035) return VERDE
  if (dentroPilula) return BRANCO
  return VERDE
}

for (const lados of [192, 512]) {
  const caminho = new URL(`../public/pwa-${lados}x${lados}.png`, import.meta.url)
  writeFileSync(caminho, png(lados, lados, (x, y) => corIcone(x, y, lados)))
  console.log(`Gerado: public/pwa-${lados}x${lados}.png`)
}
