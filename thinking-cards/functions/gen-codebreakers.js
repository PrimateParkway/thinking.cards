/**
 * Codebreaker puzzle generator (offline, no Firestore).
 *
 * Produces hard, fair puzzles that satisfy four difficulty guarantees:
 *   1. UNIQUE  — exactly one code is consistent with the full clue set.
 *   2. NO SHORTCUT — the minimum number of clues that pins the code down is at
 *      least K (K scales with difficulty). No 1- or 2-clue subset can solve it,
 *      so the player must genuinely cross-reference the board.
 *   3. NO GIVEAWAY — no clue matches the code in >= length-1 positions, so no
 *      single "almost the answer" clue hands it to you.
 *   4. FOOTHOLDS — a mix of `correct` values (not all zero), so the player gets
 *      positional information to reason from rather than pure elimination grind.
 *
 * Run:  node gen-codebreakers.js          (prints JS arrays + validation)
 */

// ── Scoring (standard Mastermind semantics) ─────────────────────
function score(code, guess) {
  let correct = 0;
  for (let i = 0; i < code.length; i++) if (code[i] === guess[i]) correct++;
  const codeCount = {};
  const guessCount = {};
  for (const c of code) codeCount[c] = (codeCount[c] || 0) + 1;
  for (const g of guess) guessCount[g] = (guessCount[g] || 0) + 1;
  let shared = 0;
  for (const d in guessCount) shared += Math.min(guessCount[d], codeCount[d] || 0);
  return { correct, misplaced: shared - correct };
}

const sameScore = (a, b) => a.correct === b.correct && a.misplaced === b.misplaced;

// ── Seeded RNG (mulberry32) for reproducible puzzles ────────────
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Candidate space: all distinct-digit codes of length L ───────
const candCache = {};
function candidates(L) {
  if (candCache[L]) return candCache[L];
  const out = [];
  const digits = '0123456789'.split('');
  const build = (prefix, used) => {
    if (prefix.length === L) { out.push(prefix); return; }
    for (const d of digits) {
      if (used.has(d)) continue;
      used.add(d); build(prefix + d, used); used.delete(d);
    }
  };
  build('', new Set());
  return (candCache[L] = out);
}

function randDistinct(L, rand) {
  const digits = '0123456789'.split('');
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  return digits.slice(0, L).join('');
}

// Codes consistent with a clue (guess + its feedback against the true code),
// expressed as a Uint8Array mask over the candidate list.
function clueMask(cands, guess, feedback) {
  const mask = new Uint8Array(cands.length);
  for (let i = 0; i < cands.length; i++) {
    mask[i] = sameScore(score(cands[i], guess), feedback) ? 1 : 0;
  }
  return mask;
}

// Number of candidates consistent with the AND of the given masks (capped at 2,
// since we only ever care whether it's unique or still ambiguous).
function intersectCountOf(maskList) {
  const n = maskList[0].length;
  let count = 0;
  let lastIdx = -1;
  for (let i = 0; i < n; i++) {
    let ok = 1;
    for (let m = 0; m < maskList.length; m++) {
      if (!maskList[m][i]) { ok = 0; break; }
    }
    if (ok) { count++; lastIdx = i; if (count > 1) return { count, lastIdx }; }
  }
  return { count, lastIdx };
}

function intersectCount(masks, skipIndex) {
  if (skipIndex === undefined) return intersectCountOf(masks);
  return intersectCountOf(masks.filter((_, i) => i !== skipIndex));
}

// True if ANY subset of `masks` of size in [1..maxSize] pins the code to a
// single candidate. Used to enforce the "no shortcut" guarantee.
function hasDeterminingSubset(masks, maxSize) {
  const n = masks.length;
  const combo = (start, depth, picked) => {
    if (depth === 0) return intersectCountOf(picked).count === 1;
    for (let i = start; i <= n - depth; i++) {
      picked.push(masks[i]);
      if (combo(i + 1, depth - 1, picked)) { picked.pop(); return true; }
      picked.pop();
    }
    return false;
  };
  for (let size = 1; size <= maxSize; size++) {
    if (combo(0, size, [])) return true;
  }
  return false;
}

