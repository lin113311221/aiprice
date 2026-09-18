#!/usr/bin/env node
/**
 * Static hosting build for aiprice.store.
 *
 * Additive by design:
 * - Copies src/** into dist/** (overwrites those paths only).
 * - Never rm -rf dist, so existing marketing /jiayou/, redeem, ask,
 *   savault, license-api, and other products stay put.
 * - Stages the 家有 own-host SPA at dist/app/jiayou/.
 *
 * SPA source (first existing directory wins):
 *   1. $JIAYOU_DIST
 *   2. ../jiayou/dist-own-host
 *   3. ../jiayou/dist
 *
 * If none exist, write a placeholder index.html so a hosting deploy
 * does not 404 on an empty folder.
 */
import { cp, mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(root, 'src');
const distDir = path.join(root, 'dist');
const appJiayouDest = path.join(distDir, 'app', 'jiayou');

const PLACEHOLDER = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>家有 App 尚未放入本目录</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;margin:48px auto;max-width:40em;line-height:1.6;color:#1d1d1f}
code{background:#f5f5f7;padding:2px 6px;border-radius:6px}
a{color:#0066cc}
</style>
</head>
<body>
<h1>请先构建家有 own-host SPA 并拷到此处</h1>
<p>本路径是正式 App：<code>/app/jiayou/</code>。营销页仍在 <a href="/jiayou/">/jiayou/</a>。</p>
<p>在 jiayou 仓库执行 <code>npm run build:own-host</code>，然后任选其一：</p>
<ul>
<li>设置环境变量 <code>JIAYOU_DIST</code> 指向产物目录，再在本仓运行 <code>node build.mjs</code></li>
<li>把产物放到兄弟目录 <code>../jiayou/dist-own-host</code>（其次 <code>../jiayou/dist</code>）</li>
<li>直接把产物复制到本仓 <code>dist/app/jiayou/</code></li>
</ul>
<p>部署命令不变：<code>tcb hosting deploy dist</code></p>
</body>
</html>
`;

async function isDir(p) {
  try {
    return (await stat(p)).isDirectory();
  } catch {
    return false;
  }
}

async function resolveJiayouSpaDir() {
  const envRaw = process.env.JIAYOU_DIST;
  if (envRaw) {
    const envDir = path.isAbsolute(envRaw) ? envRaw : path.resolve(process.cwd(), envRaw);
    if (await isDir(envDir)) return envDir;
    console.warn(`[build] JIAYOU_DIST is set but not a directory: ${envDir}`);
  }

  const siblings = [
    path.resolve(root, '../jiayou/dist-own-host'),
    path.resolve(root, '../jiayou/dist'),
  ];
  for (const candidate of siblings) {
    if (await isDir(candidate)) return candidate;
  }
  return null;
}

async function copySrcToDist() {
  if (!(await isDir(srcDir))) {
    console.warn('[build] src/ missing; skip marketing copy');
    return;
  }
  await mkdir(distDir, { recursive: true });
  const entries = await readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const from = path.join(srcDir, entry.name);
    const to = path.join(distDir, entry.name);
    // Overwrite this entry only. Do not delete sibling dist products.
    await cp(from, to, { recursive: true, force: true });
    console.log(`[build] copied src/${entry.name} → dist/${entry.name}`);
  }
}

async function stageJiayouApp() {
  await mkdir(path.join(distDir, 'app'), { recursive: true });
  const spaSrc = await resolveJiayouSpaDir();

  if (spaSrc) {
    await rm(appJiayouDest, { recursive: true, force: true });
    await mkdir(path.dirname(appJiayouDest), { recursive: true });
    await cp(spaSrc, appJiayouDest, { recursive: true, force: true });
    const index = path.join(appJiayouDest, 'index.html');
    if (!existsSync(index)) {
      await writeFile(index, PLACEHOLDER, 'utf8');
      console.warn(`[build] ${spaSrc} had no index.html; wrote placeholder`);
    }
    console.log(`[build] copied jiayou SPA ${spaSrc} → dist/app/jiayou/`);
    return;
  }

  await mkdir(appJiayouDest, { recursive: true });
  const index = path.join(appJiayouDest, 'index.html');
  if (existsSync(index)) {
    console.log('[build] no JIAYOU_DIST / sibling SPA; kept existing dist/app/jiayou/index.html');
    return;
  }
  await writeFile(index, PLACEHOLDER, 'utf8');
  console.log('[build] no JIAYOU_DIST / sibling SPA; wrote placeholder dist/app/jiayou/index.html');
}

await mkdir(distDir, { recursive: true });
await copySrcToDist();
await stageJiayouApp();

if (!(await isDir(path.join(distDir, 'jiayou')))) {
  console.warn('[build] dist/jiayou/ is missing after copy (marketing src absent?)');
}
console.log('[build] done');
