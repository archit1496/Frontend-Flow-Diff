#!/usr/bin/env node
/**
 * Milestone 1: Single-file CLI for behavioral diff.
 * Usage: node out/cli.js <before-file> <after-file>
 * Or: npm run cli -- before.tsx after.tsx
 */

import * as fs from 'fs';
import * as path from 'path';
import { parseToSnapshot, computeBehavioralDiff } from './analysis';
import type { BehavioralDiff } from './analysis';

function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node cli.js <before-file> <after-file>');
    process.exit(1);
  }
  const [beforePath, afterPath] = args;
  if (!fs.existsSync(beforePath)) {
    console.error('File not found:', beforePath);
    process.exit(1);
  }
  if (!fs.existsSync(afterPath)) {
    console.error('File not found:', afterPath);
    process.exit(1);
  }

  const beforeSource = fs.readFileSync(beforePath, 'utf-8');
  const afterSource = fs.readFileSync(afterPath, 'utf-8');
  const filename = path.basename(afterPath);

  const before = parseToSnapshot(beforeSource, filename);
  const after = parseToSnapshot(afterSource, filename);
  const diff: BehavioralDiff = computeBehavioralDiff(before, after);

  // Textual summary to stdout
  const lines: string[] = [
    '# Behavioral diff',
    '',
    '## Navigation',
    ...(diff.routes.added.length ? diff.routes.added.map((r) => `- Added: ${r.kind} → ${r.path}`) : []),
    ...(diff.routes.removed.length ? diff.routes.removed.map((r) => `- Removed: ${r.kind} → ${r.path}`) : []),
    ...(diff.routes.changed.length
      ? diff.routes.changed.map((r) => `- Changed: ${r.before.path} → ${r.after.path}`)
      : []),
    ...(diff.routes.added.length || diff.routes.removed.length || diff.routes.changed.length ? [] : ['- No changes']),
    '',
    '## API interactions',
    ...(diff.apiCalls.added.length ? diff.apiCalls.added.map((a) => `- Added: ${a.method} ${a.path}`) : []),
    ...(diff.apiCalls.removed.length ? diff.apiCalls.removed.map((a) => `- Removed: ${a.method} ${a.path}`) : []),
    ...(diff.apiCalls.changed.length
      ? diff.apiCalls.changed.map((a) => `- Changed: ${a.before.path} → ${a.after.path}`)
      : []),
    ...(diff.apiCalls.added.length || diff.apiCalls.removed.length || diff.apiCalls.changed.length ? [] : ['- No changes']),
    '',
    '## UI states',
    ...(diff.uiStates.added.length ? diff.uiStates.added.map((s) => `- Added: ${s.label ?? s.condition}`) : []),
    ...(diff.uiStates.removed.length ? diff.uiStates.removed.map((s) => `- Removed: ${s.label ?? s.condition}`) : []),
    ...(diff.uiStates.changed.length
      ? diff.uiStates.changed.map((s) => `- Changed: ${s.before.condition} → ${s.after.condition}`)
      : []),
    ...(diff.uiStates.added.length || diff.uiStates.removed.length || diff.uiStates.changed.length ? [] : ['- No changes']),
    '',
    '## Copy',
    ...(diff.copy.added.length ? diff.copy.added.map((c) => `- Added: "${c.text}"`) : []),
    ...(diff.copy.removed.length ? diff.copy.removed.map((c) => `- Removed: "${c.text}"`) : []),
    ...(diff.copy.changed.length ? diff.copy.changed.map((c) => `- "${c.before.text}" → "${c.after.text}"`) : []),
    ...(diff.copy.added.length || diff.copy.removed.length || diff.copy.changed.length ? [] : ['- No changes']),
  ];
  console.log(lines.join('\n'));
}

main();
