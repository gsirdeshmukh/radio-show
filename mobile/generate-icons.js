#!/usr/bin/env node
/**
 * Generate PNG icons from SVG for PWA
 * Requires: npm install sharp (or use the HTML generator instead)
 */

const fs = require('fs');
const path = require('path');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0b84ff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#af52de;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#grad)"/>
  <circle cx="256" cy="256" r="80" fill="none" stroke="white" stroke-width="12" opacity="0.9"/>
  <circle cx="256" cy="256" r="140" fill="none" stroke="white" stroke-width="8" opacity="0.6"/>
  <circle cx="256" cy="256" r="200" fill="none" stroke="white" stroke-width="6" opacity="0.4"/>
  <circle cx="256" cy="256" r="24" fill="white"/>
</svg>`;

async function generateIcons() {
  try {
    // Try to use sharp if available
    const sharp = require('sharp');
    
    const sizes = [192, 512];
    for (const size of sizes) {
      await sharp(Buffer.from(svgContent))
        .resize(size, size)
        .png()
        .toFile(path.join(__dirname, `icon-${size}.png`));
      console.log(`✓ Generated icon-${size}.png`);
    }
    console.log('\n✓ All icons generated successfully!');
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.log('⚠ sharp not found. Install it with: npm install sharp');
      console.log('\nAlternatively, you can:');
      console.log('1. Open generate-icons.html in your browser');
      console.log('2. Or use an online SVG to PNG converter');
      console.log('3. Or manually create 192x192 and 512x512 PNG icons');
      process.exit(1);
    } else {
      throw error;
    }
  }
}

generateIcons().catch(console.error);

