import { getCardById, searchCardsByName } from '../utils/api.js';
import { printCard, printCardsTable, printError, printInfo, printHeader } from '../utils/display.js';
import { HALFBLOCK_SIZES } from '../utils/image.js';
import chalk from 'chalk';

const VALID_SIZES = Object.keys(HALFBLOCK_SIZES); // ['sm', 'md', 'lg']

function isCardId(input) {
  return /^[A-Za-z]{1,5}\d{0,2}-\d{3}/.test(input) || /^P-\d+/.test(input);
}

export async function cardCommand(input, opts) {
  if (!input) {
    printError('Please provide a card name or ID.');
    console.log(chalk.dim('  Usage: op card <name|id> [-i sm|md|lg]'));
    console.log(chalk.dim('  Examples:'));
    console.log(chalk.dim('    op card luffy'));
    console.log(chalk.dim('    op card OP01-001'));
    console.log(chalk.dim('    op card OP01-001 -i lg'));
    process.exit(1);
  }

  // Validate image size flag
  let imageSize = null;
  if (opts.image !== undefined) {
    const sz = typeof opts.image === 'string' ? opts.image.toLowerCase() : 'md';
    if (!VALID_SIZES.includes(sz)) {
      printError(`Invalid image size "${sz}". Use: sm, md, or lg`);
      process.exit(1);
    }
    imageSize = sz;
  }

  // ── Direct card ID lookup ──────────────────────────────────────────────────
  if (isCardId(input)) {
    printInfo(`Fetching card ${input.toUpperCase()}...`);
    let card;
    try {
      card = await getCardById(input.toUpperCase());
    } catch (err) {
      printError(`Failed to fetch card: ${err.message}`);
      process.exit(1);
    }
    if (!card) {
      printError(`Card "${input.toUpperCase()}" not found.`);
      process.exit(1);
    }
    console.log('');
    await printCard(card, { imageSize });
    return;
  }

  // ── Name search ────────────────────────────────────────────────────────────
  printInfo(`Searching for "${input}"...`);
  let results;
  try {
    results = await searchCardsByName(input);
  } catch (err) {
    printError(`Search failed: ${err.message}`);
    process.exit(1);
  }

  if (!results.length) {
    printError(`No cards found matching "${input}".`);
    console.log(chalk.dim('  Tip: try a partial name like "luffy" or "zoro"'));
    process.exit(1);
  }

  // Filters
  if (opts.color) {
    const col = opts.color[0].toUpperCase() + opts.color.slice(1).toLowerCase();
    results = results.filter(c => c.colors?.includes(col));
    if (!results.length) { printError(`No ${col} cards found for "${input}".`); process.exit(1); }
  }
  if (opts.type) {
    results = results.filter(c => c.category?.toLowerCase() === opts.type.toLowerCase());
    if (!results.length) { printError(`No "${opts.type}" cards found for "${input}".`); process.exit(1); }
  }

  // Sort & dedupe alt arts
  results.sort((a, b) => a.id.localeCompare(b.id));
  if (!opts.all) {
    const seen = new Set();
    results = results.filter(c => {
      const base = c.id.replace(/_.*$/, '');
      if (seen.has(base)) return false;
      seen.add(base);
      return true;
    });
  }

  // If exactly one result and image requested, show full card
  if (results.length === 1 && imageSize) {
    const full = await getCardById(results[0].id);
    if (full) { console.log(''); await printCard(full, { imageSize }); return; }
  }

  console.log('');
  printHeader(`${results.length} card${results.length !== 1 ? 's' : ''} found for "${input}"`);
  console.log('');
  printCardsTable(results);
  console.log('');
  console.log(chalk.dim(`  Run ${chalk.white('op card <id>')} to see full details`));
  console.log(chalk.dim(`  Run ${chalk.white('op card <id> -i lg')} to see full details + card art`));
  console.log(chalk.dim(`  e.g. ${chalk.white('op card ' + results[0].id + ' -i lg')}`));
}
