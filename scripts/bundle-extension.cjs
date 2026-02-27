const esbuild = require('esbuild');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const outFile = path.join(projectRoot, 'out', 'main.js');

esbuild.build({
  entryPoints: [path.join(projectRoot, 'src', 'extension.ts')],
  bundle: true,
  outfile: outFile,
  format: 'cjs',
  platform: 'node',
  external: ['vscode'],
  target: 'node18',
}).then(() => {
  console.log('Bundled extension to out/main.js');
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
