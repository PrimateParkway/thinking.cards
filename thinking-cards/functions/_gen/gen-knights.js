/**
 * Knights & Knaves puzzle generator (themed).
 *
 * Core spirit is unchanged: a Knight's every statement is true and a Knave's
 * every statement is false, and the player deduces who is which. What's new is
 * that statements are about real-world TOPICS, not only "X is a knight/knave":
 *   - whodunnit themes: exactly one islander did the deed ("ate the tart").
 *   - role themes: each islander has a distinct role ("X is the baker").
 *   - a few classic knight/knave puzzles for variety.
 *
 * Each puzzle has a hidden full state (who is a knight/knave PLUS the secondary
 * fact). We brute-force every full state and keep only puzzles with exactly one
 * consistent state — which makes the knight/knave answer uniquely determined.
 * The player still only marks Knight/Knave; the solved reveal + walkthrough
 * expose the secondary fact (the culprit / everyone's role).
 *
 * Run:  node gen-knights.js   (writes knights-new.json, prints validation)
 */
const fs = require('fs');

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];
function perms(arr) {
  if (arr.length <= 1) return [arr.slice()];
  const out = [];
  arr.forEach((v, i) => { for (const p of perms(arr.slice(0, i).concat(arr.slice(i + 1)))) out.push([v, ...p]); });
  return out;
}
function oxford(list) {
  if (list.length === 1) return list[0];
  if (list.length === 2) return `${list[0]} and ${list[1]}`;
  return `${list.slice(0, -1).join(', ')}, and ${list[list.length - 1]}`;
}

// ── Themes ──────────────────────────────────────────────────────
// kind: 'plain' | 'culprit' | 'role'
const THEMES = [
  { id: 'tart', kind: 'culprit', act: 'ate the tart', actNeg: "didn't eat the tart",
    deed: 'ate the Duchess’s cherry tart', tagLabel: 'Verdict' },
  { id: 'medallion', kind: 'culprit', act: 'stole the medallion', actNeg: "didn't steal the medallion",
    deed: 'stole the gold medallion', tagLabel: 'Verdict' },
  { id: 'window', kind: 'culprit', act: 'broke the window', actNeg: "didn't break the window",
    deed: 'broke the chapel window', tagLabel: 'Verdict' },
  { id: 'letter', kind: 'culprit', act: 'forged the letter', actNeg: "didn't forge the letter",
    deed: 'forged the royal letter', tagLabel: 'Verdict' },
  { id: 'trades', kind: 'role', tagLabel: 'Trade',
    roles: ['the blacksmith', 'the baker', 'the tailor', 'the cooper', 'the mason'],
    noun: 'trades' },
  { id: 'festival', kind: 'role', tagLabel: 'Role',
    roles: ['the piper', 'the dancer', 'the juggler', 'the herald', 'the weaver'],
    noun: 'roles' },
  { id: 'crew', kind: 'role', tagLabel: 'Post',
    roles: ['the captain', 'the cook', 'the surgeon', 'the navigator', 'the gunner'],
    noun: 'posts' },
  { id: 'plain', kind: 'plain', tagLabel: null },
];

// ── Evaluation over a full state {type:{}, culprit, role:{}} ─────
function ev(node, st) {
  switch (node[0]) {
    case 'knight': return st.type[node[1]];
    case 'knave': return !st.type[node[1]];
    case 'same': return st.type[node[1]] === st.type[node[2]];
    case 'diff': return st.type[node[1]] !== st.type[node[2]];
    case 'culprit': return st.culprit === node[1];
    case 'role': return st.role[node[1]] === node[2];
    case 'not': return !ev(node[1], st);
    case 'and': return ev(node[1], st) && ev(node[2], st);
    case 'or': return ev(node[1], st) || ev(node[2], st);
    case 'someKnave': return node[1].some(x => !st.type[x]);
    case 'claims': return st.type[node[1]] ? ev(node[2], st) : !ev(node[2], st);
    default: throw new Error('bad node ' + node[0]);
  }
}

