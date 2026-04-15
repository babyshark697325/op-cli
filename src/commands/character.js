import { getAnimeCharacters, getAnimeDevilFruits } from '../utils/api.js';
import {
  printCharacter, printCharactersTable,
  printDevilFruitsTable,
  printHeader, printInfo, printError,
} from '../utils/display.js';
import chalk from 'chalk';

export async function characterCommand(name) {
  printInfo('Fetching characters...');
  let chars;
  try {
    chars = await getAnimeCharacters();
  } catch (err) {
    printError(`Failed to fetch characters: ${err.message}`); process.exit(1);
  }

  if (!name) {
    console.log('');
    printHeader('One Piece — Characters & Bounties');
    console.log('');
    printCharactersTable(chars);
    console.log('');
    console.log(chalk.dim(`  Run ${chalk.white('op character <name>')} for details`));
    return;
  }

  const q = name.toLowerCase();
  const match = chars.find(c =>
    c.name?.en?.toLowerCase().includes(q) ||
    c.name?.romaji?.toLowerCase().includes(q)
  );

  if (!match) {
    printError(`Character "${name}" not found.`);
    console.log(chalk.dim('  Run "op character" to list all characters.'));
    process.exit(1);
  }

  console.log('');
  printCharacter(match);
}

export async function devilFruitCommand(name) {
  printInfo('Fetching devil fruits...');
  let fruits;
  try {
    fruits = await getAnimeDevilFruits();
  } catch (err) {
    printError(`Failed to fetch devil fruits: ${err.message}`); process.exit(1);
  }

  if (!name) {
    console.log('');
    printHeader('One Piece — Devil Fruits');
    console.log('');
    printDevilFruitsTable(fruits);
    console.log('');
    console.log(chalk.dim(`  Run ${chalk.white('op devil-fruit <name>')} for details`));
    return;
  }

  const q = name.toLowerCase();
  const match = fruits.find(f =>
    f.name?.en?.toLowerCase().includes(q) ||
    f.name?.romaji?.toLowerCase().includes(q)
  );

  if (!match) {
    printError(`Devil fruit "${name}" not found.`);
    console.log(chalk.dim('  Run "op devil-fruit" to list all devil fruits.'));
    process.exit(1);
  }

  const W = 52;
  const top = chalk.dim('╭' + '─'.repeat(W) + '╮');
  const bot = chalk.dim('╰' + '─'.repeat(W) + '╯');
  const side = chalk.dim('│');
  const row = (content) => {
    const plain = content.replace(/\x1B\[[0-9;]*m/g, '');
    return `${side} ${content}${' '.repeat(Math.max(0, W - plain.length))} ${side}`;
  };
  const typeColor = { Logia: chalk.yellowBright, Zoan: chalk.greenBright, Paramecia: chalk.cyanBright };
  const colorFn = typeColor[match.type] || chalk.white;

  console.log('');
  console.log(top);
  console.log(row(chalk.bold.redBright(match.name?.en || '?')));
  if (match.name?.romaji) console.log(row(chalk.dim(match.name.romaji)));
  console.log(row(chalk.dim('─'.repeat(W))));
  console.log(row(`${chalk.dim('Type:')}     ${colorFn(match.type || '?')}`));
  if (match.sub_type) console.log(row(`${chalk.dim('Sub-type:')} ${chalk.magenta(match.sub_type)}`));
  if (match.model?.en) console.log(row(`${chalk.dim('Model:')}    ${chalk.white(match.model.en)}`));
  console.log(bot);
}
