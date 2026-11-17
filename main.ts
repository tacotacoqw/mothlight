// Mothlight's entry for make.fun's best-game-01 bounty (Node 22, standard library only).
//
// The game itself is the static site under game/ (open game/index.html through any static
// server: `node serve.ts`). This program only hands it in: it copies game/ and screenshots/
// to the output directory and writes dossier.json there with make.fun's own library, so the
// judge reads exactly the files in this repository.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The bounty scorer's caps, as its rules publish them.
const SCORER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

const repositoryDir = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function requireDirectory(name: string): string {
  const path = join(repositoryDir, name);
  if (!existsSync(path) || !statSync(path).isDirectory()) {
    throw new Error(`Mothlight hand-in: ${name}/ is missing from the repository`);
  }
  return path;
}

// Copies one of the repository's directories into the output, in sorted order so two runs match.
function handIn(name: string): number {
  const from = requireDirectory(name);
  const to = join(outputDir, name);
  mkdirSync(to, { recursive: true });
  const isHidden = (path: string) => basename(path).startsWith('.');
  const entries = readdirSync(from).filter((entry) => !isHidden(entry)).sort();
  for (const entry of entries) {
    // Hidden files (an editor's or the desktop's droppings) are never part of the game.
    cpSync(join(from, entry), join(to, entry), { recursive: true, filter: (source) => !isHidden(source) });
  }
  return entries.length;
}

mkdirSync(outputDir, { recursive: true });
const gameEntries = handIn('game');
const screenshotCount = handIn('screenshots');
if (screenshotCount < 3 || screenshotCount > SCORER_CAPS.screenshots.max) {
  throw new Error(`Mothlight hand-in: screenshots/ holds ${screenshotCount} images, the bounty takes 3 or 4`);
}

const dossier = buildDossier(outputDir, SCORER_CAPS);
writeFileSync(join(outputDir, 'dossier.json'), dossier);
console.log(`Mothlight handed in: ${gameEntries} entries of game/, ${screenshotCount} screenshots, dossier ${dossier.length} bytes`);
