/**
 * Knights & Knaves puzzle generator.
 *
 * On the island, a Knight's every statement is true and a Knave's every
 * statement is false. Each puzzle gives each inhabitant one statement; the
 * player deduces who is which. We brute-force all 2^n type assignments and keep
 * only puzzles with EXACTLY ONE consistent assignment (so they're fair and have
 * a single answer), then render statements to natural language and build a
 * verification walkthrough.
 *
 * Difficulty rules:
 *   Easy    2 people, direct statements (is-a / same / different)
 *   Medium  3 people, adds "either/or" and "at least one is a knave"
 *   Hard    4 people, adds "and" compounds and cross-references
 *   Extreme 5 people, adds nested "X would tell you that ..." claims
 *
 * Run:  node gen-knights.js   (writes knights-new.json, prints validation)
 */
const fs = require('fs');

// ── Seeded RNG (mulberry32) ─────────────────────────────────────
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

// ── Statement AST: eval(node, a) where a[name] = true(Knight)/false(Knave) ──
function ev(node, a) {
  switch (node[0]) {
    case 'knight': return a[node[1]];
    case 'knave': return !a[node[1]];
    case 'same': return a[node[1]] === a[node[2]];
    case 'diff': return a[node[1]] !== a[node[2]];
    case 'and': return ev(node[1], a) && ev(node[2], a);
    case 'or': return ev(node[1], a) || ev(node[2], a);
    case 'someKnave': return node[1].some(x => !a[x]);
    case 'claims': return a[node[1]] ? ev(node[2], a) : !ev(node[2], a);
    default: throw new Error('bad node ' + node[0]);
  }
}

// ── Reject trivial/degenerate statements (tautologies, contradictions,
//    duplicated sub-clauses) so every clause carries information. ──
const key = n => JSON.stringify(n);
function unorderedPairEq(p, q) {
  return (p[1] === q[1] && p[2] === q[2]) || (p[1] === q[2] && p[2] === q[1]);
}
function negationPair(p, q) {
  if (p[0] === 'knight' && q[0] === 'knave' && p[1] === q[1]) return true;
  if (p[0] === 'knave' && q[0] === 'knight' && p[1] === q[1]) return true;
  if (p[0] === 'same' && q[0] === 'diff' && unorderedPairEq(p, q)) return true;
  if (p[0] === 'diff' && q[0] === 'same' && unorderedPairEq(p, q)) return true;
  return false;
}
function redundantPair(p, q) {
  if (key(p) === key(q)) return true;
  if ((p[0] === 'same' && q[0] === 'same') || (p[0] === 'diff' && q[0] === 'diff')) return unorderedPairEq(p, q);
  return false;
}
function degenerate(node) {
  switch (node[0]) {
    case 'and': case 'or':
      return redundantPair(node[1], node[2]) || negationPair(node[1], node[2])
        || degenerate(node[1]) || degenerate(node[2]);
    case 'claims': return degenerate(node[2]);
    case 'someKnave': return node[1].length < 2;
    default: return false;
  }
}

// ── Natural-language rendering ──────────────────────────────────
function oxford(list) {
  if (list.length === 1) return list[0];
  if (list.length === 2) return `${list[0]} and ${list[1]}`;
  return `${list.slice(0, -1).join(', ')}, and ${list[list.length - 1]}`;
}
function clause(node, speaker) {
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
    case 'and': return `${clause(node[1], speaker)} and ${clause(node[2], speaker)}`;
    case 'or': return `either ${clause(node[1], speaker)} or ${clause(node[2], speaker)}`;
    case 'someKnave': return `at least one of ${oxford(node[1])} is a knave`;
    case 'claims': return `${node[1]} would tell you that ${clause(node[2], node[1])}`;
    default: throw new Error('bad node');
  }
}
function sentence(node, speaker) {
  const c = clause(node, speaker);
  return c.charAt(0).toUpperCase() + c.slice(1) + '.';
}

// ── Consistency: count assignments where each person's statement
//    truth equals their own type (cap at 2). ───────────────────────
function consistentAssignments(names, stmts) {
  const n = names.length;
  const out = [];
  for (let mask = 0; mask < (1 << n); mask++) {
    const a = {};
    names.forEach((nm, i) => a[nm] = !!(mask & (1 << i)));
    if (names.every(nm => ev(stmts[nm], a) === a[nm])) {
      out.push(a);
      if (out.length > 1) return out;
    }
  }
  return out;
}

// ── Random statement builders ───────────────────────────────────
function simpleStmt(rand, speaker, names) {
  const others = names.filter(x => x !== speaker);
  const kind = pick(rand, ['knight', 'knave', 'same', 'diff', 'selfKnight', 'selfKnave']);
  if (kind === 'knight') return ['knight', pick(rand, others)];
  if (kind === 'knave') return ['knave', pick(rand, others)];
  if (kind === 'selfKnight') return ['knight', speaker];
  if (kind === 'selfKnave') return ['knave', speaker];
  const x = speaker, y = pick(rand, others);
  return [kind, x, y]; // same / diff with self
}
function aboutStmt(rand, speaker, names) {
  // a simple claim about two (possibly other) people, no self bias
  const kind = pick(rand, ['knight', 'knave', 'same', 'diff']);
  if (kind === 'knight' || kind === 'knave') return [kind, pick(rand, names.filter(x => x !== speaker))];
  let x = pick(rand, names), y = pick(rand, names);
  while (y === x) y = pick(rand, names);
  return [kind, x, y];
}

