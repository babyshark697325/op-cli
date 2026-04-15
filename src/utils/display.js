import chalk from 'chalk';
import Table from 'cli-table3';
import terminalImage from 'terminal-image';

// One Piece TCG color theming
const COLOR_MAP = {
  Red: chalk.redBright,
  Blue: chalk.cyanBright,
  Green: chalk.greenBright,
  Purple: chalk.magentaBright,
  Black: chalk.gray,
  Yellow: chalk.yellowBright,
};

const RARITY_MAP = {
  Leader: chalk.bold.yellowBright,
  Common: chalk.white,
  Uncommon: chalk.green,
  Rare: chalk.blueBright,
  'Super Rare': chalk.magentaBright,
  'Secret Rare': chalk.bold.redBright,
  'Special Card': chalk.bold.yellow,
  Promo: chalk.bold.cyan,
  Leader_: chalk.bold.yellowBright,
};

export function colorizeCardColors(colors) {
  if (!colors || colors.length === 0) return chalk.gray('—');
  return colors.map(c => {
    const fn = COLOR_MAP[c] || chalk.white;
    return fn(`●${c}`);
  }).join(' ');
}

export function colorizeRarity(rarity) {
  const fn = RARITY_MAP[rarity] || chalk.white;
  return fn(rarity || '—');
}

