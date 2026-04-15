import chalk from 'chalk';
import Table from 'cli-table3';
import { fetchAndRenderCardImage } from './image.js';

// ─── One Piece TCG color theming ────────────────────────────────────────────
const COLOR_FN = {
  Red:    (s) => chalk.bgRgb(180, 30, 30).whiteBright(s),
  Blue:   (s) => chalk.bgRgb(30, 100, 180).whiteBright(s),
  Green:  (s) => chalk.bgRgb(30, 140, 60).whiteBright(s),
  Purple: (s) => chalk.bgRgb(120, 40, 160).whiteBright(s),
  Black:  (s) => chalk.bgRgb(40, 40, 40).whiteBright(s),
  Yellow: (s) => chalk.bgRgb(200, 170, 0).black(s),
};

const COLOR_DOT = {
  Red:    chalk.redBright('●Red'),
  Blue:   chalk.cyanBright('●Blue'),
  Green:  chalk.greenBright('●Green'),
  Purple: chalk.magentaBright('●Purple'),
  Black:  chalk.gray('●Black'),
  Yellow: chalk.yellowBright('●Yellow'),
};

const RARITY_COLOR = {
  'Leader':      chalk.bold.yellowBright,
  'Common':      chalk.white,
  'Uncommon':    chalk.greenBright,
  'Rare':        chalk.blueBright,
  'Super Rare':  chalk.magentaBright,
  'Secret Rare': chalk.bold.redBright,
  'Special Card':chalk.bold.yellow,
  'Promo':       chalk.bold.cyan,
};

