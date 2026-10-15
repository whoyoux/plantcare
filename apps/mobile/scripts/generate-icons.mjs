// Generates app icons for every APP_VARIANT from the AI artwork in assets/icons/source/artwork.png
// (made with scripts/generate-icon-artwork.mjs) plus a vector viewfinder:
//   assets/icons/<variant>.icon/   Icon Composer bundle for iOS 26+ (Liquid Glass, dark/tinted modes)
//   assets/icons/<variant>.png     flat 1024px icon (Android legacy icon, App Store fallback)
//   assets/icons/<variant>-android-foreground.png   adaptive icon foreground (also monochrome)
//   assets/icons/splash.png        splash screen artwork
// Non-production variants get a labelled banner along the bottom edge.
//
// Run: pnpm --filter @plantcare/mobile icons
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'assets/icons');

const BACKGROUND = { top: '#FFFFFF', bottom: '#E3F2E6' };
const VIEWFINDER_COLOR = '#34A853';

const VARIANTS = {
  production: null,
  preview: { label: 'PREVIEW', color: '#0A84FF' },
  development: { label: 'DEV', color: '#FF9500' },
};

const png = (input, size) => sharp(input).resize(size, size).png().toBuffer();
const svg = (body) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">${body}</svg>`);

/**
 * The AI artwork's own viewfinder is barely visible glass (alpha < 48); drop it, keep the opaque
 * sprout, trim to its bounds and centre it on a square canvas.
 */
