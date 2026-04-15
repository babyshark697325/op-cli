import { getCardById, searchCardsByName } from '../utils/api.js';
import {
  printCard,
  printCardImage,
  printCardsTable,
  printError,
  printInfo,
  printHeader,
} from '../utils/display.js';
import chalk from 'chalk';

// Detect if input looks like a card ID (e.g., OP01-001, ST01-002, P-001)
function isCardId(input) {
  return /^[A-Za-z]{1,5}\d{0,2}-\d{3}/.test(input) || /^P-\d+/.test(input);
}

export async function cardCommand(input, opts) {
  if (!input) {
    printError('Please provide a card name or ID.');
    console.log(chalk.dim('  Usage: op card <name|id>'));
    console.log(chalk.dim('  Examples:'));
    console.log(chalk.dim('    op card luffy'));
    console.log(chalk.dim('    op card OP01-001'));
    process.exit(1);
  }

  if (isCardId(input)) {
    // Direct lookup by card ID
    printInfo(`Fetching card ${input.toUpperCase()}...`);
    try {
      const card = await getCardById(input.toUpperCase());
      if (!card) {
        printError(`Card "${input.toUpperCase()}" not found.`);
        process.exit(1);
      }
      console.log('');
      if (opts.image) await printCardImage(card);
      printCard(card);
    } catch (err) {
      printError(`Failed to fetch card: ${err.message}`);
      process.exit(1);
    }
    return;
  }

  // Name search
  printInfo(`Searching for "${input}"...`);
  let results;
  try {
    results = await searchCardsByName(input);
  } catch (err) {
    printError(`Search failed: ${err.message}`);
    process.exit(1);
  }

  if (results.length === 0) {
    printError(`No cards found matching "${input}".`);
    console.log(chalk.dim('  Tip: Try a partial name, e.g. "luffy" or "zoro"'));
    process.exit(1);
  }

  // Filter by color if provided
  if (opts.color) {
    const col = opts.color.charAt(0).toUpperCase() + opts.color.slice(1).toLowerCase();
    results = results.filter(c => c.colors?.includes(col));
    if (results.length === 0) {
      printError(`No ${col} cards found for "${input}".`);
      process.exit(1);
    }
  }

  // Filter by type if provided
  if (opts.type) {
    results = results.filter(c =>
      c.category?.toLowerCase() === opts.type.toLowerCase()
    );
    if (results.length === 0) {
      printError(`No cards of type "${opts.type}" found for "${input}".`);
      process.exit(1);
    }
  }

  // Sort by set order
  results.sort((a, b) => a.id.localeCompare(b.id));

  // Remove alt arts by default unless --all flag
  if (!opts.all) {
    const seen = new Set();
    results = results.filter(c => {
      const base = c.id.replace(/_.*$/, '');
      if (seen.has(base)) return false;
      seen.add(base);
      return true;
    });
  }

  if (opts.detail && results.length === 1) {
    // Show full detail for single result
    const fullCard = await getCardById(results[0].id);
    if (fullCard) {
      console.log('');
      if (opts.image) await printCardImage(fullCard);
      printCard(fullCard);
      return;
    }
  }

  console.log('');
  printHeader(`${results.length} card${results.length !== 1 ? 's' : ''} found for "${input}"`);
  console.log('');
  printCardsTable(results);
  console.log('');
  console.log(chalk.dim(`  Run ${chalk.white('op card <card-id>')} for full card details`));
  console.log(chalk.dim(`  e.g. ${chalk.white('op card ' + results[0].id)}`));

  if (opts.all) {
    console.log(chalk.dim(`  Showing all variants (including alt arts)`));
  } else {
    const total = (await searchCardsByName(input)).length;
    if (total > results.length) {
      console.log(chalk.dim(`  Use ${chalk.white('--all')} to see all ${total} variants (including alt arts)`));
    }
  }
}
