import { input, select } from '@inquirer/prompts';
import { getByNameIndex, getCardsIndex, getCardById } from '../utils/api.js';
import { printCard, printCardsTable, printHeader, printInfo, printError } from '../utils/display.js';
import chalk from 'chalk';

export async function searchCommand() {
  printHeader('One Piece TCG — Search');
  console.log('');

  let keepSearching = true;

  while (keepSearching) {
    // Step 1: pick search mode
    const mode = await select({
      message: 'What would you like to search by?',
      choices: [
        { name: 'Character / card name', value: 'name' },
        { name: 'Card ID  (e.g. OP01-001)', value: 'id' },
        { name: chalk.dim('Quit'), value: 'quit' },
      ],
    });

    if (mode === 'quit') break;

    // Step 2: get query
    const query = await input({
      message: mode === 'id' ? 'Enter card ID:' : 'Enter name:',
      validate: (v) => v.trim().length > 0 || 'Please enter a value',
    });

    console.log('');
    printInfo('Searching...');

    try {
      if (mode === 'id') {
        // Direct ID lookup
        const card = await getCardById(query.trim().toUpperCase());
        if (!card) {
          printError(`Card "${query.toUpperCase()}" not found.`);
        } else {
          console.log('');
          await printCard(card, {});
        }
      } else {
        // Name search
        const nameIndex = await getByNameIndex();
        const cardsIndex = await getCardsIndex();
        const normalized = query.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

        const exactIds = nameIndex[normalized] || [];
        const partialKeys = Object.keys(nameIndex).filter(
          k => k !== normalized && k.includes(normalized)
        );
        const partialIds = partialKeys.flatMap(k => nameIndex[k]);
        const allIds = [...new Set([...exactIds, ...partialIds])];

        if (!allIds.length) {
          printError(`No cards found matching "${query}".`);
        } else {
          // Dedupe alt arts
          const seen = new Set();
          const deduped = allIds.filter(id => {
            const base = id.replace(/_.*$/, '');
            if (seen.has(base)) return false;
            seen.add(base);
            return true;
          });

          const results = deduped.map(id => ({ id, ...cardsIndex[id] })).filter(Boolean);
          results.sort((a, b) => a.id.localeCompare(b.id));

          console.log('');
          printHeader(`${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`);
          console.log('');
          printCardsTable(results);
          console.log('');
          console.log(chalk.dim(`  Run ${chalk.white('op card <id> -i lg')} to see card art`));
        }
      }
    } catch (err) {
      printError(`Search error: ${err.message}`);
    }

    console.log('');

    // Step 3: search again?
    const again = await select({
      message: 'What next?',
      choices: [
        { name: 'Search again', value: true },
        { name: chalk.dim('Quit'), value: false },
      ],
    });

    keepSearching = again;
    if (keepSearching) console.log('');
  }

  console.log(chalk.dim('\nFairwell!'));
}
