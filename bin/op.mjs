#!/usr/bin/env node
// Force true color before any imports so chalk/terminal-image detect it correctly
process.env.FORCE_COLOR = '3';
await import('../src/index.js');
