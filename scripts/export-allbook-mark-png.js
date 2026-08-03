const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

async function main() {
  const markSvg = fs
    .readFileSync(path.join(__dirname, "../public/brand/allbook-mark.svg"), "utf8")
    .replaceAll("currentColor", "#2563FF");

  await sharp(Buffer.from(markSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(__dirname, "../public/brand/allbook-mark.png"));

  await sharp(Buffer.from(markSvg.replaceAll("#2563FF", "#FFFFFF")))
    .resize(512, 512)
    .png()
    .toFile(path.join(__dirname, "../public/brand/allbook-mark-white.png"));

  const lockup = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 300" width="320" height="300">
  <g transform="translate(60,4) scale(2)" stroke="#2563FF" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path stroke-width="11" d="M18 86 50 12 82 86"/>
    <path stroke-width="11" d="M18 86Q35 98 50 74 65 98 82 86"/>
    <path stroke-width="9" d="M37 38 50 54 63 38"/>
  </g>
  <text x="160" y="260" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="36" font-weight="700" letter-spacing="6" fill="#2563FF">ALLBOOK</text>
</svg>`;

  await sharp(Buffer.from(lockup))
    .resize(960, 900)
    .png()
    .toFile(path.join(__dirname, "../public/brand/allbook-logo-vertical.png"));

  console.log("Exported crisp AllBook mark PNGs from SVG");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