async function loadSprout() {
  const { data, info } = await sharp(join(out, 'source/artwork.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 3; i < data.length; i += 4) if (data[i] < 48) data[i] = 0;
  const trimmed = await sharp(data, { raw: info }).trim().png().toBuffer();
  const { width, height } = await sharp(trimmed).metadata();
  const side = Math.max(width, height);
  return sharp(trimmed)
    .extend({
      top: Math.floor((side - height) / 2),
      bottom: Math.ceil((side - height) / 2),
      left: Math.floor((side - width) / 2),
      right: Math.ceil((side - width) / 2),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

const corner = (x, y, dx, dy, len) => `M${x} ${y + dy * len} L ${x} ${y} L ${x + dx * len} ${y}`;
/** Camera viewfinder corners on a 1024 canvas, inset by `inset`. */
const viewfinderSvg = (color, inset = 170, len = 150, width = 44) => {
  const far = 1024 - inset;
  return svg(`<g stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <path d="${corner(inset, inset, 1, 1, len)}" /><path d="${corner(far, inset, -1, 1, len)}" />
    <path d="${corner(inset, far, 1, -1, len)}" /><path d="${corner(far, far, -1, -1, len)}" />
  </g>`);
};

const backgroundSvg = svg(`
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${BACKGROUND.top}" /><stop offset="1" stop-color="${BACKGROUND.bottom}" />
  </linearGradient></defs>
  <rect width="1024" height="1024" fill="url(#g)" />`);

const bannerSvg = ({ label, color }) =>
  svg(`<rect x="0" y="790" width="1024" height="234" fill="${color}" />
    <text x="512" y="945" text-anchor="middle" fill="#FFFFFF"
      font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="800"
      font-size="${label.length > 4 ? 140 : 170}" letter-spacing="6">${label}</text>`);

// With a banner the glyph shrinks and moves up so the bottom viewfinder corners stay visible.
const placement = (banner) => (banner ? { scale: 0.82, dy: -72 } : { scale: 1, dy: 0 });

/** Viewfinder + sprout on a transparent 1024 canvas. */
async function glyph(sprout, banner) {
  const { scale, dy } = placement(banner);
  const viewfinder = await sharp(viewfinderSvg(VIEWFINDER_COLOR)).png().toBuffer();
  const full = await sharp({ create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([
      { input: viewfinder, left: 0, top: 0 },
      { input: await png(sprout, 560), left: 232, top: 232 },
    ])
    .png()
    .toBuffer();
  const size = Math.round(1024 * scale);
  const offset = Math.round((1024 - size) / 2);
  return sharp({ create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: await png(full, size), left: offset, top: offset + dy }])
    .png()
    .toBuffer();
}

async function flatIcon(sprout, banner) {
  const layers = [{ input: await glyph(sprout, banner), left: 0, top: 0 }];
  if (banner) layers.push({ input: await sharp(bannerSvg(banner)).png().toBuffer(), left: 0, top: 0 });
  // iOS rejects icons with an alpha channel.
  return sharp(backgroundSvg).composite(layers).flatten().removeAlpha().png().toBuffer();
}

async function androidForeground(sprout, banner) {
  // Adaptive icons only guarantee the centre ~66%, so scale the glyph down.
  const scaled = await png(await glyph(sprout, null), 660);
  const layers = [{ input: scaled, left: 182, top: banner ? 150 : 182 }];
  if (banner) {
    layers.push({
      input: await sharp(
        svg(`<rect x="292" y="740" width="440" height="100" rx="50" fill="${banner.color}" />
          <text x="512" y="811" text-anchor="middle" fill="#FFFFFF" font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
            font-weight="800" font-size="62" letter-spacing="3">${banner.label}</text>`),
      )
        .png()
        .toBuffer(),
      left: 0,
      top: 0,
    });
  }
  return sharp({ create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(layers)
    .png()
    .toBuffer();
}

async function iconComposerBundle(variant, sprout, banner) {
  const dir = join(out, `${variant}.icon`);
  await rm(dir, { recursive: true, force: true });
  await mkdir(join(dir, 'Assets'), { recursive: true });
  await writeFile(join(dir, 'Assets/viewfinder.png'), await sharp(viewfinderSvg(VIEWFINDER_COLOR)).png().toBuffer());
  await writeFile(join(dir, 'Assets/sprout.png'), await png(sprout, 1024));

  const { scale, dy } = placement(banner);
  const groups = [];
  if (banner) {
    await writeFile(join(dir, 'Assets/banner.png'), await sharp(bannerSvg(banner)).png().toBuffer());
    // Topmost, opaque group so the label stays legible. Icon Composer requires `shadow` on every group.
    groups.push({
      layers: [{ 'image-name': 'banner.png', name: 'banner' }],
      shadow: { kind: 'neutral', opacity: 0 },
      translucency: { enabled: false, value: 0 },
    });
  }
  // Sprout floats above the viewfinder, so Liquid Glass separates them in depth.
  groups.push({
    layers: [{ 'image-name': 'sprout.png', name: 'sprout', position: { scale: 0.55 * scale, 'translation-in-points': [0, dy] } }],
    shadow: { kind: 'neutral', opacity: 0.5 },
    translucency: { enabled: false, value: 0 },
  });
  groups.push({
    layers: [{ 'image-name': 'viewfinder.png', name: 'viewfinder', position: { scale, 'translation-in-points': [0, dy] } }],
    shadow: { kind: 'neutral', opacity: 0.3 },
    translucency: { enabled: true, value: 0.2 },
  });

  const icon = {
    fill: { 'automatic-gradient': 'extended-srgb:0.94118,0.97647,0.94902,1.00000' },
    groups,
    'supported-platforms': { squares: 'shared' },
  };
  await writeFile(join(dir, 'icon.json'), `${JSON.stringify(icon, null, 2)}\n`);
}

const sprout = await loadSprout();
await mkdir(out, { recursive: true });
for (const [variant, banner] of Object.entries(VARIANTS)) {
  await iconComposerBundle(variant, sprout, banner);
  await writeFile(join(out, `${variant}.png`), await flatIcon(sprout, banner));
  await writeFile(join(out, `${variant}-android-foreground.png`), await androidForeground(sprout, banner));
}
await writeFile(join(out, 'splash.png'), await png(sprout, 512));
console.log(`Icons written to ${out}`);
