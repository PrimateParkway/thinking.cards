// Nonogram line-solver: verifies a picture is uniquely solvable by pure
// line-logic (the fair, gold-standard solvability for a hand puzzle).

function computeClues(line) {
  const out = []; let run = 0;
  for (const c of line) { if (c === 1) run++; else { if (run) out.push(run); run = 0; } }
  if (run) out.push(run);
  return out.length ? out : [0];
}

function cluesFromGrid(grid) {
  const rows = grid.map(computeClues);
  const W = grid[0].length;
  const cols = [];
  for (let c = 0; c < W; c++) cols.push(computeClues(grid.map(r => r[c])));
  return { rowClues: rows, colClues: cols };
}

const _cache = {};
function placements(clue, n) {
  const key = clue.join(',') + '|' + n;
  if (_cache[key]) return _cache[key];
  const blocks = clue[0] === 0 ? [] : clue;
  const res = [];
  const place = (bi, start, acc) => {
    if (bi === blocks.length) {
      const line = Array(n).fill(0);
      for (const [s, len] of acc) for (let i = 0; i < len; i++) line[s + i] = 1;
      res.push(line); return;
    }
    const remaining = blocks.slice(bi).reduce((a, b) => a + b, 0) + (blocks.length - bi - 1);
    for (let s = start; s + remaining <= n; s++) {
      acc.push([s, blocks[bi]]);
      place(bi + 1, s + blocks[bi] + 1, acc);
      acc.pop();
    }
  };
  place(0, 0, []);
  return (_cache[key] = res);
}

function lineForced(state, clue) {
  const n = state.length;
  const valid = placements(clue, n).filter(p => p.every((v, i) => state[i] === -1 || state[i] === v));
  if (!valid.length) return { contradiction: true };
  const forced = state.slice();
  for (let i = 0; i < n; i++) {
    if (forced[i] !== -1) continue;
    const v0 = valid[0][i];
    if (valid.every(p => p[i] === v0)) forced[i] = v0;
  }
  return { forced };
}

// Returns { solved, contradiction, grid }
function lineSolve(rowClues, colClues, W, H) {
  let grid = Array.from({ length: H }, () => Array(W).fill(-1));
  let changed = true;
  while (changed) {
    changed = false;
    for (let r = 0; r < H; r++) {
      const res = lineForced(grid[r], rowClues[r]);
      if (res.contradiction) return { contradiction: true };
      for (let c = 0; c < W; c++) if (res.forced[c] !== grid[r][c]) { grid[r][c] = res.forced[c]; changed = true; }
    }
    for (let c = 0; c < W; c++) {
      const col = grid.map(r => r[c]);
      const res = lineForced(col, colClues[c]);
      if (res.contradiction) return { contradiction: true };
      for (let r = 0; r < H; r++) if (res.forced[r] !== grid[r][c]) { grid[r][c] = res.forced[r]; changed = true; }
    }
  }
  const solved = grid.every(row => row.every(v => v !== -1));
  return { solved, contradiction: false, grid };
}

// Verify a picture grid is a fair, unique nonogram.
function verifyPicture(grid) {
  const H = grid.length, W = grid[0].length;
  const { rowClues, colClues } = cluesFromGrid(grid);
  const res = lineSolve(rowClues, colClues, W, H);
  if (res.contradiction) return { ok: false, reason: 'contradiction' };
  if (!res.solved) return { ok: false, reason: 'not line-solvable (needs guessing)', grid: res.grid };
  const matches = res.grid.every((row, r) => row.every((v, c) => v === grid[r][c]));
  return { ok: matches, reason: matches ? 'unique & line-solvable' : 'solves to a different grid' };
}

module.exports = { computeClues, cluesFromGrid, lineSolve, verifyPicture };