// ── Rendering ───────────────────────────────────────────────────
function clause(node, speaker, theme) {
  const self = x => x === speaker;
  switch (node[0]) {
    case 'knight': return self(node[1]) ? 'I am a knight' : `${node[1]} is a knight`;
    case 'knave': return self(node[1]) ? 'I am a knave' : `${node[1]} is a knave`;
    case 'same': {
      const [x, y] = [node[1], node[2]];
      if (self(x)) return `${y} and I are the same kind`;
      if (self(y)) return `${x} and I are the same kind`;
      return `${x} and ${y} are the same kind`;
    }
    case 'diff': {
      const [x, y] = [node[1], node[2]];
      if (self(x)) return `${y} and I are different kinds`;
      if (self(y)) return `${x} and I are different kinds`;
      return `${x} and ${y} are different kinds`;
    }
    case 'culprit': return self(node[1]) ? `I ${theme.act}` : `${node[1]} ${theme.act}`;
    case 'role': return self(node[1]) ? `I am ${node[2]}` : `${node[1]} is ${node[2]}`;
    case 'not': {
      const c = node[1];
      if (c[0] === 'culprit') return self(c[1]) ? `I ${theme.actNeg}` : `${c[1]} ${theme.actNeg}`;
      if (c[0] === 'role') return self(c[1]) ? `I am not ${c[2]}` : `${c[1]} is not ${c[2]}`;
      return `it is not the case that ${clause(c, speaker, theme)}`;
    }
    case 'and': return `${clause(node[1], speaker, theme)} and ${clause(node[2], speaker, theme)}`;
    case 'or': return `either ${clause(node[1], speaker, theme)} or ${clause(node[2], speaker, theme)}`;
    case 'someKnave': return `at least one of ${oxford(node[1])} is a knave`;
    case 'claims': return `${node[1]} would tell you that ${clause(node[2], node[1], theme)}`;
    default: throw new Error('bad node');
  }
}
function sentence(node, speaker, theme) {
  const c = clause(node, speaker, theme);
  return c.charAt(0).toUpperCase() + c.slice(1) + '.';
}

// ── Degeneracy guards ───────────────────────────────────────────
const key = n => JSON.stringify(n);
function unorderedPairEq(p, q) { return (p[1] === q[1] && p[2] === q[2]) || (p[1] === q[2] && p[2] === q[1]); }
function isNegation(p, q) {
  if (p[0] === 'not' && key(p[1]) === key(q)) return true;
  if (q[0] === 'not' && key(q[1]) === key(p)) return true;
  if (p[0] === 'knight' && q[0] === 'knave' && p[1] === q[1]) return true;
  if (p[0] === 'knave' && q[0] === 'knight' && p[1] === q[1]) return true;
  if (p[0] === 'same' && q[0] === 'diff' && unorderedPairEq(p, q)) return true;
  if (p[0] === 'diff' && q[0] === 'same' && unorderedPairEq(p, q)) return true;
  return false;
}
function redundant(p, q) {
  if (key(p) === key(q)) return true;
  if ((p[0] === 'same' && q[0] === 'same') || (p[0] === 'diff' && q[0] === 'diff')) return unorderedPairEq(p, q);
  return false;
}
function degenerate(node) {
  switch (node[0]) {
    case 'and': case 'or':
      return redundant(node[1], node[2]) || isNegation(node[1], node[2])
        || degenerate(node[1]) || degenerate(node[2]);
    case 'not': return node[1][0] === 'not' || degenerate(node[1]);
    case 'claims': return degenerate(node[2]);
    case 'someKnave': return node[1].length < 2;
    default: return false;
  }
}

// ── Statement builders ──────────────────────────────────────────
function attrPred(rand, speaker, names, theme, allowNot) {
  let node;
  if (theme.kind === 'culprit') node = ['culprit', pick(rand, names)];
  else node = ['role', pick(rand, names), pick(rand, theme.roles.slice(0, names.length))];
  if (allowNot && rand() < 0.5) node = ['not', node];
  return node;
}
function typePred(rand, speaker, names) {
  const others = names.filter(x => x !== speaker);
  const kind = pick(rand, ['knight', 'knave', 'same', 'diff']);
  if (kind === 'knight' || kind === 'knave') return [kind, pick(rand, names)];
  let x = pick(rand, names), y = pick(rand, names);
  while (y === x) y = pick(rand, names);
  return [kind, x, y];
}
function basicPred(rand, speaker, names, theme) {
  // For themed puzzles, lean toward topic statements; else type statements.
  if (theme.kind !== 'plain' && rand() < 0.62) return attrPred(rand, speaker, names, theme, true);
  return typePred(rand, speaker, names);
}
function makeStatement(rand, speaker, names, theme, difficulty) {
  if (difficulty === 'Easy') return basicPred(rand, speaker, names, theme);
  if (difficulty === 'Medium') {
    const r = rand();
    if (r < 0.3) return ['or', basicPred(rand, speaker, names, theme), basicPred(rand, speaker, names, theme)];
    if (r < 0.5) return ['someKnave', sampleSet(rand, names.filter(x => x !== speaker), 2)];
    return basicPred(rand, speaker, names, theme);
  }
  if (difficulty === 'Hard') {
    const r = rand();
    if (r < 0.42) return [pick(rand, ['and', 'or']), basicPred(rand, speaker, names, theme), basicPred(rand, speaker, names, theme)];
    if (r < 0.58) return ['someKnave', sampleSet(rand, names.filter(x => x !== speaker), 2 + Math.floor(rand() * 2))];
    return basicPred(rand, speaker, names, theme);
  }
  const r = rand(); // Extreme
  if (r < 0.4) { const x = pick(rand, names.filter(s => s !== speaker)); return ['claims', x, basicPred(rand, x, names, theme)]; }
  if (r < 0.72) return [pick(rand, ['and', 'or']), basicPred(rand, speaker, names, theme), basicPred(rand, speaker, names, theme)];
  return ['someKnave', sampleSet(rand, names.filter(x => x !== speaker), 2 + Math.floor(rand() * 2))];
}
function sampleSet(rand, arr, k) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, Math.min(k, a.length)).sort();
}
function referencesAttr(node) {
  if (node[0] === 'culprit' || node[0] === 'role') return true;
  if (node[0] === 'not' || node[0] === 'claims') return referencesAttr(node[node.length - 1]);
  if (node[0] === 'and' || node[0] === 'or') return referencesAttr(node[1]) || referencesAttr(node[2]);
  return false;
}

