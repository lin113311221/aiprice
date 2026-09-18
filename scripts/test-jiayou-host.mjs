#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

function runBuild(env = {}) {
  execFileSync(process.execPath, ['build.mjs'], {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: 'inherit',
  });
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function read(p) {
  return readFileSync(p, 'utf8');
}

rmSync(dist, { recursive: true, force: true });

// 1) No sibling SPA → placeholder + marketing
runBuild({ JIAYOU_DIST: '' });
const marketing = read(path.join(dist, 'jiayou', 'index.html'));
assert(marketing.includes('href="/app/jiayou/"'), 'primary CTA must point at /app/jiayou/');
assert(marketing.includes('参赛/预览'), 'secondary QMuse link must be labeled 参赛/预览');
assert(marketing.includes('ergw.qmuse.cn'), 'QMuse preview URL must remain');
assert(marketing.includes('限时 ¥39'), 'locked sale price');
assert(marketing.includes('¥88'), 'locked list price');
assert(marketing.includes('lin113311221'), 'WeChat id');
assert(marketing.includes('JYO-'), 'license prefix');
assert(marketing.includes('3000 AI token'), 'token grant copy');
assert(!marketing.includes('打开家有（预览）'), 'preview must not stay the primary CTA label');

const placeholder = read(path.join(dist, 'app', 'jiayou', 'index.html'));
assert(placeholder.includes('build:own-host') || placeholder.includes('JIAYOU_DIST'), 'placeholder must tell operator how to copy SPA');

// 2) Preserve unrelated dist products across rebuild
mkdirSync(path.join(dist, 'redeem'), { recursive: true });
writeFileSync(path.join(dist, 'redeem', 'index.html'), '<html>redeem-keep</html>');
mkdirSync(path.join(dist, 'ask'), { recursive: true });
writeFileSync(path.join(dist, 'ask', 'index.html'), '<html>ask-keep</html>');
writeFileSync(path.join(dist, 'jiayou', 'extra-keep.txt'), 'marketing-extra');

const spa = mkdtempSync(path.join(tmpdir(), 'jiayou-spa-'));
writeFileSync(path.join(spa, 'index.html'), '<html>own-host-spa</html>');
writeFileSync(path.join(spa, 'asset.js'), 'console.log(1)');

runBuild({ JIAYOU_DIST: spa });

assert(read(path.join(dist, 'app', 'jiayou', 'index.html')).includes('own-host-spa'), 'must copy JIAYOU_DIST');
assert(existsSync(path.join(dist, 'app', 'jiayou', 'asset.js')), 'must copy SPA assets');
assert(read(path.join(dist, 'redeem', 'index.html')).includes('redeem-keep'), 'must not touch redeem');
assert(read(path.join(dist, 'ask', 'index.html')).includes('ask-keep'), 'must not touch ask');
assert(existsSync(path.join(dist, 'jiayou', 'extra-keep.txt')), 'must not delete extra files in dist/jiayou');
assert(read(path.join(dist, 'jiayou', 'index.html')).includes('href="/app/jiayou/"'), 'marketing remains after SPA copy');

// 3) Missing JIAYOU_DIST must not clobber an already-copied SPA
runBuild({ JIAYOU_DIST: '' });
assert(read(path.join(dist, 'app', 'jiayou', 'index.html')).includes('own-host-spa'), 'must keep existing SPA when source folder is absent');

rmSync(spa, { recursive: true, force: true });
console.log('ok: jiayou host build tests passed');