// Structured probe guesses give the player footholds (digit elimination),
// matching the established puzzle style. They're optional — pruning may drop them.
function probes(L) {
  if (L === 3) return ['012', '345', '678', '901'];
  if (L === 4) return ['0123', '4567', '8901', '2468'];
  if (L === 5) return ['01234', '56789', '13579', '02468'];
  return ['012345', '678901', '135790', '246813'];
}

function shuffle(arr, rand) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// A good board mixes clue strengths so the player has positional footholds
// instead of a wall of "0 correct" elimination clues.
function hasFootholds(clues) {
  const correct = clues.map(c => c.fb.correct);
  const countGE1 = correct.filter(c => c >= 1).length;
  const distinct = new Set(correct).size;
  const zeroZero = clues.filter(c => c.fb.correct === 0 && c.fb.misplaced === 0).length;
  return countGE1 >= 2 && distinct >= 2 && zeroZero <= 1;
}

function generatePuzzle(L, minClues, maxClues, minSubset, seed) {
  const cands = candidates(L);
  const rand = rng(seed);

  for (let attempt = 0; attempt < 60000; attempt++) {
    const code = randDistinct(L, rand);

    // Pool of non-giveaway guesses: structured probes first, then random.
    const seen = new Set([code]);
    const pool = [];
    const addGuess = g => {
      if (seen.has(g)) return;
      const fb = score(code, g);
      if (fb.correct >= L - 1) return;           // no near-answer giveaway
      seen.add(g);
      pool.push({ guess: g, fb, mask: clueMask(cands, g, fb) });
    };
    for (const p of probes(L)) if (p.length === L) addGuess(p);
    let safety = 0;
    while (pool.length < 90 && safety++ < 5000) addGuess(randDistinct(L, rand));
    shuffle(pool, rand);

    // Greedy random-order add until the code is pinned, giving a natural mix
    // of clue strengths.
    const chosen = [];
    for (const clue of pool) {
      chosen.push(clue);
      if (intersectCount(chosen.map(c => c.mask)).count === 1) break;
    }
    if (intersectCount(chosen.map(c => c.mask)).count !== 1) continue;   // never unique

    // Top up toward a fuller board (extra clues keep it unique).
    const target = minClues + Math.floor(rand() * (maxClues - minClues + 1));
    for (const clue of pool) {
      if (chosen.length >= target) break;
      if (!chosen.includes(clue)) chosen.push(clue);
    }
    if (chosen.length < minClues || chosen.length > maxClues) continue;

    if (!hasFootholds(chosen)) continue;

    const masks = chosen.map(c => c.mask);
    // Enforce no-shortcut: no subset smaller than minSubset may determine the code.
    if (hasDeterminingSubset(masks, minSubset - 1)) continue;

    // Order clues for display: weaker (more candidates) first, sharper later.
    const finalClues = [...chosen].sort((a, b) => sum(b.mask) - sum(a.mask));

    return {
      codebreakerAnswer: code,
      codebreakerClues: finalClues.map(c => ({
        guess: c.guess, correct: c.fb.correct, misplaced: c.fb.misplaced,
      })),
    };
  }
  throw new Error(`Failed to generate L=${L} [${minClues},${maxClues}] minSubset=${minSubset}`);
}

function sum(mask) { let s = 0; for (let i = 0; i < mask.length; i++) s += mask[i]; return s; }

// The minimum number of clues whose intersection is unique (for reporting).
function minDeterminingSize(masks) {
  for (let size = 1; size <= masks.length; size++) {
    let found = false;
    const combo = (start, depth, picked) => {
      if (found) return;
      if (depth === 0) { if (intersectCountOf(picked).count === 1) found = true; return; }
      for (let i = start; i <= masks.length - depth && !found; i++) {
        picked.push(masks[i]); combo(i + 1, depth - 1, picked); picked.pop();
      }
    };
    combo(0, size, []);
    if (found) return size;
  }
  return masks.length;
}

