// Generates app icons for every APP_VARIANT:
//   assets/icons/<variant>.icon/   Icon Composer bundle for iOS 26+ (Liquid Glass, dark/tinted modes)
//   assets/icons/<variant>.png     flat 1024px icon (Android legacy icon, App Store fallback)
//   assets/icons/<variant>-android-foreground.png   adaptive icon foreground
//   assets/icons/splash.png        splash screen glyph
// Non-production variants get a labelled banner along the bottom edge.
//
// Run: pnpm --filter @plantcare/mobile icons
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'assets/icons');

const BACKGROUND = { top: '#4CD964', bottom: '#1E7B34' };

const VARIANTS = {
  production: null,
  preview: { label: 'PREVIEW', color: '#0A84FF' },
  development: { label: 'DEV', color: '#FF9500' },
};

// Glyph: a sprout inside camera-viewfinder corners, on a 600×600 canvas. Leaf midribs are
// cut out (evenodd) so the shape still reads in tinted and clear icon modes.
const sproutPaths = `
  <path d="M300 560 C 300 470 296 400 300 330" stroke-width="34" stroke-linecap="round" fill="none" />
  <path fill-rule="evenodd" d="
    M300 338 C 292 214 380 124 528 112 C 536 254 444 346 300 338 Z
    M318 320 C 380 250 440 192 500 140 L 510 152 C 452 206 392 264 330 332 Z" />
  <path fill-rule="evenodd" d="
    M298 420 C 296 322 222 252 92 246 C 84 360 172 432 298 420 Z
    M280 406 C 228 352 176 308 116 270 L 108 284 C 166 320 216 362 268 416 Z" />`;

const corner = (x, y, dx, dy) => `M${x} ${y + dy * 110} L ${x} ${y} L ${x + dx * 110} ${y}`;
const viewfinderPaths = `
  <g stroke-width="34" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <path d="${corner(70, 70, 1, 1)}" /><path d="${corner(530, 70, -1, 1)}" />
    <path d="${corner(70, 530, 1, -1)}" /><path d="${corner(530, 530, -1, -1)}" />
  </g>`;

const svg600 = (body, color) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600" fill="${color}" stroke="${color}">${body}</svg>`;

const sproutSvg = (color) => svg600(`<g transform="translate(300 300) scale(0.68) translate(-300 -322)">${sproutPaths}</g>`, color);
const viewfinderSvg = (color) => svg600(viewfinderPaths, color);
const glyphSvg = (color) =>
  svg600(`${viewfinderPaths}<g transform="translate(300 300) scale(0.68) translate(-300 -322)">${sproutPaths}</g>`, color);

const backgroundSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${BACKGROUND.top}" /><stop offset="1" stop-color="${BACKGROUND.bottom}" />
    </linearGradient></defs>
    <rect width="1024" height="1024" fill="url(#g)" />
  </svg>`;

const bannerSvg = ({ label, color }, size = 1024) => `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">
    <rect x="0" y="770" width="1024" height="254" fill="${color}" />
    <text x="512" y="935" text-anchor="middle" fill="#FFFFFF"
      font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="800"
      font-size="${label.length > 4 ? 150 : 180}" letter-spacing="6">${label}</text>
  </svg>`;

const png = (svg, size) => sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();

async function flatIcon(banner) {
  const glyph = await png(glyphSvg('#FFFFFF'), 640);
  const layers = [{ input: glyph, left: 192, top: banner ? 150 : 192 }];
  if (banner) layers.push({ input: await png(bannerSvg(banner), 1024), left: 0, top: 0 });
  // iOS rejects icons with an alpha channel.
  return sharp(Buffer.from(backgroundSvg)).composite(layers).flatten().removeAlpha().png().toBuffer();
}

async function androidForeground(banner) {
  // Adaptive icons are masked to ~66% of the canvas, so keep the glyph inside the safe zone.
  const glyph = await png(glyphSvg('#FFFFFF'), 520);
  const layers = [{ input: glyph, left: 252, top: banner ? 220 : 252 }];
  if (banner) {
    const label = await png(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
        <rect x="262" y="700" width="500" height="110" rx="55" fill="${banner.color}" />
        <text x="512" y="778" text-anchor="middle" fill="#FFFFFF" font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
          font-weight="800" font-size="70" letter-spacing="3">${banner.label}</text>
      </svg>`,
      1024,
    );
    layers.push({ input: label, left: 0, top: 0 });
  }
  return sharp({ create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(layers)
    .png()
    .toBuffer();
}

async function iconComposerBundle(variant, banner) {
  const dir = join(out, `${variant}.icon`);
  await rm(dir, { recursive: true, force: true });
  await mkdir(join(dir, 'Assets'), { recursive: true });
  await writeFile(join(dir, 'Assets/viewfinder.svg'), viewfinderSvg('#FFFFFF'));
  await writeFile(join(dir, 'Assets/sprout.svg'), sproutSvg('#FFFFFF'));

  const groups = [];
  if (banner) {
    await writeFile(join(dir, 'Assets/banner.png'), await png(bannerSvg(banner), 1024));
    // Topmost group, opaque, so the label stays legible. Icon Composer requires `shadow` on every group.
    groups.push({
      layers: [{ 'image-name': 'banner.png', name: 'banner' }],
      shadow: { kind: 'neutral', opacity: 0 },
      translucency: { enabled: false, value: 0 },
    });
  }
  groups.push({
    // Sprout above the viewfinder so Liquid Glass separates them in depth.
    layers: ['sprout', 'viewfinder'].map((name) => ({
      'image-name': `${name}.svg`,
      name,
      position: { scale: 1.2, 'translation-in-points': [0, banner ? -50 : 0] },
    })),
    shadow: { kind: 'neutral', opacity: 0.5 },
    translucency: { enabled: true, value: 0.2 },
  });

  const icon = {
    fill: { 'automatic-gradient': 'extended-srgb:0.14118,0.54118,0.23922,1.00000' },
    groups,
    'supported-platforms': { squares: 'shared' },
  };
  await writeFile(join(dir, 'icon.json'), `${JSON.stringify(icon, null, 2)}\n`);
}

await mkdir(out, { recursive: true });
for (const [variant, banner] of Object.entries(VARIANTS)) {
  await iconComposerBundle(variant, banner);
  await writeFile(join(out, `${variant}.png`), await flatIcon(banner));
  await writeFile(join(out, `${variant}-android-foreground.png`), await androidForeground(banner));
}
await writeFile(join(out, 'splash.png'), await png(glyphSvg('#FFFFFF'), 400));
console.log(`Icons written to ${out}`);
