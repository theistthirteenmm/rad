import { deflateSync } from 'zlib'
import { writeFileSync } from 'fs'

function crc32(buf) {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    table[i] = c
  }
  let crc = 0xffffffff
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const t = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, crcBuf])
}

function generatePNG(size) {
  const sig = Buffer.from([137,80,78,71,13,10,26,10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size,0); ihdr.writeUInt32BE(size,4)
  ihdr[8]=8; ihdr[9]=6  // RGBA

  const rows = []
  const cx = size/2, cy = size/2, r = size*0.42

  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size*4); row[0]=0
    for (let x = 0; x < size; x++) {
      const t = x/size, u = y/size
      const dist = Math.sqrt((x-cx)**2 + (y-cy)**2)
      const innerR = r * 0.88
      const off = 1 + x*4

      // Background: white/transparent outside rounded square
      const rx = Math.abs(x - cx) / (size*0.46)
      const ry = Math.abs(y - cy) / (size*0.46)
      const inRoundedSq = Math.pow(rx, 5) + Math.pow(ry, 5) < 1

      if (!inRoundedSq) {
        row[off]=255; row[off+1]=255; row[off+2]=255; row[off+3]=0
        continue
      }

      // Gradient background: purple(108,99,255) → pink(255,101,132) diagonal
      const blend = (t + u) / 2
      let R = Math.round(108 + (255-108)*blend)
      let G = Math.round(99 + (101-99)*blend)
      let B = Math.round(255 + (132-255)*blend)

      // Inner lighter circle
      if (dist < innerR * 0.55) {
        R = Math.round(R*0.55 + 255*0.45)
        G = Math.round(G*0.55 + 255*0.45)
        B = Math.round(B*0.55 + 255*0.45)
      }

      // Star sparkle pattern in center
      const angle = Math.atan2(y-cy, x-cx)
      const starPoints = 6
      const starR = innerR * 0.32
      const outerR = starR, innerStarR = starR*0.45
      const sector = (angle + Math.PI) / (2*Math.PI) * starPoints
      const fracSector = sector - Math.floor(sector)
      const starDist = fracSector < 0.5
        ? dist / (outerR + (innerStarR-outerR)*fracSector*2)
        : dist / (outerR + (innerStarR-outerR)*(1-fracSector)*2)

      if (dist < starR*1.1 && starDist < 1) {
        R = 255; G = 230; B = 80
      }

      row[off]   = Math.min(255,Math.max(0,R))
      row[off+1] = Math.min(255,Math.max(0,G))
      row[off+2] = Math.min(255,Math.max(0,B))
      row[off+3] = 255
    }
    rows.push(row)
  }

  const raw = Buffer.concat(rows)
  const compressed = deflateSync(raw, {level:6})
  return Buffer.concat([sig, chunk('IHDR',ihdr), chunk('IDAT',compressed), chunk('IEND',Buffer.alloc(0))])
}

writeFileSync('public/icon-192.png', generatePNG(192))
writeFileSync('public/icon-512.png', generatePNG(512))
writeFileSync('public/apple-touch-icon.png', generatePNG(180))
console.log('✓ Icons generated')
