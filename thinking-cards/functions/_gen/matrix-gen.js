// Logic-grid (matrix) puzzle authoring + uniqueness verifier.
// Each clue carries BOTH the player-facing text and a machine predicate, kept
// equivalent by hand. The solver brute-forces all assignments and asserts the
// clue set yields exactly one solution (and that it's the intended one).

// Generate all permutations of an array.
function perms(arr) {
  if (arr.length <= 1) return [arr.slice()];
  const out = [];
  arr.forEach((v, i) => {
    const rest = arr.slice(0, i).concat(arr.slice(i + 1));
    for (const p of perms(rest)) out.push([v, ...p]);
  });
  return out;
}

// Count solutions consistent with all clue predicates (cap early at 2).
// categories[0] is the primary; assignment aligns each other category's items
// to the primary item list by index.
function solve(puzzle) {
  const [primary, ...others] = puzzle.categories;
  const P = primary.items;
  const otherPerms = others.map(c => perms(c.items));
  const solutions = [];

  const api = (assign) => {
    // assign: { catName: { primaryItem: item } }
    const itemOf = (cat, p) => cat === primary.name ? p : assign[cat][p];
    const whoHas = (cat, item) => {
      if (cat === primary.name) return item;
      return P.find(p => assign[cat][p] === item);
    };
    const rank = (cat, item) => puzzle.categories.find(c => c.name === cat).items.indexOf(item);
    return { itemOf, whoHas, rank, primary: P };
  };

  const rec = (idx, assign) => {
    if (solutions.length > 1) return;
    if (idx === others.length) {
      const a = api(assign);
      if (puzzle.clues.every(cl => cl.test(a))) solutions.push(JSON.parse(JSON.stringify(assign)));
      return;
    }
    const cat = others[idx];
    for (const perm of otherPerms[idx]) {
      assign[cat.name] = {};
      P.forEach((p, i) => assign[cat.name][p] = perm[i]);
      rec(idx + 1, assign);
      if (solutions.length > 1) return;
    }
  };
  rec(0, {});
  return solutions;
}

function buildSolutionObject(puzzle, assign) {
  const [primary, ...others] = puzzle.categories;
  const sol = {};
  for (const p of primary.items) {
    sol[p] = {};
    for (const c of others) sol[p][c.name] = assign[c.name][p];
  }
  return sol;
}

function verify(puzzle) {
  const sols = solve(puzzle);
  const unique = sols.length === 1;
  let matchesIntended = false;
  if (unique && puzzle.intended) {
    const got = buildSolutionObject(puzzle, sols[0]);
    matchesIntended = JSON.stringify(got) === JSON.stringify(puzzle.intended);
  }
  return { count: sols.length, unique, matchesIntended, solution: unique ? buildSolutionObject(puzzle, sols[0]) : null };
}

module.exports = { perms, solve, verify, buildSolutionObject };
