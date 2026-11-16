#!/usr/bin/env node
// Walkthrough helper. Two subcommands, no dependencies:
//
//   hunks <repoDir> <base> <head> [-U<n>] [--label <name>]
//     Split the net diff base..head into hunks, trace each one to the commits
//     inside the range that produced it, and those commits to ticket numbers.
//     Prints a JSON array on stdout and a size summary on stderr.
//
//   build <outline.json> <out.html>
//     Splice the outline's changes and their hunks into template.html.
//     Fails when a hunk is assigned twice, unknown, or left unassigned.
//     Marks a change `revised` when its hunks differ from the previous out.html.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve, basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const git = (dir, args) =>
  execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', maxBuffer: 1 << 28 });
const die = (m) => { console.error('walkthrough: ' + m); process.exit(1); };

/* ---------- hunks ---------- */

// Ticket numbers named by a commit subject: "issue #48", "complete #45", "fix issue 46".
const subjectTickets = (s) =>
  [...s.matchAll(/(?:issue\s*#?\s*|#)(\d+)/gi)].map((m) => String(Number(m[1])));
// A merge of a ticket's branch names the ticket in its last path segment:
// '<prefix>/<group>-<NN>-<slug>' or '<NN>-<slug>'. Integration branches
// ('…/merge/…') merge many tickets, so they name none.
const branchTicket = (s) => {
  const m = s.match(/Merge branch '([^']+)'/);
  if (!m || m[1].split('/').includes('merge')) return null;
  const t = m[1].split('/').at(-1).match(/(?:^|-)(\d+)-/);
  return t ? String(Number(t[1])) : null;
};

function commitInfo(dir, head, cache, sha) {
  if (cache.has(sha)) return cache.get(sha);
  const subject = git(dir, ['log', '-1', '--format=%s', sha]).trim();
  let tickets = subjectTickets(subject);
  let via = 'subject';
  if (!tickets.length) {
    // An untagged fixup inside a ticket branch: the nearest merge above it names the ticket.
    const merges = git(dir, ['log', '--merges', '--ancestry-path', '--reverse', '--format=%s', `${sha}..${head}`])
      .split('\n').filter(Boolean);
    for (const m of merges) {
      const t = branchTicket(m);
      if (t) { tickets = [t]; via = 'merge'; break; }
    }
  }
  const info = { sha: sha.slice(0, 8), subject, tickets, via: tickets.length ? via : 'none' };
  cache.set(sha, info);
  return info;
}

function parseDiff(text) {
  const files = [];
  let f = null, h = null;
  for (const line of text.split('\n')) {
    if (line.startsWith('diff --git ')) {
      f = { header: [line], hunks: [], oldFile: null, file: null, status: 'modified', binary: false };
      files.push(f); h = null; continue;
    }
    if (!f) continue;
    if (line.startsWith('@@')) {
      const m = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
      h = { lines: [line], newStart: +m[3], newLen: m[4] === undefined ? 1 : +m[4], added: 0, removed: 0 };
      f.hunks.push(h); continue;
    }
    if (h) {
      if (line.startsWith('+')) h.added++;
      else if (line.startsWith('-')) h.removed++;
      h.lines.push(line); continue;
    }
    f.header.push(line);
    if (line.startsWith('--- ')) f.oldFile = line === '--- /dev/null' ? null : line.slice(6);
    else if (line.startsWith('+++ ')) f.file = line === '+++ /dev/null' ? null : line.slice(6);
    else if (line.startsWith('new file')) f.status = 'added';
    else if (line.startsWith('deleted file')) f.status = 'deleted';
    else if (line.startsWith('rename from')) { f.status = 'renamed'; f.oldFile = line.slice(12); }
    else if (line.startsWith('rename to')) f.file = line.slice(10);
    else if (line.startsWith('Binary files')) f.binary = true;
  }
  for (const f of files) {
    if (!f.file && !f.oldFile) {
      const m = f.header[0].match(/^diff --git a\/(.*) b\/(.*)$/);
      f.oldFile = m[1]; f.file = m[2];
    }
    // drop the trailing empty line split() leaves on the last hunk
    for (const h of f.hunks) while (h.lines.length > 1 && h.lines.at(-1) === '') h.lines.pop();
  }
  return files;
}

function addedRanges(h) {
  // Contiguous runs of '+' lines, in new-file line numbers.
  const out = []; let n = h.newStart, run = null;
  for (const l of h.lines.slice(1)) {
    if (l.startsWith('-') || l.startsWith('\\')) continue;
    if (l.startsWith('+')) { run ? (run[1] = n) : (run = [n, n], out.push(run)); }
    else run = null;
    n++;
  }
  return out;
}

function hunks(argv) {
  const [dir, base, head, ...rest] = argv;
  if (!dir || !base || !head) die('usage: hunks <repoDir> <base> <head> [-U<n>] [--label <name>]');
  const ctx = (rest.find((a) => /^-U\d+$/.test(a)) || '-U3');
  const li = rest.indexOf('--label');
  const label = li >= 0 ? rest[li + 1] : basename(resolve(dir));
  const headSha = git(dir, ['rev-parse', head]).trim();
  const baseSha = git(dir, ['rev-parse', base]).trim();
  const files = parseDiff(git(dir, ['diff', '--no-color', '--no-ext-diff', '--ignore-submodules=all', '-M', ctx, baseSha, headSha]));
  const cache = new Map();
  const out = [];
  let added = 0, removed = 0;
  for (const f of files) {
    const path = f.file || f.oldFile;
    const header = f.header.join('\n');
    const fileCommits = () =>
      git(dir, ['log', '--format=%H', `${baseSha}..${headSha}`, '--', ...new Set([f.file, f.oldFile].filter(Boolean))])
        .split('\n').filter(Boolean);
    const units = f.hunks.length ? f.hunks : [{ lines: [], added: 0, removed: 0 }];
    units.forEach((h, i) => {
      let shas = [], attribution = 'blame';
      if (f.file && h.added) {
        for (const [a, b] of addedRanges(h)) {
          const por = git(dir, ['blame', '--porcelain', '-L', `${a},${b}`, `${baseSha}..${headSha}`, '--', f.file]);
          // Porcelain: a "<sha> <orig> <final>" line opens each record; a "boundary"
          // header marks a commit at or before base, which lies outside the range.
          const boundary = new Set(); let cur = null;
          for (const l of por.split('\n')) {
            const m = l.match(/^([0-9a-f]{40}) \d+ \d+/);
            if (m) { cur = m[1]; shas.push(cur); }
            else if (l === 'boundary') boundary.add(cur);
          }
          shas = shas.filter((s) => !boundary.has(s));
        }
      }
      if (!shas.length) { shas = fileCommits(); attribution = 'file'; }
      const commits = [...new Set(shas)].map((s) => commitInfo(dir, headSha, cache, s));
      added += h.added; removed += h.removed;
      out.push({
        key: `${label}:${path}#${i + 1}`,
        repo: label, file: path, oldFile: f.oldFile !== f.file ? f.oldFile : undefined,
        status: f.status, binary: f.binary || undefined,
        added: h.added, removed: h.removed,
        tickets: [...new Set(commits.flatMap((c) => c.tickets))],
        attribution, commits,
        header, body: h.lines.join('\n'),
      });
    });
  }
  process.stdout.write(JSON.stringify({ repo: label, dir: resolve(dir), base: baseSha, head: headSha, hunks: out }, null, 1));
  const byTicket = {};
  for (const h of out) for (const t of (h.tickets.length ? h.tickets : ['untraced'])) byTicket[t] = (byTicket[t] || 0) + 1;
  console.error(`${label} ${baseSha.slice(0, 8)}..${headSha.slice(0, 8)}: ${files.length} files, ${out.length} hunks, +${added} -${removed}`);
  console.error('hunks per ticket: ' + Object.entries(byTicket).map(([t, n]) => `${t}=${n}`).join(' '));
}

/* ---------- build ---------- */

const MARK_OPEN = '<script type="application/json" id="walkthrough">';
const MARK_CLOSE = '</script>';

function readEmbedded(html) {
  const i = html.indexOf(MARK_OPEN);
  if (i < 0) return null;
  const j = html.indexOf(MARK_CLOSE, i);
  try { return JSON.parse(html.slice(i + MARK_OPEN.length, j).replace(/<\\\/script/gi, '</script')); } catch { return null; }
}

function build(argv) {
  const [outlinePath, outPath] = argv;
  if (!outlinePath || !outPath) die('usage: build <outline.json> <out.html>');
  const outline = JSON.parse(readFileSync(outlinePath, 'utf8'));
  const base = dirname(resolve(outlinePath));
  const pool = new Map();
  const ranges = [];
  for (const r of outline.ranges || []) {
    const data = JSON.parse(readFileSync(resolve(base, r.hunks), 'utf8'));
    ranges.push({ repo: data.repo, dir: data.dir, base: data.base, head: data.head });
    for (const h of data.hunks) pool.set(h.key, { ...h, dir: data.dir });
  }
  const seen = new Map(), errors = [];
  const letter = (i) => (i < 26 ? String.fromCharCode(97 + i) : 'z' + (i - 25));
  for (const g of outline.groups || []) {
    for (const c of g.changes || []) {
      c.hunks = (c.hunks || []).map((ref, i) => {
        const key = typeof ref === 'string' ? ref : ref.key;
        const h = pool.get(key);
        if (!h) { errors.push(`${c.id}: unknown hunk ${key}`); return null; }
        if (seen.has(key)) errors.push(`${key}: in both ${seen.get(key)} and ${c.id}`);
        seen.set(key, c.id);
        return { id: c.id + letter(i), key, note: typeof ref === 'string' ? undefined : ref.note,
          repo: h.repo, file: h.file, oldFile: h.oldFile, status: h.status, binary: h.binary,
          added: h.added, removed: h.removed, commits: h.commits, patch: h.header + '\n' + h.body };
      }).filter(Boolean);
      if (c.lead) {
        const hit = c.hunks.find((h) => h.key === c.lead);
        if (!hit) errors.push(`${c.id}: lead ${c.lead} is not one of its hunks`);
        else c.lead = hit.id;
      }
      c.sig = createHash('sha1').update(c.hunks.map((h) => h.patch).join('\n')).digest('hex').slice(0, 12);
      for (const r of c.revisions || []) {
        const range = ranges.find((x) => x.repo === r.repo) || ranges[0];
        try {
          r.subject = git(range.dir, ['log', '-1', '--format=%s', r.commit]).trim();
          r.patch = git(range.dir, ['show', '--no-color', '--format=', r.commit]);
        } catch { errors.push(`${c.id}: revision ${r.commit} not found in ${range.repo}`); }
      }
    }
  }
  const missing = [...pool.keys()].filter((k) => !seen.has(k));
  for (const k of missing) errors.push(`unassigned: ${k}`);
  if (errors.length) die(`${errors.length} problem(s):\n  ` + errors.join('\n  '));

  const prev = existsSync(outPath) ? readEmbedded(readFileSync(outPath, 'utf8')) : null;
  const prevSig = new Map((prev?.groups || []).flatMap((g) => g.changes.map((c) => [c.id, c.sig])));
  let revised = 0;
  for (const g of outline.groups) for (const c of g.changes) {
    c.revised = Boolean(c.revised || (prevSig.has(c.id) && prevSig.get(c.id) !== c.sig));
    if (c.revised) revised++;
  }

  const data = { ...outline, ranges };
  const json = JSON.stringify(data).replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\u0021--');
  const tpl = readFileSync(join(HERE, 'template.html'), 'utf8');
  const i = tpl.indexOf(MARK_OPEN), j = tpl.indexOf(MARK_CLOSE, i);
  writeFileSync(outPath, tpl.slice(0, i + MARK_OPEN.length) + '\n' + json + '\n' + tpl.slice(j));
  const changes = outline.groups.reduce((n, g) => n + g.changes.length, 0);
  console.error(`wrote ${outPath}: ${outline.groups.length} groups, ${changes} changes, ${seen.size} hunks, ${revised} revised`);
  console.error('file://' + resolve(outPath));
}

const [cmd, ...argv] = process.argv.slice(2);
if (cmd === 'hunks') hunks(argv);
else if (cmd === 'build') build(argv);
else die('usage: walkthrough.mjs hunks|build ...');
