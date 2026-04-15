import sharp from 'sharp';

// Image size options matching poke-cli's sm/md/lg approach
// Cards are portrait ~5:7 ratio, so height is proportionally taller
export const IMAGE_SIZES = {
  sm: { width: 32, height: 45 },
  md: { width: 52, height: 73 },
  lg: { width: 72, height: 101 },
};

/**
 * Render an image buffer as terminal half-block art.
 * Uses the same ▀ technique as poke-cli:
 *   foreground color = top pixel
 *   background color = bottom pixel
 *   character = ▀ (upper half block)
 * Process 2 rows of pixels per line of terminal output.
 */
export async function renderImage(imageBuffer, sizeKey = 'md') {
  const { width, height } = IMAGE_SIZES[sizeKey] ?? IMAGE_SIZES.md;

  const { data, info } = await sharp(imageBuffer)
    .resize(width, height, { fit: 'fill' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const ch = info.channels; // 4 (RGBA after ensureAlpha)
  let output = '';

  for (let y = 0; y < height - 1; y += 2) {
    for (let x = 0; x < width; x++) {
      const ti = (y * width + x) * ch;
      const bi = ((y + 1) * width + x) * ch;

      const tr = data[ti];
      const tg = data[ti + 1];
      const tb = data[ti + 2];
      const ta = data[ti + 3];

      const br = data[bi];
      const bg = data[bi + 1];
      const bb = data[bi + 2];
      const ba = data[bi + 3];

      if (ta < 30 && ba < 30) {
        // Both transparent — blank space
        output += ' ';
      } else if (ta < 30) {
        // Top transparent, bottom visible — lower half block
        output += `\x1b[38;2;${br};${bg};${bb}m▄\x1b[0m`;
      } else if (ba < 30) {
        // Bottom transparent, top visible — upper half block
        output += `\x1b[38;2;${tr};${tg};${tb}m▀\x1b[0m`;
      } else {
        // Both visible — foreground = top, background = bottom
        output += `\x1b[38;2;${tr};${tg};${tb}m\x1b[48;2;${br};${bg};${bb}m▀\x1b[0m`;
      }
    }
    output += '\n';
  }

  return output;
}

export async function fetchAndRenderCardImage(url, sizeKey = 'md') {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      'Referer': 'https://en.onepiece-cardgame.com/',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return renderImage(buf, sizeKey);
}
