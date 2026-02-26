# Frontend Flow Diff

A VS Code extension that shows **how a change alters UI behavior** (states, routes, API calls, copy) instead of just lines of code. It plugs into the diff workflow and auto-generates a human-readable summary you can paste into PRs.

## Why this is unique

Most React/frontend VS Code extensions focus on snippets, refactors, and general productivity. Frontend Flow Diff focuses on **semantic “behavior diffs”**: when you compare two versions of a file (e.g. current vs HEAD), it:

- Parses both versions into ASTs
- Extracts a behavioral snapshot from each (routes, API calls, user-facing strings, key conditional states)
- Computes a behavioral diff: what was added, removed, or changed
- Renders that in a side panel with a **Copy as Markdown (PR summary)** button

## What the diff shows

- **Navigation** – `Link to=`, `navigate()`, `router.push`, etc.
- **API interactions** – `fetch`, `axios`, `apiClient.*`, `trpc.*`, plus rough call site (e.g. `useEffect`, `onClick`)
- **UI states** – Conditions that gate UI: `if (isLoading)`, ternaries, `items.length === 0`, etc.
- **Copy** – User-facing string changes in JSX

## Commands

- **Frontend Flow Diff: Diff current file against HEAD** – Compare the active editor’s file to its Git HEAD version and show the behavioral diff in a side panel.
- **Frontend Flow Diff: Show behavioral diff (from diff editor)** – Same as above; use when you already have a diff open.

## Requirements

- The file must be in a Git workspace and the “before” version must exist in `HEAD` (e.g. you’ve committed at least once or are comparing with a branch).

## Settings

- `frontendFlowDiff.includeCopyChanges` – Include copy/text changes (default: true)
- `frontendFlowDiff.includeApiCalls` – Include API call changes (default: true)
- `frontendFlowDiff.includeRoutes` – Include navigation/route changes (default: true)
- `frontendFlowDiff.includeUiStates` – Include UI state (conditional) changes (default: true)

## Development

```bash
npm install
npm run compile
```

Run the CLI (Milestone 1) with two file paths to print a textual summary to stdout:

```bash
npm run compile
npm run cli -- path/to/before.tsx path/to/after.tsx
```

Example with included fixtures:

```bash
npm run cli -- fixtures/before.tsx fixtures/after.tsx
```

### Run the extension in VS Code

1. Open this folder in VS Code.
2. Press `F5` or use **Run > Start Debugging** to launch a new VS Code window with the extension loaded.
3. Open a React/TSX file that’s tracked by Git, run **Frontend Flow Diff: Diff current file against HEAD** from the Command Palette.

---

## How to publish the extension

### 1. Create a publisher (one-time)

1. Go to [Visual Studio Marketplace](https://marketplace.visualstudio.com/) and sign in with your Microsoft account.
2. Click your profile icon → **Manage** (or go to [Azure DevOps](https://dev.azure.com)).
3. Create an **Azure DevOps organization** if you don’t have one.
4. In the organization, go to **Organization settings** → **Publishers**.
5. Create a new **publisher** (e.g. your username or `frontend-flow-diff`). Remember the **Publisher ID**; you’ll use it in `package.json`.

### 2. Set the publisher in `package.json`

In `package.json`, set `publisher` to your Publisher ID:

```json
"publisher": "your-publisher-id",
```

### 3. Install the packaging tool

```bash
npm install -g @vscode/vsce
```

### 4. Package the extension (local .vsix)

From the extension root:

```bash
npm run compile
vsce package
```

This creates `frontend-flow-diff-0.1.0.vsix`. You can install it locally: **Extensions** → **...** → **Install from VSIX...**.

### 5. Publish to the Marketplace

**First-time:** you need a **Personal Access Token (PAT)** from Azure DevOps:

1. Azure DevOps → User settings (top right) → **Personal access tokens**.
2. **New token** – name it (e.g. “VS Code publish”), scope **Custom defined**, enable **Marketplace (Publish)**.
3. Copy the token; `vsce` will ask for it when you publish.

Then:

```bash
vsce publish
```

Or publish a specific version:

```bash
vsce publish patch   # 0.1.0 → 0.1.1
vsce publish minor   # 0.1.0 → 0.2.0
vsce publish 1.0.0   # explicit version
```

### 6. Automated publishing (CI)

Set the environment variable `VSCE_PAT` to your PAT so you can run `vsce publish` in CI without typing the token.

---

## License

MIT
