#!/usr/bin/env node
/**
 * Zero-dependency syntax checker for the backend.
 *
 * The backend doesn't use a full linter (ESLint/oxlint) today, so this
 * script gives `npm run lint` something real to do — it recursively
 * parses every .js file with Node's own parser (`node --check`) and
 * fails the build if any file has a syntax error. It intentionally
 * does not check style/formatting, only that every file is valid JS.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const IGNORE_DIRS = new Set(['node_modules', 'uploads', '.git']);

const collectJsFiles = (dir, files = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectJsFiles(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  return files;
};

const files = collectJsFiles(ROOT);
let hasError = false;

for (const file of files) {
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
  } catch (error) {
    hasError = true;
    console.error(`Syntax error in ${path.relative(ROOT, file)}:`);
    console.error(error.stderr?.toString() || error.message);
  }
}

if (hasError) {
  process.exit(1);
}

console.log(`OK — ${files.length} backend .js files parsed without syntax errors.`);
