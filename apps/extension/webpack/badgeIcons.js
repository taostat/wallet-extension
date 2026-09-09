/* eslint-env es2021 */

const fs = require("fs")
const path = require("path")
const { PNG } = require("pngjs")

const BADGE_COLORS = {
  dev: { r: 220, g: 38, b: 38, a: 255 }, // red
  internal: { r: 234, g: 179, b: 8, a: 255 }, // yellow / amber
  qa: { r: 37, g: 99, b: 235, a: 255 }, // blue (unused channel, ready if needed)
}

const FAVICON_SIZES = [16, 24, 32, 48, 64, 128]

const paintBadge = (png, color) => {
  const size = Math.max(4, Math.round(png.width * 0.32))
  const margin = Math.max(1, Math.round(png.width * 0.06))
  const x0 = png.width - size - margin
  const y0 = png.height - size - margin

  for (let y = y0; y < y0 + size; y++) {
    for (let x = x0; x < x0 + size; x++) {
      const idx = (png.width * y + x) << 2
      png.data[idx] = color.r
      png.data[idx + 1] = color.g
      png.data[idx + 2] = color.b
      png.data[idx + 3] = color.a
    }
  }
}

const badgeFaviconsInDir = (build, dir) => {
  const color = BADGE_COLORS[build]
  if (!color || !fs.existsSync(dir)) return

  for (const size of FAVICON_SIZES) {
    const filePath = path.join(dir, `favicon${size}x${size}.png`)
    if (!fs.existsSync(filePath)) continue

    const png = PNG.sync.read(fs.readFileSync(filePath))
    paintBadge(png, color)
    fs.writeFileSync(filePath, PNG.sync.write(png))
  }
}

/** Webpack plugin: overlay a colored corner badge on extension favicons for non-prod builds. */
function BadgeIconsPlugin({ build, outputPath }) {
  this.build = build
  this.outputPath = outputPath
}

BadgeIconsPlugin.prototype.apply = function (compiler) {
  const { build, outputPath } = this
  if (!BADGE_COLORS[build]) return

  compiler.hooks.afterEmit.tap(BadgeIconsPlugin.name, () => {
    badgeFaviconsInDir(build, outputPath)
  })
}

module.exports = { BadgeIconsPlugin, badgeFaviconsInDir, BADGE_COLORS }
