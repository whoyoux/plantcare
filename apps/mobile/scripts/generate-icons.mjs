// Generates app icons for every APP_VARIANT, the splash artwork and the website's brand images from
// the mascot artwork in assets/icons/source/artwork.png (made with scripts/generate-icon-artwork.mjs):
//   assets/icons/<variant>.icon/   Icon Composer bundle for iOS 26+ (Liquid Glass, dark/tinted modes)
//   assets/icons/<variant>.png     flat 1024px icon (Android legacy icon, App Store fallback)
//   assets/icons/<variant>-android-foreground.png   adaptive icon foreground (also monochrome)
//   assets/icons/splash.png        splash screen and in-app logo
//   ../web/public/{logo.webp,favicon.png,apple-touch-icon.png}
// Non-production variants get a labelled banner along the bottom edge.
//
// Run: pnpm --filter @plantcare/mobile icons
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'assets/icons');
const web = join(root, '../web/public');

/** Warm cream, like unglazed clay; matches the splash screen. Icon Composer's fill uses the same. */
const BACKGROUND = '#F4EEE2';
const BACKGROUND_SRGB = 'extended-srgb:0.95686,0.93333,0.88627,1.00000';

const VARIANTS = {
  production: null,
  preview: { label: 'PREVIEW', color: '#0A84FF' },
  development: { label: 'DEV', color: '#FF9500' },
};

const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
const png = (input, size) => sharp(input).resize(size, size).png().toBuffer();
const svg = (body) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">${body}</svg>`);

/** The mascot trimmed to its bounds and centred on a square transparent canvas. */
async function loadMascot() {
  const trimmed = await sharp(join(out, 'source/artwork.png')).ensureAlpha().trim().png().toBuffer();
  const { width, height } = await sharp(trimmed).metadata();
  const side = Math.max(width, height);
  return sharp(trimmed)
    .extend({
      top: Math.floor((side - height) / 2),
      bottom: Math.ceil((side - height) / 2),
      left: Math.floor((side - width) / 2),
      right: Math.ceil((side - width) / 2),
      background: transparent,
    })
    .png()
    .toBuffer();
}

const bannerSvg = ({ label, color }) =>
  svg(`<rect x="0" y="790" width="1024" height="234" fill="${color}" />
    <text x="512" y="945" text-anchor="middle" fill="#FFFFFF"
      font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="800"
      font-size="${label.length > 4 ? 140 : 170}" letter-spacing="6">${label}</text>`);

/** Mascot size on the 1024 canvas and its vertical offset; with a banner it shrinks and moves up. */
const placement = (banner) => (banner ? { scale: 0.62, dy: -95 } : { scale: 0.78, dy: 0 });

/** The mascot on a transparent 1024 canvas, positioned for the given banner. */
async function glyph(mascot, banner) {
  const { scale, dy } = placement(banner);
  const size = Math.round(1024 * scale);
  const offset = Math.round((1024 - size) / 2);
  return sharp({ create: { width: 1024, height: 1024, channels: 4, background: transparent } })
    .composite([{ input: await png(mascot, size), left: offset, top: offset + dy }])
    .png()
    .toBuffer();
}

async function flatIcon(mascot, banner) {
  const layers = [{ input: await glyph(mascot, banner), left: 0, top: 0 }];
  if (banner) layers.push({ input: await sharp(bannerSvg(banner)).png().toBuffer(), left: 0, top: 0 });
  // iOS rejects icons with an alpha channel.
  return sharp({ create: { width: 1024, height: 1024, channels: 3, background: BACKGROUND } })
    .composite(layers)
    .flatten({ background: BACKGROUND })
    .removeAlpha()
    .png()
    .toBuffer();
}

async function androidForeground(mascot, banner) {
  // Adaptive icons only guarantee the centre ~66%, so keep the mascot inside it.
  const size = 600;
  const layers = [{ input: await png(mascot, size), left: 212, top: banner ? 150 : 212 }];
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
  return sharp({ create: { width: 1024, height: 1024, channels: 4, background: transparent } })
    .composite(layers)
    .png()
    .toBuffer();
}

async function iconComposerBundle(variant, mascot, banner) {
  const dir = join(out, `${variant}.icon`);
  await rm(dir, { recursive: true, force: true });
  await mkdir(join(dir, 'Assets'), { recursive: true });
  await writeFile(join(dir, 'Assets/mascot.png'), await png(mascot, 1024));

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
  groups.push({
    layers: [{ 'image-name': 'mascot.png', name: 'mascot', position: { scale, 'translation-in-points': [0, dy] } }],
    shadow: { kind: 'neutral', opacity: 0.4 },
    translucency: { enabled: false, value: 0 },
  });

  const icon = {
    fill: { 'automatic-gradient': BACKGROUND_SRGB },
    groups,
    'supported-platforms': { squares: 'shared' },
  };
  await writeFile(join(dir, 'icon.json'), `${JSON.stringify(icon, null, 2)}\n`);
}

const mascot = await loadMascot();
await mkdir(out, { recursive: true });
for (const [variant, banner] of Object.entries(VARIANTS)) {
  await iconComposerBundle(variant, mascot, banner);
  await writeFile(join(out, `${variant}.png`), await flatIcon(mascot, banner));
  await writeFile(join(out, `${variant}-android-foreground.png`), await androidForeground(mascot, banner));
}
await writeFile(join(out, 'splash.png'), await png(mascot, 512));

// Website: the mascot for the header and hero, and icons cut from the production app icon.
const production = await flatIcon(mascot, null);
await writeFile(join(web, 'logo.webp'), await sharp(mascot).resize(480, 480).webp({ quality: 90 }).toBuffer());
await writeFile(join(web, 'favicon.png'), await sharp(production).resize(64, 64).png().toBuffer());
await writeFile(join(web, 'apple-touch-icon.png'), await sharp(production).resize(180, 180).png().toBuffer());
console.log(`Icons written to ${out} and ${web}`);
