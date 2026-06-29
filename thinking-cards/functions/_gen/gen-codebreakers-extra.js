const { generatePuzzle, validate } = require('../gen-codebreakers');

const EXISTING = {
  Easy: ['120','680','602','439','431'],
  Medium: ['2076','8023','5618','7451','2894'],
  Hard: ['80975','12680','46982','08934','60847'],
  Extreme: ['817209','509672','419368','739684','985067'],
};
const SPEC = [
  { difficulty: 'Easy',    L: 3, min: 4, max: 5, K: 3, title: 'Cold Open' },
  { difficulty: 'Medium',  L: 4, min: 5, max: 6, K: 3, title: 'Tumblers' },
  { difficulty: 'Hard',    L: 5, min: 6, max: 7, K: 4, title: 'Sealed Vault' },
  { difficulty: 'Extreme', L: 6, min: 7, max: 8, K: 4, title: "Cipher's End" },
];

const out = [];
let ok = true;
for (const s of SPEC) {
  let puzzle, v, tries = 0;
  do {
    const seed = (0x51ed270b ^ ((s.L * 7919 + (++tries)) * 2654435761)) >>> 0;
    puzzle = generatePuzzle(s.L, s.min, s.max, s.K, seed);
    v = validate(puzzle, s.L, s.K);
  } while ((EXISTING[s.difficulty].includes(puzzle.codebreakerAnswer) ||
            !(v.unique && v.noShortcut && v.noGiveaway && v.feedbackOk)) && tries < 5000);
  const pass = v.unique && v.noShortcut && v.noGiveaway && v.feedbackOk &&
               !EXISTING[s.difficulty].includes(puzzle.codebreakerAnswer);
  if (!pass) ok = false;
  out.push({ difficulty: s.difficulty, questionText: s.title, ...puzzle });
  process.stderr.write(`${s.difficulty.padEnd(7)} "${s.title}" ans=${puzzle.codebreakerAnswer} clues=${puzzle.codebreakerClues.length} minSubset=${v.minSize}(>=${s.K}) unique=${v.unique} noShortcut=${v.noShortcut} noGiveaway=${v.noGiveaway} fb=${v.feedbackOk}\n`);
}
require('fs').writeFileSync(__dirname + '/codebreakers-new.json', JSON.stringify(out, null, 2));
process.stderr.write(`\nValid: ${ok}\n`);
process.exit(ok ? 0 : 1);