// ── Full-state enumeration ──────────────────────────────────────
function attrStates(theme, names) {
  if (theme.kind === 'culprit') return names.map(c => ({ culprit: c, role: {} }));
  if (theme.kind === 'role') {
    return perms(theme.roles.slice(0, names.length)).map(p => ({
      culprit: null, role: Object.fromEntries(names.map((nm, i) => [nm, p[i]])),
    }));
  }
  return [{ culprit: null, role: {} }];
}
function consistentStates(names, stmts, theme) {
  const out = [];
  const attrs = attrStates(theme, names);
  for (let mask = 0; mask < (1 << names.length); mask++) {
    const type = {};
    names.forEach((nm, i) => type[nm] = !!(mask & (1 << i)));
    for (const attr of attrs) {
      const st = { type, ...attr };
      if (names.every(nm => ev(stmts[nm], st) === st.type[nm])) {
        out.push(st);
        if (out.length > 1) return out;
      }
    }
  }
  return out;
}

// ── Walkthrough ─────────────────────────────────────────────────
function buildExplanation(names, stmts, st, theme) {
  const typ = nm => st.type[nm] ? 'a knight' : 'a knave';
  const steps = ['A knight’s statements are always true and a knave’s are always false. Only one full line-up fits every statement — here is the check.'];
  for (const nm of names) {
    const truth = ev(stmts[nm], st);
    const t = typ(nm);
    const stmt = sentence(stmts[nm], nm, theme).replace(/\.$/, '');
    steps.push(`${nm} is ${t}, so the claim “${stmt}” must be ${truth ? 'true' : 'false'} — and it is.`);
  }
  if (theme.kind === 'culprit') {
    steps.push(`That pins everything down: ${names.map(nm => `${nm} = ${st.type[nm] ? 'Knight' : 'Knave'}`).join(', ')}. And the one who ${theme.act} is ${st.culprit}.`);
  } else if (theme.kind === 'role') {
    steps.push(`That pins everything down: ${names.map(nm => `${nm} = ${st.type[nm] ? 'Knight' : 'Knave'} (${st.role[nm]})`).join(', ')}.`);
  } else {
    steps.push(`No other line-up avoids a contradiction: ${names.map(nm => `${nm} = ${st.type[nm] ? 'Knight' : 'Knave'}`).join(', ')}.`);
  }
  return steps;
}

// ── Scenario text ───────────────────────────────────────────────
function scenario(theme, names) {
  const who = `the ${names.length} islanders`;
  if (theme.kind === 'culprit') {
    return `Someone ${theme.deed}, and it was one of ${oxford(names)}. Each is a knight (who always tells the truth) or a knave (who always lies). Mark who is a knight and who is a knave — and you’ll uncover who ${theme.act}.`;
  }
  if (theme.kind === 'role') {
    const used = theme.roles.slice(0, names.length);
    return `${oxford(names)} are ${oxford(used)}, in some order. Each is also a knight (who always tells the truth) or a knave (who always lies). Work out who is a knight and who is a knave.`;
  }
  return `Each of ${oxford(names)} is either a knight, who always tells the truth, or a knave, who always lies. Decide what each one is.`;
}

// ── Generate one puzzle ─────────────────────────────────────────
const NAMES = ['Aria', 'Bram', 'Cleo', 'Dorian', 'Esme', 'Felix', 'Greta', 'Hugo'];
function signature(names, stmts, st, theme) {
  return names.map(nm => sentence(stmts[nm], nm, theme)).join('|') + '#' + names.map(nm => st.type[nm] ? 1 : 0).join('');
}

