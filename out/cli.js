#!/usr/bin/env node
"use strict";
/**
 * Milestone 1: Single-file CLI for behavioral diff.
 * Usage: node out/cli.js <before-file> <after-file>
 * Or: npm run cli -- before.tsx after.tsx
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const analysis_1 = require("./analysis");
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
    const before = (0, analysis_1.parseToSnapshot)(beforeSource, filename);
    const after = (0, analysis_1.parseToSnapshot)(afterSource, filename);
    const diff = (0, analysis_1.computeBehavioralDiff)(before, after);
    // Textual summary to stdout
    const lines = [
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
//# sourceMappingURL=cli.js.map