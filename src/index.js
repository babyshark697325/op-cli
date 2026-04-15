#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { cardCommand } from './commands/card.js';
import { setCommand, setsCommand } from './commands/set.js';
import { characterCommand, devilFruitCommand } from './commands/character.js';

const program = new Command();

program
  .name('op')
  .description(chalk.bold.redBright('⚓ op-cli') + chalk.dim(' — One Piece TCG & Anime CLI'))
  .version('1.0.0', '-v, --version')
  .addHelpText('after', `
${chalk.bold('Examples:')}
  ${chalk.dim('$')} op card luffy               ${chalk.dim('# list all Luffy TCG cards')}
  ${chalk.dim('$')} op card OP01-001 --image    ${chalk.dim('# show card art + details')}
  ${chalk.dim('$')} op set OP01                 ${chalk.dim('# browse Romance Dawn set')}
  ${chalk.dim('$')} op sets                     ${chalk.dim('# list all sets & starter decks')}
  ${chalk.dim('$')} op character                ${chalk.dim('# list anime characters + bounties')}
  ${chalk.dim('$')} op devil-fruit              ${chalk.dim('# list devil fruits')}
`);

// card command
program
  .command('card [input]')
  .description('Look up TCG cards by name or card ID')
  .option('-c, --color <color>', 'filter by color (Red, Blue, Green, Purple, Black, Yellow)')
  .option('-t, --type <type>', 'filter by category (Leader, Character, Event, Stage, DON!!)')
  .option('-a, --all', 'show all variants including alt arts')
  .option('-i, --image', 'show card art in the terminal')
  .addHelpText('after', `
${chalk.bold('Examples:')}
  ${chalk.dim('$')} op card luffy
  ${chalk.dim('$')} op card zoro --color green
  ${chalk.dim('$')} op card OP01-001
  ${chalk.dim('$')} op card shanks --type Leader
`)
  .action(async (input, opts) => {
    await cardCommand(input, opts);
  });

// set command
program
  .command('set [code]')
  .description('Browse cards in a specific set (e.g. OP01, ST01)')
  .option('-c, --color <color>', 'filter by color')
  .option('-t, --type <type>', 'filter by category')
  .option('-a, --all', 'show all variants including alt arts')
  .addHelpText('after', `
${chalk.bold('Examples:')}
  ${chalk.dim('$')} op set OP01
  ${chalk.dim('$')} op set OP01 --color Red
  ${chalk.dim('$')} op set ST01 --type Leader
`)
  .action(async (code, opts) => {
    await setCommand(code, opts);
  });

// sets command
program
  .command('sets')
  .description('List all available One Piece TCG sets and starter decks')
  .action(async () => {
    await setsCommand();
  });

// character command
program
  .command('character [name]')
  .alias('char')
  .description('Look up One Piece anime characters and their bounties')
  .addHelpText('after', `
${chalk.bold('Examples:')}
  ${chalk.dim('$')} op character
  ${chalk.dim('$')} op character luffy
  ${chalk.dim('$')} op char zoro
`)
  .action(async (name) => {
    await characterCommand(name);
  });

// devil-fruit command
program
  .command('devil-fruit [name]')
  .alias('df')
  .description('Look up One Piece devil fruits')
  .addHelpText('after', `
${chalk.bold('Examples:')}
  ${chalk.dim('$')} op devil-fruit
  ${chalk.dim('$')} op devil-fruit gomu
  ${chalk.dim('$')} op df hito
`)
  .action(async (name) => {
    await devilFruitCommand(name);
  });

program.parse(process.argv);
