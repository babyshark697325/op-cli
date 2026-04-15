import sharp from 'sharp';

// ─── Terminal protocol detection ─────────────────────────────────────────────
export function detectProtocol() {
  const termProgram = process.env.TERM_PROGRAM || '';
  const term        = process.env.TERM || '';
  const lcTerminal  = process.env.LC_TERMINAL || '';

  if (termProgram === 'iTerm.app' || lcTerminal === 'iTerm2') return 'iterm2';
  if (term === 'xterm-kitty') return 'kitty';
  if (termProgram === 'WezTerm')  return 'kitty';
  if (termProgram === 'Hyper')    return 'iterm2';

  return 'halfblock';
}

export function isAppleTerminal() {
  return (process.env.TERM_PROGRAM || '') === 'Apple_Terminal';
}

// ─── iTerm2 inline image protocol ───────────────────────────────────────────
// Renders a pixel-perfect image — no character-grid limitation.
function renderITerm2(pngBuf, widthCols) {
  const b64 = pngBuf.toString('base64');
  // ESC ] 1337 ; File=inline=1;width=<cols>cols;preserveAspectRatio=1 : <base64> BEL
  return `\x1b]1337;File=inline=1;width=${widthCols}px;preserveAspectRatio=1:${b64}\x07\n`;
}

// ─── Kitty graphics protocol ─────────────────────────────────────────────────
// Pixel-perfect rendering in Kitty terminal and WezTerm.
function renderKitty(pngBuf, widthCols) {
  const b64 = pngBuf.toString('base64');
  const chunkSize = 4096;
  let output = '';

  for (let i = 0; i < b64.length; i += chunkSize) {
    const chunk = b64.slice(i, i + chunkSize);
    const more  = i + chunkSize < b64.length ? 1 : 0;
    if (i === 0) {
      // a=T → transmit+display, f=100 → PNG, c=cols width hint
      output += `\x1b_Ga=T,f=100,c=${widthCols},m=${more};${chunk}\x1b\\`;
    } else {
      output += `\x1b_Gm=${more};${chunk}\x1b\\`;
    }
  }
  return output + '\n';
}

// ─── Half-block fallback ─────────────────────────────────────────────────────
// Uses ▀ (U+2580) with ANSI true-color — same technique as poke-cli.
// Each char = 2 rows of pixels: foreground = top pixel, background = bottom.
export const HALFBLOCK_SIZES = {
  sm: { width: 42,  height: 59  },
  md: { width: 64,  height: 90  },
  lg: { width: 100, height: 140 },
};

async function renderHalfBlock(rawBuf, sizeKey) {
  const { width, height } = HALFBLOCK_SIZES[sizeKey] ?? HALFBLOCK_SIZES.md;

  const { data } = await sharp(rawBuf)
    .resize(width, height, { fit: 'fill', kernel: 'lanczos3' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const ch = 4; // RGBA
  let out = '';

  for (let y = 0; y < height - 1; y += 2) {
    for (let x = 0; x < width; x++) {
      const ti = (y * width + x) * ch;
      const bi = ((y + 1) * width + x) * ch;

      const [tr, tg, tb, ta] = [data[ti], data[ti+1], data[ti+2], data[ti+3]];
      const [br, bg, bb, ba] = [data[bi], data[bi+1], data[bi+2], data[bi+3]];

      if (ta < 30 && ba < 30) {
        out += ' ';
      } else if (ta < 30) {
        out += `\x1b[38;2;${br};${bg};${bb}m▄\x1b[0m`;
      } else if (ba < 30) {
        out += `\x1b[38;2;${tr};${tg};${tb}m▀\x1b[0m`;
      } else {
        out += `\x1b[38;2;${tr};${tg};${tb}m\x1b[48;2;${br};${bg};${bb}m▀\x1b[0m`;
      }
    }
    out += '\n';
  }
  return out;
}

// ─── Public API ──────────────────────────────────────────────────────────────
export async function fetchAndRenderCardImage(url, sizeKey = 'md') {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      'Referer':    'https://en.onepiece-cardgame.com/',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const rawBuf  = Buffer.from(await res.arrayBuffer());
  const protocol = detectProtocol();

  // For pixel-perfect protocols, convert to PNG and send as-is
  if (protocol === 'iterm2' || protocol === 'kitty') {
    const pngBuf = await sharp(rawBuf).png().toBuffer();
    const termW  = process.stdout.columns || 80;
    // Use ~half the terminal width so card sits nicely beside text
    const widthCols = Math.min(
      sizeKey === 'sm' ? 30 : sizeKey === 'lg' ? 60 : 45,
      Math.floor(termW * 0.55)
    );
    return protocol === 'iterm2'
      ? renderITerm2(pngBuf, widthCols)
      : renderKitty(pngBuf, widthCols);
  }

  // Fallback: half-block character art
  return renderHalfBlock(rawBuf, sizeKey);
}

export { renderHalfBlock };
