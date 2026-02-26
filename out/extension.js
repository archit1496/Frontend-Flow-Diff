"use strict";
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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const analysis_1 = require("./analysis");
const VIEW_TYPE = 'frontendFlowDiff.panel';
function getBeforeSource(uri) {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
    if (!workspaceFolder)
        return null;
    const rel = path.relative(workspaceFolder.uri.fsPath, uri.fsPath).replace(/\\/g, '/');
    try {
        return (0, child_process_1.execSync)(`git show "HEAD:${rel}"`, {
            encoding: 'utf-8',
            cwd: workspaceFolder.uri.fsPath,
        });
    }
    catch {
        return null;
    }
}
function getWebviewContent(diff, options) {
    const s = (arr) => (arr.length > 0 ? arr : null);
    const routesAdded = s(diff.routes.added);
    const routesRemoved = s(diff.routes.removed);
    const routesChanged = s(diff.routes.changed);
    const apiAdded = s(diff.apiCalls.added);
    const apiRemoved = s(diff.apiCalls.removed);
    const apiChanged = s(diff.apiCalls.changed);
    const statesAdded = s(diff.uiStates.added);
    const statesRemoved = s(diff.uiStates.removed);
    const statesChanged = s(diff.uiStates.changed);
    const copyAdded = options.includeCopy ? s(diff.copy.added) : null;
    const copyRemoved = options.includeCopy ? s(diff.copy.removed) : null;
    const copyChanged = options.includeCopy ? s(diff.copy.changed) : null;
    const hasAny = routesAdded || routesRemoved || routesChanged ||
        apiAdded || apiRemoved || apiChanged ||
        statesAdded || statesRemoved || statesChanged ||
        copyAdded || copyRemoved || copyChanged;
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Frontend Flow Diff</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      padding: 12px 16px;
      margin: 0;
      line-height: 1.5;
    }
    h2 {
      font-size: 1.1em;
      margin: 16px 0 8px;
      color: var(--vscode-textLink-foreground);
    }
    h2:first-child { margin-top: 0; }
    ul { margin: 0; padding-left: 20px; }
    li { margin: 4px 0; }
    .added { color: var(--vscode-editorGutter-addedBackground, #2ea043); }
    .removed { color: var(--vscode-editorGutter-deletedBackground, #f85149); }
    .changed { color: var(--vscode-inputValidation-warningBorder, #d29922); }
    .btn {
      display: inline-block;
      padding: 8px 14px;
      margin: 12px 8px 12px 0;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
    }
    .btn:hover { background: var(--vscode-button-hoverBackground); }
    .empty { color: var(--vscode-descriptionForeground); font-style: italic; }
    code { font-size: 0.95em; background: var(--vscode-textCodeBlock-background); padding: 1px 4px; border-radius: 3px; }
  </style>
</head>
<body>
  <button class="btn" id="copyBtn">Copy as Markdown (PR summary)</button>
  <div id="content">
    ${!hasAny
        ? '<p class="empty">No behavioral changes detected.</p>'
        : [
            (options.includeRoutes && (routesAdded || routesRemoved || routesChanged)) ? `
    <h2>Navigation</h2>
    <ul>
      ${routesAdded?.map((r) => `<li class="added">Added: ${r.kind} → <code>${escapeHtml(r.path)}</code></li>`).join('') ?? ''}
      ${routesRemoved?.map((r) => `<li class="removed">Removed: ${r.kind} → <code>${escapeHtml(r.path)}</code></li>`).join('') ?? ''}
      ${routesChanged?.map((r) => `<li class="changed"><code>${escapeHtml(r.before.path)}</code> → <code>${escapeHtml(r.after.path)}</code></li>`).join('') ?? ''}
    </ul>` : '',
            (options.includeApi && (apiAdded || apiRemoved || apiChanged)) ? `
    <h2>API interactions</h2>
    <ul>
      ${apiAdded?.map((a) => `<li class="added">Added: ${a.method} <code>${escapeHtml(a.path)}</code></li>`).join('') ?? ''}
      ${apiRemoved?.map((a) => `<li class="removed">Removed: ${a.method} <code>${escapeHtml(a.path)}</code></li>`).join('') ?? ''}
      ${apiChanged?.map((a) => `<li class="changed"><code>${escapeHtml(a.before.path)}</code> → <code>${escapeHtml(a.after.path)}</code></li>`).join('') ?? ''}
    </ul>` : '',
            (options.includeStates && (statesAdded || statesRemoved || statesChanged)) ? `
    <h2>UI states</h2>
    <ul>
      ${statesAdded?.map((s) => `<li class="added">Added: ${escapeHtml(s.label ?? s.condition)}</li>`).join('') ?? ''}
      ${statesRemoved?.map((s) => `<li class="removed">Removed: ${escapeHtml(s.label ?? s.condition)}</li>`).join('') ?? ''}
      ${statesChanged?.map((s) => `<li class="changed">${escapeHtml(s.before.condition)} → ${escapeHtml(s.after.condition)}</li>`).join('') ?? ''}
    </ul>` : '',
            (options.includeCopy && (copyAdded || copyRemoved || copyChanged)) ? `
    <h2>Copy</h2>
    <ul>
      ${copyAdded?.map((c) => `<li class="added">Added: "${escapeHtml(c.text)}"</li>`).join('') ?? ''}
      ${copyRemoved?.map((c) => `<li class="removed">Removed: "${escapeHtml(c.text)}"</li>`).join('') ?? ''}
      ${copyChanged?.map((c) => `<li class="changed">"${escapeHtml(c.before.text)}" → "${escapeHtml(c.after.text)}"</li>`).join('') ?? ''}
    </ul>` : '',
        ].join('')}
  </div>
  <script>
    const diff = ${JSON.stringify(diff)};
    const options = ${JSON.stringify(options)};
    document.getElementById('copyBtn').onclick = function() {
      const md = buildMarkdown(diff, options);
      navigator.clipboard.writeText(md).then(function() {
        this.textContent = 'Copied!';
        setTimeout(() => { this.textContent = 'Copy as Markdown (PR summary)'; }, 1500);
      }.bind(this));
    };
    function buildMarkdown(diff, opts) {
      const lines = ['## Behavioral summary', ''];
      if (opts.includeRoutes && (diff.routes.added.length || diff.routes.removed.length || diff.routes.changed.length)) {
        lines.push('### Navigation', '');
        diff.routes.added.forEach(r => lines.push('- **Added:** ' + r.kind + ' → \`' + r.path + '\`'));
        diff.routes.removed.forEach(r => lines.push('- **Removed:** ' + r.kind + ' → \`' + r.path + '\`'));
        diff.routes.changed.forEach(r => lines.push('- **Changed:** \`' + r.before.path + '\` → \`' + r.after.path + '\`'));
        lines.push('');
      }
      if (opts.includeApi && (diff.apiCalls.added.length || diff.apiCalls.removed.length || diff.apiCalls.changed.length)) {
        lines.push('### API interactions', '');
        diff.apiCalls.added.forEach(a => lines.push('- **Added:** ' + a.method + ' \`' + a.path + '\`'));
        diff.apiCalls.removed.forEach(a => lines.push('- **Removed:** ' + a.method + ' \`' + a.path + '\`'));
        diff.apiCalls.changed.forEach(a => lines.push('- **Changed:** \`' + a.before.path + '\` → \`' + a.after.path + '\`'));
        lines.push('');
      }
      if (opts.includeStates && (diff.uiStates.added.length || diff.uiStates.removed.length || diff.uiStates.changed.length)) {
        lines.push('### UI states', '');
        diff.uiStates.added.forEach(s => lines.push('- **Added:** ' + (s.label || s.condition)));
        diff.uiStates.removed.forEach(s => lines.push('- **Removed:** ' + (s.label || s.condition)));
        diff.uiStates.changed.forEach(s => lines.push('- **Changed:** ' + s.before.condition + ' → ' + s.after.condition));
        lines.push('');
      }
      if (opts.includeCopy && (diff.copy.added.length || diff.copy.removed.length || diff.copy.changed.length)) {
        lines.push('### Copy', '');
        diff.copy.added.forEach(c => lines.push('- **Added:** "' + c.text + '"'));
        diff.copy.removed.forEach(c => lines.push('- **Removed:** "' + c.text + '"'));
        diff.copy.changed.forEach(c => lines.push('- **Changed:** "' + c.before.text + '" → "' + c.after.text + '"'));
        lines.push('');
      }
      return lines.join('\\n');
    }
    function escapeHtml(s) {
      if (!s) return '';
      const div = document.createElement('div');
      div.textContent = s;
      return div.innerHTML;
    }
  </script>
</body>
</html>`;
}
function escapeHtml(s) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function activate(context) {
    function runDiff(beforeSource, afterSource, filename) {
        const before = (0, analysis_1.parseToSnapshot)(beforeSource, filename);
        const after = (0, analysis_1.parseToSnapshot)(afterSource, filename);
        const diff = (0, analysis_1.computeBehavioralDiff)(before, after);
        const config = vscode.workspace.getConfiguration('frontendFlowDiff');
        const options = {
            includeCopy: config.get('includeCopyChanges', true),
            includeApi: config.get('includeApiCalls', true),
            includeRoutes: config.get('includeRoutes', true),
            includeStates: config.get('includeUiStates', true),
        };
        const panel = vscode.window.createWebviewPanel(VIEW_TYPE, 'Frontend Flow Diff', vscode.ViewColumn.Beside, { enableScripts: true });
        panel.webview.html = getWebviewContent(diff, options);
    }
    const diffCurrentFile = vscode.commands.registerCommand('frontendFlowDiff.diffCurrentFile', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('Open a file first.');
            return;
        }
        const doc = editor.document;
        const filename = path.basename(doc.uri.fsPath);
        const afterSource = doc.getText();
        const beforeSource = getBeforeSource(doc.uri);
        if (beforeSource === null) {
            vscode.window.showErrorMessage('Could not get HEAD version. Is this file in a Git workspace and committed?');
            return;
        }
        runDiff(beforeSource, afterSource, filename);
    });
    const showFromDiffEditor = vscode.commands.registerCommand('frontendFlowDiff.showBehavioralDiffFromDiffEditor', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('Open a file or diff first.');
            return;
        }
        const doc = editor.document;
        const filename = path.basename(doc.uri.fsPath);
        const afterSource = doc.getText();
        const beforeSource = getBeforeSource(doc.uri);
        if (beforeSource === null) {
            vscode.window.showErrorMessage('Could not get HEAD version. Run from a Git workspace with the file committed, or use "Compare with HEAD" and then run this command.');
            return;
        }
        runDiff(beforeSource, afterSource, filename);
    });
    context.subscriptions.push(diffCurrentFile, showFromDiffEditor);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map