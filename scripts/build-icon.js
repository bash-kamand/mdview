#!/usr/bin/env node
// Generates build/icon.icns from an inline SVG using sharp + macOS iconutil

const sharp = require('sharp')
const { execSync } = require('child_process')
const { mkdirSync, writeFileSync, rmSync, existsSync } = require('fs')
const { join } = require('path')

const ROOT = join(__dirname, '..')
const ICONSET = join(ROOT, 'build', 'icon.iconset')
const ICNS_OUT = join(ROOT, 'build', 'icon.icns')

// Icon SVG — ClaudeView: dark rounded rect + document + blue eye dot
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <!-- Background -->
  <rect width="1024" height="1024" rx="220" fill="#141518"/>
  <!-- Document body -->
  <rect x="248" y="192" width="420" height="528" rx="32" fill="#ffffff" opacity="0.96"/>
  <!-- Dog-ear fold -->
  <polygon points="668,192 668,312 788,312" fill="#141518" opacity="0.15"/>
  <polygon points="668,192 788,312 668,312" fill="#d1d5db"/>
  <!-- Text lines -->
  <rect x="302" y="380" width="312" height="26" rx="8" fill="#94a3b8"/>
  <rect x="302" y="430" width="260" height="26" rx="8" fill="#94a3b8"/>
  <rect x="302" y="480" width="312" height="26" rx="8" fill="#94a3b8"/>
  <rect x="302" y="530" width="200" height="26" rx="8" fill="#94a3b8"/>
  <!-- Blue accent circle (eye / view) -->
  <circle cx="672" cy="720" r="120" fill="#3b82f6"/>
  <circle cx="672" cy="720" r="60" fill="white"/>
  <circle cx="672" cy="720" r="30" fill="#3b82f6"/>
</svg>`

const SIZES = [
  { file: 'icon_16x16.png',      size: 16 },
  { file: 'icon_16x16@2x.png',   size: 32 },
  { file: 'icon_32x32.png',      size: 32 },
  { file: 'icon_32x32@2x.png',   size: 64 },
  { file: 'icon_64x64.png',      size: 64 },
  { file: 'icon_64x64@2x.png',   size: 128 },
  { file: 'icon_128x128.png',    size: 128 },
  { file: 'icon_128x128@2x.png', size: 256 },
  { file: 'icon_256x256.png',    size: 256 },
  { file: 'icon_256x256@2x.png', size: 512 },
  { file: 'icon_512x512.png',    size: 512 },
  { file: 'icon_512x512@2x.png', size: 1024 },
]

async function main() {
  if (existsSync(ICONSET)) rmSync(ICONSET, { recursive: true })
  mkdirSync(ICONSET, { recursive: true })

  const svgBuf = Buffer.from(SVG)

  for (const { file, size } of SIZES) {
    await sharp(svgBuf)
      .resize(size, size)
      .png()
      .toFile(join(ICONSET, file))
    console.log(`  ✓ ${file}`)
  }

  execSync(`iconutil -c icns "${ICONSET}" -o "${ICNS_OUT}"`)
  rmSync(ICONSET, { recursive: true })
  console.log(`\n✅ Icon written to ${ICNS_OUT}`)
}

main().catch(e => { console.error(e); process.exit(1) })