// ── Validation: re-prove the guarantees from scratch ────────────
function validate(puzzle, L, minSubset) {
  const cands = candidates(L);
  const masks = puzzle.codebreakerClues.map(c =>
    clueMask(cands, c.guess, { correct: c.correct, misplaced: c.misplaced }));

  const full = intersectCount(masks);
  const unique = full.count === 1 && cands[full.lastIdx] === puzzle.codebreakerAnswer;

  const minSize = minDeterminingSize(masks);
  const noShortcut = minSize >= minSubset;

  const noGiveaway = puzzle.codebreakerClues.every(c => c.correct < L - 1);

  // Sanity: every clue's stated feedback actually matches the answer.
  const feedbackOk = puzzle.codebreakerClues.every(c =>
    sameScore(score(puzzle.codebreakerAnswer, c.guess), { correct: c.correct, misplaced: c.misplaced }));

  return { unique, noShortcut, minSize, noGiveaway, feedbackOk };
}

// ── Build the 20-card set ───────────────────────────────────────
const TITLES = {
  1: 'Starter Code', 2: 'Quick Crack', 3: 'Warm Up', 4: 'First Steps', 5: 'Triple Digits',
  6: 'Four Square', 7: 'Dial In', 8: 'Lock Combo', 9: 'Safe Cracker', 10: 'Pin Code',
  11: 'Five Alive', 12: 'Deep Vault', 13: 'Cipher Lock', 14: 'Number Maze', 15: 'Cracked Safe',
  16: 'Master Code', 17: 'Enigma', 18: 'Black Box', 19: 'Final Frontier', 20: 'Omega Lock',
};

const SPEC = [
  { difficulty: 'Easy',    L: 3, min: 4, max: 5, K: 3, nums: [1, 2, 3, 4, 5] },
  { difficulty: 'Medium',  L: 4, min: 5, max: 6, K: 3, nums: [6, 7, 8, 9, 10] },
  { difficulty: 'Hard',    L: 5, min: 6, max: 7, K: 4, nums: [11, 12, 13, 14, 15] },
  { difficulty: 'Extreme', L: 6, min: 7, max: 8, K: 4, nums: [16, 17, 18, 19, 20] },
];

module.exports = { generatePuzzle, validate, score, candidates };

if (require.main === module) main();

function main() {
const groups = {};
let allValid = true;

for (const spec of SPEC) {
  groups[spec.difficulty] = [];
  for (const cardNumber of spec.nums) {
    const seed = 0x9e3779b9 ^ (cardNumber * 2654435761);
    const puzzle = generatePuzzle(spec.L, spec.min, spec.max, spec.K, seed >>> 0);
    const v = validate(puzzle, spec.L, spec.K);
    const pass = v.unique && v.noShortcut && v.noGiveaway && v.feedbackOk;
    if (!pass) allValid = false;
    groups[spec.difficulty].push({
      cardNumber,
      difficulty: spec.difficulty,
      questionText: TITLES[cardNumber],
      ...puzzle,
    });
    process.stderr.write(
      `#${String(cardNumber).padStart(2)} ${spec.difficulty.padEnd(7)} ` +
      `ans=${puzzle.codebreakerAnswer} clues=${puzzle.codebreakerClues.length} ` +
      `minSubset=${v.minSize}(>=${spec.K}) unique=${v.unique} noShortcut=${v.noShortcut} ` +
      `noGiveaway=${v.noGiveaway} fb=${v.feedbackOk}\n`);
  }
}

process.stderr.write(`\nAll puzzles valid: ${allValid}\n`);

// ── Emit JS arrays in seed-file format ──────────────────────────
function fmtGroup(name, cards) {
  const body = cards.map(c => {
    const clues = c.codebreakerClues.map(cl =>
      `      { guess: '${cl.guess}', correct: ${cl.correct}, misplaced: ${cl.misplaced} },`).join('\n');
    return `  {
    cardNumber: ${c.cardNumber},
    difficulty: '${c.difficulty}',
    questionText: '${c.questionText}',
    codebreakerAnswer: '${c.codebreakerAnswer}',
    codebreakerClues: [
${clues}
    ],
  },`;
  }).join('\n');
  return `const ${name} = [\n${body}\n];\n`;
}

let out = '';
out += fmtGroup('EASY', groups.Easy) + '\n';
out += fmtGroup('MEDIUM', groups.Medium) + '\n';
out += fmtGroup('HARD', groups.Hard) + '\n';
out += fmtGroup('EXTREME', groups.Extreme);
process.stdout.write(out);

if (!allValid) process.exit(1);
}
