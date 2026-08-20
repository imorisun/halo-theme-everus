#!/usr/bin/env node
/**
 * i18n 一致性校验
 * ---------------------------------------------------------------------------
 * 模板里的 i18n key 写错只会在运行时暴露（Thymeleaf 渲染成 ??key_locale??），
 * 而主题有 12 个页面模板、上百个 key，靠肉眼核对不可靠。
 * 本脚本把「模板引用的 key」与「语言包定义的 key」做双向比对：
 *
 *   1. 模板引用了但语言包没有  -> 运行时会显示 ??key??            [错误]
 *   2. 各语言包之间 key 不一致 -> 某语言下缺词条                   [错误]
 *   3. 语言包定义了但没人引用  -> 冗余词条                         [警告]
 *
 * 用法: node scripts/check-i18n.mjs   （或 pnpm run check:i18n）
 * 退出码非 0 表示存在错误，可直接用于 CI。
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const SRC_DIR = join(ROOT, "src");
const I18N_DIR = join(ROOT, "i18n");

/** 递归收集指定后缀的文件 */
function walk(dir, ext, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, ext, out);
    else if (name.endsWith(ext)) out.push(full);
  }
  return out;
}

/** 解析 .properties：返回 key -> value，忽略注释与空行 */
function parseProperties(file) {
  const map = new Map();
  const text = readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || line.startsWith("!")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    map.set(line.slice(0, eq).trim(), line.slice(eq + 1).trim());
  }
  return map;
}

// ── 1. 收集模板引用的 key ────────────────────────────────────────────────
// 两种写法都要覆盖：
//   #{some.key}            /  #{some.key(${arg})}
//   #messages.msg('key')   （用于 ${} 内部，例如 Elvis 兜底与片段参数）
const REF_PATTERNS = [/#\{\s*([A-Za-z0-9_.]+)\s*[(}]/g, /#messages\.msg\(\s*'([A-Za-z0-9_.]+)'/g];

const referenced = new Map(); // key -> Set<相对文件路径>
for (const file of walk(SRC_DIR, ".html")) {
  // 剔除 HTML 注释，避免注释里的示例被误当成真实引用
  const body = readFileSync(file, "utf8").replace(/<!--[\s\S]*?-->/g, "");
  const rel = relative(ROOT, file).replace(/\\/g, "/");
  for (const re of REF_PATTERNS) {
    for (const m of body.matchAll(re)) {
      if (!referenced.has(m[1])) referenced.set(m[1], new Set());
      referenced.get(m[1]).add(rel);
    }
  }
}

// ── 2. 收集语言包 ────────────────────────────────────────────────────────
const bundleFiles = walk(I18N_DIR, ".properties").sort();
if (bundleFiles.length === 0) {
  console.error("✗ i18n/ 下没有任何 .properties 文件");
  process.exit(1);
}
const bundles = bundleFiles.map((f) => ({
  name: relative(ROOT, f).replace(/\\/g, "/"),
  keys: parseProperties(f),
}));

const base = bundles.find((b) => b.name.endsWith("default.properties")) ?? bundles[0];

// ── 3. 比对 ──────────────────────────────────────────────────────────────
const errors = [];
const warnings = [];

// 3a. 模板引用但语言包缺失
for (const [key, files] of [...referenced].sort()) {
  for (const b of bundles) {
    if (!b.keys.has(key)) {
      errors.push(`缺失词条: ${b.name} 没有 "${key}"（被 ${[...files].join(", ")} 引用）`);
    }
  }
}

// 3b. 语言包之间 key 不一致（以 default 为基准）
for (const b of bundles) {
  if (b === base) continue;
  for (const key of base.keys.keys()) {
    if (!b.keys.has(key)) errors.push(`语言包不同步: ${b.name} 缺少 "${key}"（${base.name} 有）`);
  }
  for (const key of b.keys.keys()) {
    if (!base.keys.has(key)) errors.push(`语言包不同步: ${base.name} 缺少 "${key}"（${b.name} 有）`);
  }
}

// 3c. 定义了但没被引用
for (const key of base.keys.keys()) {
  if (!referenced.has(key)) warnings.push(`未被引用: "${key}"`);
}

// 3d. 占位符数量是否一致（例如 {0}/{1}）
const countPlaceholders = (v) => new Set(v.match(/\{\d+\}/g) ?? []).size;
for (const b of bundles) {
  if (b === base) continue;
  for (const [key, val] of base.keys) {
    if (!b.keys.has(key)) continue;
    const a = countPlaceholders(val);
    const c = countPlaceholders(b.keys.get(key));
    if (a !== c) errors.push(`占位符不一致: "${key}" 在 ${base.name} 有 ${a} 个、${b.name} 有 ${c} 个`);
  }
}

// ── 4. 输出 ──────────────────────────────────────────────────────────────
console.log(`模板引用的 key : ${referenced.size}`);
for (const b of bundles) console.log(`${b.name.padEnd(28)}: ${b.keys.size} 条`);
console.log("");

for (const w of warnings) console.log(`⚠ ${w}`);
if (warnings.length) console.log("");
for (const e of errors) console.error(`✗ ${e}`);

if (errors.length) {
  console.error(`\n✗ i18n 校验失败：${errors.length} 个错误、${warnings.length} 个警告`);
  process.exit(1);
}
console.log(`✓ i18n 校验通过（${warnings.length} 个警告）`);