function generatePuzzle(theme, n, difficulty, seed, seen) {
  const rand = rng(seed);
  const minAttr = theme.kind === 'plain' ? 0 : Math.max(1, Math.ceil(n / 2));
  for (let attempt = 0; attempt < 400000; attempt++) {
    const names = NAMES.slice(0, n);
    const stmts = {};
    for (const nm of names) stmts[nm] = makeStatement(rand, nm, names, theme, difficulty);
    if (names.some(nm => degenerate(stmts[nm]))) continue;
    if (names.filter(nm => referencesAttr(stmts[nm])).length < minAttr) continue;
    const states = consistentStates(names, stmts, theme);
    if (states.length !== 1) continue;
    const st = states[0];
    const knights = names.filter(nm => st.type[nm]).length;
    if (knights === 0 || knights === n) continue;
    const sig = signature(names, stmts, st, theme);
    if (seen.has(sig)) continue;
    seen.add(sig);

    const puzzle = {
      difficulty,
      knightsScenario: scenario(theme, names),
      characters: names.map(nm => ({ name: nm, statements: [sentence(stmts[nm], nm, theme)] })),
      solution: Object.fromEntries(names.map(nm => [nm, st.type[nm] ? 'Knight' : 'Knave'])),
      explanation: buildExplanation(names, stmts, st, theme),
    };
    if (theme.kind === 'culprit') {
      puzzle.tagLabel = theme.tagLabel;
      puzzle.tagSolution = Object.fromEntries(names.map(nm => [nm, st.culprit === nm ? 'Guilty' : 'Innocent']));
    } else if (theme.kind === 'role') {
      puzzle.tagLabel = theme.tagLabel;
      puzzle.tagSolution = Object.fromEntries(names.map(nm => [nm, capitalize(st.role[nm])]));
    }
    return puzzle;
  }
  throw new Error(`Failed to generate ${difficulty} ${theme.id}`);
}
const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);

// ── Build the 24-puzzle set ─────────────────────────────────────
const TITLES = {
  Easy: ['Two Islanders', 'A Simple Pair', 'First Encounter', 'Crossroads', 'The Fork', 'Plain Speaking'],
  Medium: ['Three Suspects', 'The Festival', 'Market Day', 'Broken Glass', 'Word of Mouth', 'The Trio'],
  Hard: ['Four Trades', 'The Stolen Medallion', 'The Crew', 'Tangled Tongues', 'The Forgery', 'The Inquiry'],
  Extreme: ['Five Riddlers', 'The Whole Court', 'Hall of Mirrors', 'A Web of Words', 'The Reckoning', 'The Last Riddle'],
};
// Theme per slot (index 0-5) within each difficulty — mix topics for variety.
// Easy stays classic (2 people can't pin both types and a hidden fact); the
// themed whodunnit/role puzzles run from Medium up.
const SPEC = [
  { difficulty: 'Easy', n: 2, themes: ['plain', 'plain', 'plain', 'plain', 'plain', 'plain'] },
  { difficulty: 'Medium', n: 3, themes: ['tart', 'festival', 'medallion', 'window', 'plain', 'trades'] },
  { difficulty: 'Hard', n: 4, themes: ['trades', 'medallion', 'crew', 'tart', 'letter', 'plain'] },
  { difficulty: 'Extreme', n: 5, themes: ['festival', 'tart', 'crew', 'medallion', 'trades', 'window'] },
];
const themeById = Object.fromEntries(THEMES.map(t => [t.id, t]));

function generateWithFallback(theme, n, difficulty, baseSeed, seen) {
  // Try the chosen theme across several seeds; fall back to classic if needed.
  for (let attempt = 0; attempt < 8; attempt++) {
    try { return { p: generatePuzzle(theme, n, difficulty, (baseSeed + attempt * 0x9e3779b9) >>> 0, seen), theme }; }
    catch { /* try next seed */ }
  }
  const plain = themeById['plain'];
  return { p: generatePuzzle(plain, n, difficulty, (baseSeed ^ 0xdeadbeef) >>> 0, seen), theme: plain };
}

const out = [];
const seen = new Set();
for (const spec of SPEC) {
  for (let i = 0; i < 6; i++) {
    const wanted = themeById[spec.themes[i]];
    const seed = (0x2545f491 ^ ((spec.n * 977 + i * 31 + wanted.id.length) * 2654435761)) >>> 0;
    const { p, theme } = generateWithFallback(wanted, spec.n, spec.difficulty, seed, seen);
    p.questionText = TITLES[spec.difficulty][i];
    out.push(p);
    const knights = Object.values(p.solution).filter(t => t === 'Knight').length;
    process.stderr.write(`${spec.difficulty.padEnd(7)} [${theme.id.padEnd(9)}] "${p.questionText}" n=${spec.n} K:${knights}/${spec.n}${p.tagLabel ? ' +' + p.tagLabel : ''}\n`);
    p.characters.forEach(c => process.stderr.write(`    ${c.name}: ${c.statements[0]}\n`));
  }
}
fs.writeFileSync(__dirname + '/knights-new.json', JSON.stringify(out, null, 2));
process.stderr.write(`\nGenerated ${out.length} puzzles.\n`);
