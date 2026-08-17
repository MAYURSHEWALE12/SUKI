// Runs `node --check` across all server source files (cross-platform, for CI).
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const roots = ['server.js', 'middleware', 'routes', 'models', 'controllers', 'scripts'];

const files = [];
for (const root of roots) {
  const abs = path.resolve(__dirname, '..', root);
  if (!fs.existsSync(abs)) continue;
  if (fs.statSync(abs).isFile()) {
    files.push(abs);
  } else {
    for (const name of fs.readdirSync(abs)) {
      if (name.endsWith('.js')) files.push(path.join(abs, name));
    }
  }
}

let failed = 0;
for (const file of files) {
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
  } catch (err) {
    failed += 1;
    console.error(`Syntax error in ${path.relative(process.cwd(), file)}`);
    console.error(err.stderr ? err.stderr.toString() : err.message);
  }
}

console.log(`Checked ${files.length} files, ${failed} with errors.`);
process.exit(failed > 0 ? 1 : 0);