const TABLE_CHARS = {
  top: '─', 'top-mid': '┬', 'top-left': '╭', 'top-right': '╮',
  bottom: '─', 'bottom-mid': '┴', 'bottom-left': '╰', 'bottom-right': '╯',
  left: '│', 'left-mid': '├', mid: '─', 'mid-mid': '┼',
  right: '│', 'right-mid': '┤', middle: '│',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function colorsTag(colors = []) {
  return colors.map(c => COLOR_DOT[c] ?? chalk.white(`●${c}`)).join(' ');
}

function rarityTag(r) {
  return (RARITY_COLOR[r] ?? chalk.white)(r || '—');
}

function fmtPower(n) {
  return n != null ? chalk.bold(n.toLocaleString()) : chalk.dim('—');
}

function wrapWords(text, maxW) {
  if (!text) return [];
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (stripAnsi(test).length > maxW && cur) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

function stripAnsi(s) {
  return s.replace(/\x1B\[[0-9;]*m/g, '');
}

// ─── Card detail panel ───────────────────────────────────────────────────────
export async function printCard(card, { imageSize } = {}) {
  const W = 58;
  const top = chalk.dim('╭' + '─'.repeat(W) + '╮');
  const bot = chalk.dim('╰' + '─'.repeat(W) + '╯');
  const mid = chalk.dim('├' + '─'.repeat(W) + '┤');
  const side = chalk.dim('│');

  const row = (content) => {
    const plain = stripAnsi(content);
    const pad = Math.max(0, W - plain.length);
    return `${side} ${content}${' '.repeat(pad)} ${side}`;
  };

  // Optional card image above the panel
  if (imageSize && card.img_full_url) {
    try {
      const img = await fetchAndRenderCardImage(card.img_full_url, imageSize);
      process.stdout.write(img);
      console.log('');
    } catch {
      // silently skip if image fails
    }
  }

  // Card type color badge
  const colorBadge = (card.colors || []).map(c => {
    const fn = COLOR_FN[c];
    return fn ? fn(` ${c} `) : chalk.white(c);
  }).join(' ');

  const catStyle = card.category === 'Leader'
    ? chalk.bold.yellowBright
    : card.category === 'Event' ? chalk.magentaBright
    : chalk.bold.white;

  console.log(top);
  console.log(row(`${chalk.dim(card.id || '')}  ${chalk.bold.white(card.name || '?')}  ${catStyle(`[${card.category || '?'}]`)}`));
  console.log(row(colorBadge + '   ' + rarityTag(card.rarity)));
  console.log(row(chalk.dim('─'.repeat(W))));

  // Stats row
  const stats = [];
  if (card.cost != null)    stats.push(`${chalk.dim('Cost')} ${chalk.bold(card.cost)}`);
  if (card.power != null)   stats.push(`${chalk.dim('Power')} ${fmtPower(card.power)}`);
  if (card.counter != null) stats.push(`${chalk.dim('Counter')} ${chalk.bold('+' + card.counter)}`);
  if (stats.length) console.log(row(stats.join('   ')));

  if (card.types?.length)
    console.log(row(`${chalk.dim('Types:')} ${chalk.cyanBright(card.types.join(', '))}`));
  if (card.attributes?.length)
    console.log(row(`${chalk.dim('Attribute:')} ${chalk.yellowBright(card.attributes.join(', '))}`));

  if (card.effect) {
    console.log(row(''));
    console.log(row(chalk.dim('Effect:')));
    wrapWords(card.effect, W - 2).forEach(l => console.log(row(chalk.white(l))));
  }
  if (card.trigger) {
    console.log(row(''));
    wrapWords(`[Trigger] ${card.trigger}`, W - 2).forEach(l => console.log(row(chalk.magentaBright(l))));
  }

  console.log(bot);

  if (card.img_full_url) {
    console.log(chalk.dim(`  Image: ${card.img_full_url.split('?')[0]}`));
  }
}

// ─── Cards table ─────────────────────────────────────────────────────────────
export function printCardsTable(cards) {
  const table = new Table({
    head: ['ID', 'Name', 'Category', 'Color(s)', 'Cost', 'Power', 'Rarity']
      .map(c => chalk.bold.yellowBright(c)),
    style: { border: ['dim'], head: [] },
    chars: TABLE_CHARS,
  });

  for (const c of cards) {
    table.push([
      chalk.dim(c.id),
      chalk.white(c.name || '—'),
      c.category === 'Leader' ? chalk.yellowBright('Leader') : chalk.dim(c.category || '—'),
      colorsTag(c.colors),
      c.cost != null ? chalk.bold(c.cost) : chalk.dim('—'),
      c.power != null ? chalk.bold(c.power) : chalk.dim('—'),
      rarityTag(c.rarity),
    ]);
  }
  console.log(table.toString());
}

// ─── Sets table ──────────────────────────────────────────────────────────────
export function printSetsTable(packs) {
  const table = new Table({
    head: ['Code', 'Name', 'Type'].map(c => chalk.bold.yellowBright(c)),
    style: { border: ['dim'], head: [] },
    chars: TABLE_CHARS,
  });

  for (const pack of Object.values(packs)) {
    const label = pack.title_parts?.label || '—';
    const title = pack.title_parts?.title || pack.raw_title || '—';
    const prefix = pack.title_parts?.prefix || '—';
    table.push([chalk.bold.white(label), chalk.white(title), chalk.dim(prefix)]);
  }
  console.log(table.toString());
}

// ─── Anime characters ────────────────────────────────────────────────────────
export function printCharactersTable(chars) {
  const table = new Table({
    head: ['Name', 'Status', 'Age', 'Height', 'Highest Bounty (฿)'].map(c => chalk.bold.redBright(c)),
    style: { border: ['dim'], head: [] },
    chars: TABLE_CHARS,
  });

  const sorted = [...chars].sort((a, b) => {
    const aMax = Math.max(...(a.bounties || []).map(x => x.amount), 0);
    const bMax = Math.max(...(b.bounties || []).map(x => x.amount), 0);
    return bMax - aMax;
  });

  for (const c of sorted) {
    const maxBounty = Math.max(...(c.bounties || []).map(x => x.amount), 0);
    const statusStr = c.status === 'Alive' ? chalk.green(c.status)
      : c.status === 'Deceased' ? chalk.red(c.status)
      : chalk.dim(c.status || '?');
    table.push([
      chalk.bold.white(c.name?.en || '?'),
      statusStr,
      c.age ? chalk.white(c.age) : chalk.dim('?'),
      c.height ? chalk.white(c.height + ' cm') : chalk.dim('?'),
      maxBounty > 0 ? chalk.yellowBright(fmtBounty(maxBounty)) : chalk.dim('?'),
    ]);
  }
  console.log(table.toString());
}

export function printCharacter(char) {
  const W = 52;
  const top = chalk.dim('╭' + '─'.repeat(W) + '╮');
  const bot = chalk.dim('╰' + '─'.repeat(W) + '╯');
  const side = chalk.dim('│');
  const row = (content) => {
    const plain = stripAnsi(content);
    const pad = Math.max(0, W - plain.length);
    return `${side} ${content}${' '.repeat(pad)} ${side}`;
  };

  const bounties = char.bounties || [];
  const maxBounty = Math.max(...bounties.map(x => x.amount), 0);

  console.log(top);
  console.log(row(chalk.bold.redBright(char.name?.en || '?')));
  if (char.name?.romaji) console.log(row(chalk.dim(char.name.romaji)));
  console.log(row(chalk.dim('─'.repeat(W))));

  const status = char.status === 'Alive' ? chalk.green(char.status)
    : char.status === 'Deceased' ? chalk.red(char.status)
    : chalk.dim(char.status || '?');

  console.log(row(`${chalk.dim('Status:')}     ${status}`));
  if (char.age)        console.log(row(`${chalk.dim('Age:')}        ${chalk.white(char.age)}`));
  if (char.height)     console.log(row(`${chalk.dim('Height:')}     ${chalk.white(char.height + ' cm')}`));
  if (char.blood_type) console.log(row(`${chalk.dim('Blood Type:')} ${chalk.white(char.blood_type)}`));
  if (maxBounty > 0) {
    console.log(row(`${chalk.dim('Bounty:')}     ${chalk.bold.yellowBright('฿' + fmtBounty(maxBounty))}`));
  }
  console.log(bot);
}

// ─── Devil fruits table ──────────────────────────────────────────────────────
export function printDevilFruitsTable(fruits) {
  const table = new Table({
    head: ['Name', 'Romaji', 'Type', 'Sub-type', 'Model'].map(c => chalk.bold.redBright(c)),
    style: { border: ['dim'], head: [] },
    chars: TABLE_CHARS,
  });

  const typeColor = { Logia: chalk.yellowBright, Zoan: chalk.greenBright, Paramecia: chalk.cyanBright };

  for (const f of fruits) {
    const colorFn = typeColor[f.type] || chalk.white;
    table.push([
      chalk.bold.white(f.name?.en || '?'),
      chalk.dim(f.name?.romaji || '?'),
      colorFn(f.type || '?'),
      f.sub_type ? chalk.magenta(f.sub_type) : chalk.dim('—'),
      f.model?.en ? chalk.white(f.model.en) : chalk.dim('—'),
    ]);
  }
  console.log(table.toString());
}

// ─── Shared UI ───────────────────────────────────────────────────────────────
export function printHeader(title) {
  console.log(chalk.bold.yellowBright(`⚓ ${title}`));
  console.log(chalk.dim('─'.repeat(60)));
}

export function printError(msg) {
  console.error(chalk.red(`✗ ${msg}`));
}

export function printInfo(msg) {
  process.stderr.write(chalk.dim(msg + '\n'));
}

// ─── Private helpers ─────────────────────────────────────────────────────────
function fmtBounty(n) {
  if (!n) return '—';
  if (n >= 1e9) return `${(n / 1e9).toFixed(0)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return String(n);
}