export function formatBerry(amount) {
  if (!amount) return '—';
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(0)}B`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(0)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return amount.toString();
}

export async function printCardImage(card) {
  const url = card.img_full_url;
  if (!url) {
    console.log(chalk.dim('  (no image available)'));
    return;
  }
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://en.onepiece-cardgame.com/',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const img = await terminalImage.buffer(buf, { width: 32, preserveAspectRatio: true });
    process.stdout.write(img);
    console.log('');
  } catch (err) {
    console.log(chalk.dim(`  (image unavailable: ${err.message})`));
  }
}

export function printCard(card) {
  const width = 56;
  const line = chalk.dim('─'.repeat(width));
  const top = chalk.dim('╭' + '─'.repeat(width) + '╮');
  const bot = chalk.dim('╰' + '─'.repeat(width) + '╯');
  const side = chalk.dim('│');

  const row = (left, right = '') => {
    const content = right ? `${left}${right}` : left;
    const padded = content.padEnd(width);
    return `${side} ${padded} ${side}`;
  };

  const categoryColor = card.category === 'Leader' ? chalk.bold.yellowBright
    : card.category === 'Event' ? chalk.bold.magenta
    : chalk.bold.white;

  // Header row: card id + name + category
  const idStr = chalk.dim(card.id || '');
  const nameStr = chalk.bold.white(card.name || 'Unknown');
  const catStr = categoryColor(`[${card.category || '?'}]`);
  const headerLeft = `${idStr}  ${nameStr}  `;
  const headerRight = catStr;

  // Colors row
  const colorsStr = colorizeCardColors(card.colors);
  const rarityStr = colorizeRarity(card.rarity);

  // Cost / Power / Counter
  const costStr = card.cost != null ? chalk.white(`Cost: ${chalk.bold(card.cost)}`) : '';
  const powerStr = card.power != null ? chalk.white(`Power: ${chalk.bold(card.power)}`) : '';
  const counterStr = card.counter != null ? chalk.white(`Counter: ${chalk.bold('+' + card.counter)}`) : '';

  const statsArr = [costStr, powerStr, counterStr].filter(Boolean);

  // Types
  const typesStr = card.types?.length
    ? chalk.cyan(card.types.join(', '))
    : null;

  // Attributes
  const attrsStr = card.attributes?.length
    ? chalk.yellow(card.attributes.join(', '))
    : null;

  // Effect (word-wrap at width-2)
  const effectLines = wrapText(card.effect || '', width - 2);
  const triggerLines = card.trigger ? wrapText(`[Trigger] ${card.trigger}`, width - 2) : [];

  console.log(top);
  console.log(row(`${idStr}  ${nameStr}  ${catStr}`));
  console.log(row(chalk.dim(line)));
  console.log(row(`${colorsStr}   ${rarityStr}`));
  if (statsArr.length) console.log(row(statsArr.join('  ')));
  if (typesStr) console.log(row(`${chalk.dim('Types:')} ${typesStr}`));
  if (attrsStr) console.log(row(`${chalk.dim('Attribute:')} ${attrsStr}`));
  if (card.effect) {
    console.log(row(''));
    console.log(row(chalk.dim('Effect:')));
    effectLines.forEach(l => console.log(row(chalk.white(l))));
  }
  if (triggerLines.length) {
    console.log(row(''));
    triggerLines.forEach(l => console.log(row(chalk.magenta(l))));
  }
  console.log(bot);
}

export function printCardsTable(cards, { showSet = false } = {}) {
  const cols = showSet
    ? ['ID', 'Name', 'Category', 'Color(s)', 'Cost', 'Power', 'Rarity']
    : ['ID', 'Name', 'Category', 'Color(s)', 'Cost', 'Power', 'Rarity'];

  const table = new Table({
    head: cols.map(c => chalk.bold.yellowBright(c)),
    style: { border: ['dim'], head: [] },
    chars: {
      top: '─', 'top-mid': '┬', 'top-left': '╭', 'top-right': '╮',
      bottom: '─', 'bottom-mid': '┴', 'bottom-left': '╰', 'bottom-right': '╯',
      left: '│', 'left-mid': '├', mid: '─', 'mid-mid': '┼',
      right: '│', 'right-mid': '┤', middle: '│',
    },
  });

  for (const card of cards) {
    table.push([
      chalk.dim(card.id),
      chalk.white(card.name || '—'),
      card.category === 'Leader' ? chalk.yellowBright('Leader') : chalk.gray(card.category || '—'),
      colorizeCardColors(card.colors),
      card.cost != null ? chalk.bold(card.cost) : chalk.dim('—'),
      card.power != null ? chalk.bold(card.power) : chalk.dim('—'),
      colorizeRarity(card.rarity),
    ]);
  }

  console.log(table.toString());
}

export function printSetsTable(packs) {
  const table = new Table({
    head: ['Code', 'Name', 'Type'].map(c => chalk.bold.yellowBright(c)),
    style: { border: ['dim'], head: [] },
    chars: {
      top: '─', 'top-mid': '┬', 'top-left': '╭', 'top-right': '╮',
      bottom: '─', 'bottom-mid': '┴', 'bottom-left': '╰', 'bottom-right': '╯',
      left: '│', 'left-mid': '├', mid: '─', 'mid-mid': '┼',
      right: '│', 'right-mid': '┤', middle: '│',
    },
  });

  for (const [, pack] of Object.entries(packs)) {
    const label = pack.title_parts?.label || '—';
    const title = pack.title_parts?.title || pack.raw_title || '—';
    const prefix = pack.title_parts?.prefix || '—';
    table.push([
      chalk.bold.white(label),
      chalk.white(title),
      chalk.dim(prefix),
    ]);
  }

  console.log(table.toString());
}

export function printAnimeCharacter(char) {
  const width = 52;
  const top = chalk.dim('╭' + '─'.repeat(width) + '╮');
  const bot = chalk.dim('╰' + '─'.repeat(width) + '╯');
  const side = chalk.dim('│');
  const row = (content) => `${side} ${content.padEnd(width)} ${side}`;

  const name = char.name?.en || '?';
  const status = char.status === 'Alive' ? chalk.green(char.status) : chalk.red(char.status || '?');
  const bounties = char.bounties || [];
  const activeBounty = bounties.find(b => b.is_active);
  const maxBounty = bounties.reduce((max, b) => b.amount > max ? b.amount : max, 0);

  console.log(top);
  console.log(row(chalk.bold.redBright(name)));
  console.log(row(chalk.dim('─'.repeat(width))));
  console.log(row(`${chalk.dim('Status:')} ${status}`));
  if (char.age) console.log(row(`${chalk.dim('Age:')} ${chalk.white(char.age)}`));
  if (char.height) console.log(row(`${chalk.dim('Height:')} ${chalk.white(char.height + ' cm')}`));
  if (char.blood_type) console.log(row(`${chalk.dim('Blood Type:')} ${chalk.white(char.blood_type)}`));
  if (maxBounty > 0) {
    const berryStr = formatBountyAmount(maxBounty);
    const label = activeBounty ? 'Bounty (active):' : 'Bounty (highest):';
    console.log(row(`${chalk.dim(label)} ${chalk.bold.yellowBright('฿' + berryStr)}`));
  }
  console.log(bot);
}

export function printAnimeCharactersTable(chars) {
  const table = new Table({
    head: ['Name', 'Status', 'Age', 'Height', 'Bounty (฿)'].map(c => chalk.bold.redBright(c)),
    style: { border: ['dim'], head: [] },
    chars: {
      top: '─', 'top-mid': '┬', 'top-left': '╭', 'top-right': '╮',
      bottom: '─', 'bottom-mid': '┴', 'bottom-left': '╰', 'bottom-right': '╯',
      left: '│', 'left-mid': '├', mid: '─', 'mid-mid': '┼',
      right: '│', 'right-mid': '┤', middle: '│',
    },
  });

  const sorted = [...chars].sort((a, b) => {
    const aMax = Math.max(...(a.bounties || []).map(x => x.amount), 0);
    const bMax = Math.max(...(b.bounties || []).map(x => x.amount), 0);
    return bMax - aMax;
  });

  for (const char of sorted) {
    const maxBounty = Math.max(...(char.bounties || []).map(x => x.amount), 0);
    const statusStr = char.status === 'Alive' ? chalk.green('Alive') : chalk.red(char.status || '?');
    table.push([
      chalk.bold.white(char.name?.en || '?'),
      statusStr,
      char.age ? chalk.white(char.age) : chalk.dim('?'),
      char.height ? chalk.white(char.height + ' cm') : chalk.dim('?'),
      maxBounty > 0 ? chalk.yellowBright(formatBountyAmount(maxBounty)) : chalk.dim('?'),
    ]);
  }

  console.log(table.toString());
}

function formatBountyAmount(amount) {
  if (!amount) return '—';
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(0)}B`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(0)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return amount.toString();
}

function wrapText(text, maxWidth) {
  if (!text) return [];
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    const stripped = stripAnsi(current + (current ? ' ' : '') + word);
    if (stripped.length > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function stripAnsi(str) {
  return str.replace(/\x1B\[[0-9;]*m/g, '');
}

export function printError(msg) {
  console.error(chalk.red(`✗ ${msg}`));
}

export function printInfo(msg) {
  console.log(chalk.dim(msg));
}

export function printHeader(title) {
  const width = 56;
  console.log(chalk.bold.yellowBright('⚓ ' + title));
  console.log(chalk.dim('─'.repeat(width)));
}
