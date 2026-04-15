import { getCardsInSet, getPacks } from '../utils/api.js';
import { printCardsTable, printSetsTable, printError, printInfo, printHeader } from '../utils/display.js';
import chalk from 'chalk';

export async function setCommand(setCode, opts) {
  if (!setCode) {
    printError('Please provide a set code.');
    console.log(chalk.dim('  Usage: op set <code>'));
    console.log(chalk.dim('  Examples:'));
    console.log(chalk.dim('    op set OP01'));
    console.log(chalk.dim('    op set ST01'));
    process.exit(1);
  }

  printInfo(`Fetching cards in set ${setCode.toUpperCase()}...`);

  let cards;
  try {
    cards = await getCardsInSet(setCode);
  } catch (err) {
    printError(`Failed to fetch set: ${err.message}`);
    process.exit(1);
  }

  if (cards.length === 0) {
    printError(`No cards found in set "${setCode.toUpperCase()}".`);
    console.log(chalk.dim('  Run "op sets" to see all available sets.'));
    process.exit(1);
  }

  // Filter by color if provided
  if (opts.color) {
    const col = opts.color.charAt(0).toUpperCase() + opts.color.slice(1).toLowerCase();
    cards = cards.filter(c => c.colors?.includes(col));
    if (cards.length === 0) {
      printError(`No ${col} cards found in set "${setCode.toUpperCase()}".`);
      process.exit(1);
    }
  }

  // Filter by category/type
  if (opts.type) {
    cards = cards.filter(c =>
      c.category?.toLowerCase() === opts.type.toLowerCase()
    );
    if (cards.length === 0) {
      printError(`No "${opts.type}" cards found in set "${setCode.toUpperCase()}".`);
      process.exit(1);
    }
  }

  // Sort by card ID
  cards.sort((a, b) => a.id.localeCompare(b.id));

  // Remove alt arts by default
  if (!opts.all) {
    const seen = new Set();
    cards = cards.filter(c => {
      const base = c.id.replace(/_.*$/, '');
      if (seen.has(base)) return false;
      seen.add(base);
      return true;
    });
  }

  // Get set name from packs
  let setName = setCode.toUpperCase();
  try {
    const packs = await getPacks();
    const pack = Object.values(packs).find(
      p => p.title_parts?.label?.toUpperCase() === setCode.toUpperCase()
    );
    if (pack) setName = `${pack.title_parts?.title || pack.raw_title} [${setCode.toUpperCase()}]`;
  } catch {}

  console.log('');
  printHeader(setName);
  console.log(chalk.dim(`  ${cards.length} card${cards.length !== 1 ? 's' : ''}`));
  console.log('');
  printCardsTable(cards);
  console.log('');
  console.log(chalk.dim(`  Run ${chalk.white('op card <card-id>')} for full card details`));
}

export async function setsCommand() {
  printInfo('Fetching sets...');

  let packs;
  try {
    packs = await getPacks();
  } catch (err) {
    printError(`Failed to fetch sets: ${err.message}`);
    process.exit(1);
  }

  // Sort packs by label
  const sorted = Object.entries(packs).sort(([, a], [, b]) => {
    const la = a.title_parts?.label || '';
    const lb = b.title_parts?.label || '';
    return la.localeCompare(lb);
  });

  const sortedObj = Object.fromEntries(sorted);

  console.log('');
  printHeader('One Piece TCG — Sets & Starter Decks');
  console.log('');
  printSetsTable(sortedObj);
  console.log('');
  console.log(chalk.dim(`  Run ${chalk.white('op set <code>')} to browse cards in a set`));
  console.log(chalk.dim(`  e.g. ${chalk.white('op set OP01')}`));
}
