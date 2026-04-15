#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { cardCommand } from './commands/card.js';
import { setCommand, setsCommand } from './commands/set.js';
import { characterCommand, devilFruitCommand } from './commands/character.js';
import { searchCommand } from './commands/search.js';

const program = new Command();

program
  .name('op')
  .description(chalk.bold.redBright('⚓ op-cli') + chalk.dim(' — One Piece TCG & Anime CLI'))
  .version('1.0.0', '-v, --version')
  .addHelpText('after', `
${chalk.bold('Commands:')}
  ${chalk.yellowBright('card')}       Look up TCG cards by name or ID
  ${chalk.yellowBright('set')}        Browse cards in a set (e.g. OP01, ST01)
  ${chalk.yellowBright('sets')}       List all sets and starter decks
  ${chalk.yellowBright('search')}     Interactive card search
  ${chalk.yellowBright('character')}  One Piece anime character lookup
  ${chalk.yellowBright('devil-fruit')}  Devil fruit lookup

${chalk.bold('Examples:')}
  ${chalk.dim('$')} op card luffy
  ${chalk.dim('$')} op card OP01-001 -i lg
  ${chalk.dim('$')} op card shanks --type Leader
  ${chalk.dim('$')} op set OP01
  ${chalk.dim('$')} op sets
  ${chalk.dim('$')} op search
`);

// ── card ──────────────────────────────────────────────────────────────────────
program
  .command('card [input]')
  .description('Look up TCG cards by name or card ID')
  .option('-i, --image [size]', 'show card art in terminal (size: sm, md, lg)', 'md')
  .option('-c, --color <color>', 'filter by color: Red Blue Green Purple Black Yellow')
  .option('-t, --type <type>', 'filter by category: Leader Character Event Stage')
  .option('-a, --all', 'include alt arts and variants')
  .addHelpText('after', `
${chalk.bold('Examples:')}
  ${chalk.dim('$')} op card luffy              ${chalk.dim('# list all Luffy cards')}
  ${chalk.dim('$')} op card OP01-001 -i lg     ${chalk.dim('# card art at large size')}
  ${chalk.dim('$')} op card OP01-001 -i sm     ${chalk.dim('# card art at small size')}
  ${chalk.dim('$')} op card zoro --color Green
  ${chalk.dim('$')} op card shanks --type Leader
`)
  .action(async (input, opts) => {
    await cardCommand(input, opts);
  });

// ── set ───────────────────────────────────────────────────────────────────────
program
  .command('set [code]')
  .description('Browse cards in a specific set')
  .option('-c, --color <color>', 'filter by color')
  .option('-t, --type <type>', 'filter by category')
  .option('-a, --all', 'include alt arts and variants')
  .addHelpText('after', `
${chalk.bold('Examples:')}
  ${chalk.dim('$')} op set OP01
  ${chalk.dim('$')} op set OP01 --color Red
  ${chalk.dim('$')} op set ST01 --type Leader
`)
  .action(async (code, opts) => {
    await setCommand(code, opts);
  });

// ── sets ──────────────────────────────────────────────────────────────────────
program
  .command('sets')
  .description('List all One Piece TCG sets and starter decks')
  .action(async () => {
    await setsCommand();
  });

// ── search ────────────────────────────────────────────────────────────────────
program
  .command('search')
  .description('Interactive card search')
  .action(async () => {
    await searchCommand();
  });

// ── character ─────────────────────────────────────────────────────────────────
program
  .command('character [name]')
  .alias('char')
  .description('Look up One Piece characters and their bounties')
  .action(async (name) => {
    await characterCommand(name);
  });

// ── devil-fruit ───────────────────────────────────────────────────────────────
program
  .command('devil-fruit [name]')
  .alias('df')
  .description('Look up One Piece devil fruits')
  .action(async (name) => {
    await devilFruitCommand(name);
  });

program.parse(process.argv);
