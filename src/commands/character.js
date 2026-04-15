import { getAnimeCharacters, getAnimeDevilFruits } from '../utils/api.js';
import {
  printAnimeCharacter,
  printAnimeCharactersTable,
  printError,
  printInfo,
  printHeader,
} from '../utils/display.js';
import chalk from 'chalk';

export async function characterCommand(name) {
  printInfo('Fetching characters...');

  let chars;
  try {
    chars = await getAnimeCharacters();
  } catch (err) {
    printError(`Failed to fetch characters: ${err.message}`);
    process.exit(1);
  }

  if (!name) {
    console.log('');
    printHeader('One Piece — Characters');
    console.log('');
    printAnimeCharactersTable(chars);
    console.log('');
    console.log(chalk.dim(`  Run ${chalk.white('op character <name>')} for details`));
    return;
  }

  const query = name.toLowerCase();
  const match = chars.find(c =>
    c.name?.en?.toLowerCase().includes(query) ||
    c.name?.romaji?.toLowerCase().includes(query)
  );

  if (!match) {
    printError(`Character "${name}" not found.`);
    console.log(chalk.dim('  Run "op character" to list all available characters.'));
    process.exit(1);
  }

  console.log('');
  printAnimeCharacter(match);
}

export async function devilFruitCommand(name) {
  printInfo('Fetching devil fruits...');

  let fruits;
  try {
    fruits = await getAnimeDevilFruits();
  } catch (err) {
    printError(`Failed to fetch devil fruits: ${err.message}`);
    process.exit(1);
  }

  if (!name) {
    console.log('');
    printHeader('One Piece — Devil Fruits');
    console.log('');

    const { default: Table } = await import('cli-table3');
    const table = new Table({
      head: ['Name', 'Type', 'Sub-type', 'Model'].map(c => chalk.bold.redBright(c)),
      style: { border: ['dim'], head: [] },
      chars: {
        top: '─', 'top-mid': '┬', 'top-left': '╭', 'top-right': '╮',
        bottom: '─', 'bottom-mid': '┴', 'bottom-left': '╰', 'bottom-right': '╯',
        left: '│', 'left-mid': '├', mid: '─', 'mid-mid': '┼',
        right: '│', 'right-mid': '┤', middle: '│',
      },
    });

    const typeColor = {
      Logia: chalk.yellowBright,
      Zoan: chalk.greenBright,
      Paramecia: chalk.cyanBright,
    };

    for (const fruit of fruits) {
      const colorFn = typeColor[fruit.type] || chalk.white;
      const subType = fruit.sub_type ? chalk.magenta(fruit.sub_type) : chalk.dim('—');
      const model = fruit.model?.en ? chalk.white(fruit.model.en) : chalk.dim('—');
      table.push([
        chalk.bold.white(fruit.name?.en || '?'),
        colorFn(fruit.type || '?'),
        subType,
        model,
      ]);
    }

    console.log(table.toString());
    console.log('');
    console.log(chalk.dim(`  Run ${chalk.white('op devil-fruit <name>')} for details`));
    return;
  }

  const query = name.toLowerCase();
  const match = fruits.find(f =>
    f.name?.en?.toLowerCase().includes(query) ||
    f.name?.romaji?.toLowerCase().includes(query)
  );

  if (!match) {
    printError(`Devil fruit "${name}" not found.`);
    console.log(chalk.dim('  Run "op devil-fruit" to list all available devil fruits.'));
    process.exit(1);
  }

  const width = 52;
  const top = chalk.dim('╭' + '─'.repeat(width) + '╮');
  const bot = chalk.dim('╰' + '─'.repeat(width) + '╯');
  const side = chalk.dim('│');
  const row = (content) => `${side} ${content.padEnd(width)} ${side}`;

  const typeColor = {
    Logia: chalk.yellowBright,
    Zoan: chalk.greenBright,
    Paramecia: chalk.cyanBright,
  };

  const colorFn = typeColor[match.type] || chalk.white;

  console.log('');
  console.log(top);
  console.log(row(chalk.bold.redBright(match.name?.en || '?')));
  if (match.name?.romaji) console.log(row(chalk.dim(match.name.romaji)));
  console.log(row(chalk.dim('─'.repeat(width))));
  console.log(row(`${chalk.dim('Type:')} ${colorFn(match.type || '?')}`));
  if (match.sub_type) console.log(row(`${chalk.dim('Sub-type:')} ${chalk.magenta(match.sub_type)}`));
  if (match.model?.en) console.log(row(`${chalk.dim('Model:')} ${chalk.white(match.model.en)}`));
  console.log(bot);
}
