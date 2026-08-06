const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const src = path.join(__dirname, "../public/brand/brand-sheet.png");
const outDir = path.join(__dirname, "../public/brand");

/**
 * Convert light paper background to transparent while preserving
 * anti-aliased blue/dark ink edges. Does NOT force-recolor.
 */
async function paperToTransparent(buf, outPath) {
  const { data, info } = await sharp(buf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max - min;
    const brightness = (r + g + b) / 3;

    // Paper / light gray background
    if (brightness > 210 && sat < 35) {
      data[i + 3] = 0;
      continue;
    }

    // Soft edge: partially fade mid-light low-sat pixels
    if (brightness > 175 && sat < 45) {
      const t = (brightness - 175) / 50;
      data[i + 3] = Math.round((1 - t) * 255);
    }
  }

  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toFile(outPath);
}

async function extractRegion(region) {
  return sharp(src).extract(region).png().toBuffer();
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  // --- Large vertical lockup (full mark + wordmark), wider to keep the K ---
  {
    const buf = await extractRegion({ left: 48, top: 28, width: 270, height: 300 });
    const trimmed = await sharp(buf)
      .trim({ background: "#f0f0f0", threshold: 22 })
      .png()
      .toBuffer();
    await paperToTransparent(trimmed, path.join(outDir, "allbook-logo-vertical.png"));
  }

  // --- Mark only ---
  {
    const buf = await extractRegion({ left: 88, top: 42, width: 185, height: 170 });
    const trimmed = await sharp(buf)
      .trim({ background: "#f0f0f0", threshold: 22 })
      .png()
      .toBuffer();
    await paperToTransparent(trimmed, path.join(outDir, "allbook-mark.png"));
  }

  // --- Blue-on-white horizontal from LOGO USAGE (top white bar) ---
  // From previews: white bar sits above blue bar around y~430-500, x~560+
  {
    const buf = await extractRegion({ left: 560, top: 430, width: 430, height: 55 });
    const trimmed = await sharp(buf)
      .trim({ background: "#f5f5f5", threshold: 16 })
      .png()
      .toBuffer();
    await paperToTransparent(trimmed, path.join(outDir, "allbook-logo-horizontal.png"));
  }

  // --- White-on-blue horizontal (keep blue plate) ---
  {
    const buf = await extractRegion({ left: 575, top: 495, width: 400, height: 58 });
    await sharp(buf)
      .trim({ background: "#ffffff", threshold: 20 })
      .png()
      .toFile(path.join(outDir, "allbook-logo-horizontal-on-blue.png"));
  }

  // --- App icon (blue on white rounded square) ---
  {
    const buf = await extractRegion({ left: 545, top: 48, width: 105, height: 105 });
    await sharp(buf)
      .png()
      .toFile(path.join(outDir, "allbook-app-icon.png"));
  }

  // --- Compose crisp horizontal lockup: mark + SVG wordmark ---
  const markMeta = await sharp(path.join(outDir, "allbook-mark.png")).metadata();
  const markH = 128;
  const markW = Math.round((markMeta.width / markMeta.height) * markH);
  const markResized = await sharp(path.join(outDir, "allbook-mark.png"))
    .resize(markW, markH)
    .png()
    .toBuffer();

  const gap = 18;
  const textW = 320;
  const totalW = markW + gap + textW;
  const totalH = markH;
  const textSvg = Buffer.from(`
    <svg width="${textW}" height="${totalH}" xmlns="http://www.w3.org/2000/svg">
      <text
        x="0"
        y="${totalH * 0.62}"
        font-family="Arial, Helvetica, sans-serif"
        font-size="42"
        font-weight="700"
        letter-spacing="10"
        fill="#2563FF"
      >ALLBOOK</text>
    </svg>
  `);

  await sharp({
    create: {
      width: totalW,
      height: totalH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: markResized, left: 0, top: 0 },
      { input: await sharp(textSvg).png().toBuffer(), left: markW + gap, top: 0 },
    ])
    .png()
    .toFile(path.join(outDir, "allbook-logo-horizontal.png"));

  // White version for dark backgrounds
  const textSvgWhite = Buffer.from(`
    <svg width="${textW}" height="${totalH}" xmlns="http://www.w3.org/2000/svg">
      <text
        x="0"
        y="${totalH * 0.62}"
        font-family="Arial, Helvetica, sans-serif"
        font-size="42"
        font-weight="700"
        letter-spacing="10"
        fill="#FFFFFF"
      >ALLBOOK</text>
    </svg>
  `);

  // Recolor mark to white for dark bg version
  const { data, info } = await sharp(markResized)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 20) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
    }
  }
  const whiteMark = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: totalW,
      height: totalH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: whiteMark, left: 0, top: 0 },
      {
        input: await sharp(textSvgWhite).png().toBuffer(),
        left: markW + gap,
        top: 0,
      },
    ])
    .png()
    .toFile(path.join(outDir, "allbook-logo-horizontal-white.png"));

  // Also save white mark alone
  await sharp(whiteMark).png().toFile(path.join(outDir, "allbook-mark-white.png"));

  for (const f of [
    "allbook-mark.png",
    "allbook-mark-white.png",
    "allbook-logo-vertical.png",
    "allbook-logo-horizontal.png",
    "allbook-logo-horizontal-white.png",
    "allbook-logo-horizontal-on-blue.png",
    "allbook-app-icon.png",
  ]) {
    const m = await sharp(path.join(outDir, f)).metadata();
    console.log(f, m.width, "x", m.height);
  }

  // Cleanup previews / raw
  for (const f of fs.readdirSync(outDir)) {
    if (f.startsWith("_preview-") || f.endsWith("-raw.png") || f === "allbook-wordmark.png") {
      fs.unlinkSync(path.join(outDir, f));
      console.log("removed", f);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
