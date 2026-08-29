import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const SOURCE_SVG = path.resolve('public/app-icon.svg');
const RES_DIR = path.resolve('android/app/src/main/res');

const MIPMAP_CONFIGS = [
  { dir: 'mipmap-mdpi', launcherSize: 48, foregroundSize: 108, innerSize: 72 },
  { dir: 'mipmap-hdpi', launcherSize: 72, foregroundSize: 162, innerSize: 108 },
  { dir: 'mipmap-xhdpi', launcherSize: 96, foregroundSize: 216, innerSize: 144 },
  { dir: 'mipmap-xxhdpi', launcherSize: 144, foregroundSize: 324, innerSize: 216 },
  { dir: 'mipmap-xxxhdpi', launcherSize: 192, foregroundSize: 432, innerSize: 288 },
];

const SPLASH_PORTRAIT = [
  { dir: 'drawable-port-mdpi', width: 320, height: 480, iconSize: 128 },
  { dir: 'drawable-port-hdpi', width: 480, height: 800, iconSize: 180 },
  { dir: 'drawable-port-xhdpi', width: 720, height: 1280, iconSize: 240 },
  { dir: 'drawable-port-xxhdpi', width: 960, height: 1600, iconSize: 320 },
  { dir: 'drawable-port-xxxhdpi', width: 1280, height: 1920, iconSize: 320 },
];

const SPLASH_LANDSCAPE = [
  { dir: 'drawable-land-mdpi', width: 480, height: 320, iconSize: 128 },
  { dir: 'drawable-land-hdpi', width: 800, height: 480, iconSize: 180 },
  { dir: 'drawable-land-xhdpi', width: 1280, height: 720, iconSize: 240 },
  { dir: 'drawable-land-xxhdpi', width: 1600, height: 960, iconSize: 320 },
  { dir: 'drawable-land-xxxhdpi', width: 1920, height: 1280, iconSize: 320 },
];

async function generateIcons() {
  console.log('Generating Android Launcher Icons from:', SOURCE_SVG);

  for (const cfg of MIPMAP_CONFIGS) {
    const targetDir = path.join(RES_DIR, cfg.dir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // 1. Standard ic_launcher.png (Squircle / rounded rectangle)
    await sharp(SOURCE_SVG)
      .resize(cfg.launcherSize, cfg.launcherSize)
      .png()
      .toFile(path.join(targetDir, 'ic_launcher.png'));

    // 2. Round ic_launcher_round.png
    const circleMask = Buffer.from(
      `<svg width="${cfg.launcherSize}" height="${cfg.launcherSize}">
        <circle cx="${cfg.launcherSize / 2}" cy="${cfg.launcherSize / 2}" r="${cfg.launcherSize / 2}" fill="#ffffff" />
      </svg>`
    );

    const baseIcon = await sharp(SOURCE_SVG)
      .resize(cfg.launcherSize, cfg.launcherSize)
      .png()
      .toBuffer();

    await sharp(baseIcon)
      .composite([{ input: circleMask, blend: 'dest-in' }])
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_round.png'));

    // 3. Adaptive ic_launcher_foreground.png
    // The adaptive icon foreground canvas is 108dp x 108dp, with centered innerSize
    const innerIcon = await sharp(SOURCE_SVG)
      .resize(cfg.innerSize, cfg.innerSize)
      .png()
      .toBuffer();

    const topOffset = Math.round((cfg.foregroundSize - cfg.innerSize) / 2);
    const leftOffset = Math.round((cfg.foregroundSize - cfg.innerSize) / 2);

    await sharp({
      create: {
        width: cfg.foregroundSize,
        height: cfg.foregroundSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([
        {
          input: innerIcon,
          top: topOffset,
          left: leftOffset,
        },
      ])
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_foreground.png'));

    console.log(`Generated icons for ${cfg.dir}`);
  }

  // Generate splash screens
  for (const splash of [...SPLASH_PORTRAIT, ...SPLASH_LANDSCAPE]) {
    const targetDir = path.join(RES_DIR, splash.dir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const iconBuffer = await sharp(SOURCE_SVG)
      .resize(splash.iconSize, splash.iconSize)
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: splash.width,
        height: splash.height,
        channels: 4,
        background: { r: 245, g: 239, b: 227, alpha: 1 }, // #F5EFE3 Parchment Background
      },
    })
      .composite([
        {
          input: iconBuffer,
          top: Math.round((splash.height - splash.iconSize) / 2),
          left: Math.round((splash.width - splash.iconSize) / 2),
        },
      ])
      .png()
      .toFile(path.join(targetDir, 'splash.png'));
  }

  // Base drawable splash
  const defaultDrawableDir = path.join(RES_DIR, 'drawable');
  if (!fs.existsSync(defaultDrawableDir)) {
    fs.mkdirSync(defaultDrawableDir, { recursive: true });
  }
  const defaultIcon = await sharp(SOURCE_SVG).resize(200, 200).png().toBuffer();
  await sharp({
    create: {
      width: 480,
      height: 800,
      channels: 4,
      background: { r: 245, g: 239, b: 227, alpha: 1 },
    },
  })
    .composite([
      {
        input: defaultIcon,
        top: Math.round((800 - 200) / 2),
        left: Math.round((480 - 200) / 2),
      },
    ])
    .png()
    .toFile(path.join(defaultDrawableDir, 'splash.png'));

  // Also update public/app-icon.png and public/icon-512.png to be pristine 512x512 PNGs
  await sharp(SOURCE_SVG).resize(512, 512).png().toFile(path.resolve('public/app-icon.png'));
  await sharp(SOURCE_SVG).resize(512, 512).png().toFile(path.resolve('public/icon-512.png'));
  await sharp(SOURCE_SVG).resize(192, 192).png().toFile(path.resolve('public/icon-192.png'));

  console.log('All launcher icons and splash assets successfully generated!');
}

generateIcons().catch(console.error);