function makeStatement(rand, speaker, names, difficulty) {
  if (difficulty === 'Easy') return simpleStmt(rand, speaker, names);
  if (difficulty === 'Medium') {
    const r = rand();
    if (r < 0.34) return ['or', aboutStmt(rand, speaker, names), aboutStmt(rand, speaker, names)];
    if (r < 0.6) return ['someKnave', sampleSet(rand, names.filter(x => x !== speaker), 2)];
    return simpleStmt(rand, speaker, names);
  }
  if (difficulty === 'Hard') {
    const r = rand();
    if (r < 0.4) return [pick(rand, ['and', 'or']), aboutStmt(rand, speaker, names), aboutStmt(rand, speaker, names)];
    if (r < 0.6) return ['someKnave', sampleSet(rand, names.filter(x => x !== speaker), 2 + Math.floor(rand() * 2))];
    return aboutStmt(rand, speaker, names);
  }
  // Extreme
  const r = rand();
  if (r < 0.4) { const x = pick(rand, names.filter(s => s !== speaker)); return ['claims', x, aboutStmt(rand, x, names)]; }
  if (r < 0.7) return [pick(rand, ['and', 'or']), aboutStmt(rand, speaker, names), aboutStmt(rand, speaker, names)];
  return ['someKnave', sampleSet(rand, names.filter(x => x !== speaker), 2 + Math.floor(rand() * 2))];
}
function sampleSet(rand, arr, k) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, Math.min(k, a.length)).sort();
}

// ── Walkthrough (verification narrative over the unique solution) ──
function buildExplanation(names, stmts, sol) {
  const typ = nm => sol[nm] ? 'a knight' : 'a knave';
  const steps = [
    'A knight’s statements are always true and a knave’s are always false. Only one line-up keeps every statement consistent — here is the check.',
  ];
  for (const nm of names) {
    const truth = ev(stmts[nm], sol);
    const t = typ(nm);
    const stmt = sentence(stmts[nm], nm).replace(/\.$/, '');
    steps.push(`${nm} is ${t}, and the claim “${stmt}” works out ${truth ? 'true' : 'false'} — exactly what ${t} ${truth ? 'would say' : 'would lie about'}.`);
  }
  const summary = names.map(nm => `${nm} = ${sol[nm] ? 'Knight' : 'Knave'}`).join(', ');
  steps.push(`No other assignment avoids a contradiction, so the answer is: ${summary}.`);
  return steps;
}

// ── Generate one puzzle ─────────────────────────────────────────
const NAMES = ['Aria', 'Bram', 'Cleo', 'Dorian', 'Esme', 'Felix', 'Greta', 'Hugo'];

function signature(names, stmts, sol) {
  return names.map(nm => sentence(stmts[nm], nm)).join('|') + '#' + names.map(nm => sol[nm] ? 1 : 0).join('');
}

function generatePuzzle(difficulty, n, seed, seen) {
  const rand = rng(seed);
  for (let attempt = 0; attempt < 200000; attempt++) {
    const names = NAMES.slice(0, n);
    const stmts = {};
    for (const nm of names) stmts[nm] = makeStatement(rand, nm, names, difficulty);
    if (names.some(nm => degenerate(stmts[nm]))) continue;
    const sols = consistentAssignments(names, stmts);
    if (sols.length !== 1) continue;
    const sol = sols[0];
    const knights = names.filter(nm => sol[nm]).length;
    if (knights === 0 || knights === n) continue;       // want a real mix
    const sig = signature(names, stmts, sol);
    if (seen.has(sig)) continue;
    seen.add(sig);
    return {
      difficulty,
      characters: names.map(nm => ({ name: nm, statements: [sentence(stmts[nm], nm)] })),
      solution: Object.fromEntries(names.map(nm => [nm, sol[nm] ? 'Knight' : 'Knave'])),
      explanation: buildExplanation(names, stmts, sol),
      _ast: names.map(nm => clause(stmts[nm], nm)),
    };
  }
  throw new Error(`Failed to generate ${difficulty}`);
}

// ── Build the 24-puzzle set ─────────────────────────────────────
const TITLES = {
  Easy: ['Two Islanders', 'A Simple Pair', 'First Encounter', 'Crossroads', 'The Fork', 'Plain Speaking'],
  Medium: ['Three Voices', 'The Tavern', 'Market Day', 'A Small Crowd', 'Word of Mouth', 'The Trio'],
  Hard: ['Four Strangers', 'The Council', 'Tangled Tongues', 'The Quartet', 'Cross Purposes', 'The Inquiry'],
  Extreme: ['Five Riddlers', 'Hall of Mirrors', 'The Whole Court', 'Hearsay', 'A Web of Words', 'The Reckoning'],
};
const SPEC = [
  { difficulty: 'Easy', n: 2 }, { difficulty: 'Medium', n: 3 },
  { difficulty: 'Hard', n: 4 }, { difficulty: 'Extreme', n: 5 },
];

const out = [];
const seen = new Set();
let ok = true;
for (const spec of SPEC) {
  for (let i = 0; i < 6; i++) {
    const seed = (0x1b873593 ^ ((spec.n * 131 + i) * 2654435761)) >>> 0;
    const p = generatePuzzle(spec.difficulty, spec.n, seed, seen);
    p.questionText = TITLES[spec.difficulty][i];
    const knights = Object.values(p.solution).filter(t => t === 'Knight').length;
    const knaves = Object.values(p.solution).length - knights;
    process.stderr.write(`${spec.difficulty.padEnd(7)} "${p.questionText}" people=${spec.n} (K:${knights} N:${knaves})\n`);
    p._ast.forEach((c, idx) => process.stderr.write(`    ${p.characters[idx].name}: ${p.characters[idx].statements[0]}\n`));
    delete p._ast;
    out.push(p);
  }
}
fs.writeFileSync(__dirname + '/knights-new.json', JSON.stringify(out, null, 2));
process.stderr.write(`\nGenerated ${out.length} puzzles. Valid: ${ok}\n`);
