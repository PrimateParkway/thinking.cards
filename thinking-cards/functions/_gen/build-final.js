const fs = require('fs');
const { verifyPicture } = require('./nonosolve');
const { verify } = require('./matrix-gen');

// ---------- Nonograms ----------
function P(strs){ return strs.map(s=>s.split('').map(ch=>ch==='#'?1:0)); }
const NONO = [
  { difficulty:'Easy', questionText:'Hidden Gem', cols:5, grid:P([
    '..#..','.###.','#####','.###.','..#..']),
    explanation:'Diamonds are the hardest natural material on Earth, formed up to 150 miles underground under crushing heat and pressure and carried upward by ancient volcanic eruptions. A diamond is pure carbon — the same element as pencil graphite — just locked into a far stronger crystal structure.' },
  { difficulty:'Medium', questionText:'Bright Idea', cols:8, grid:P([
    '..####..','.######.','########','########','.######.','..####..','...##...','...##...']),
    explanation:'Thomas Edison did not invent the first light bulb, but in 1879 he built the first commercially practical one by finding a carbon filament that could glow for hundreds of hours. The glowing bulb has since become the universal symbol for a sudden flash of insight.' },
  { difficulty:'Hard', questionText:'Boo!', cols:10, grid:P([
    '...####...','..######..','.########.','.##.##.##.','.########.','.########.','.########.','.########.','.#.##.##.#','..#....#..']),
    explanation:'The image of a ghost draped in a white sheet traces back to old burial shrouds used to wrap the dead. By the Victorian era it had become a popular shortcut on stage for portraying a spirit, and the costume stuck around long after the custom faded.' },
  { difficulty:'Extreme', questionText:'Night Owl', cols:15, grid:P([
    '##...........##','###.........###','.#####...#####.','..###########..','.#############.','#####.###.#####','####.#.#.#.####','####.#.#.#.####','#####.###.#####','.#############.','..#########....','..###########..','...#########...','....#.....#....','...##.....##...']),
    explanation:'Owls can swivel their heads about 270 degrees thanks to extra neck vertebrae and special blood vessels that keep blood flowing even when the arteries are twisted. Fringed flight feathers break up the air over their wings, letting them swoop on prey in near silence.' },
];
let nonoOk = true;
const nonoOut = NONO.map(n => {
  const v = verifyPicture(n.grid);
  if (!v.ok) { nonoOk = false; console.error('NONO FAIL', n.questionText, v.reason); }
  const rows = n.grid.length, cols = n.grid[0].length;
  if (cols !== n.cols) { nonoOk = false; console.error('NONO COLS MISMATCH', n.questionText); }
  return { difficulty:n.difficulty, questionText:n.questionText,
    nonogramCols: cols, nonogramSolution: n.grid.flat(), explanation: n.explanation,
    _size:`${cols}x${rows}`, _verify:v.reason };
});
fs.writeFileSync(__dirname+'/nonograms-new.json', JSON.stringify(nonoOut,null,2));
nonoOut.forEach(n=>console.error(`NONO ${n.difficulty.padEnd(7)} "${n.questionText}" ${n._size} cells=${n.nonogramSolution.length} — ${n._verify}`));

// ---------- Matrix ----------
const mp = require('./matrix-puzzles');
function toGroups(cats){ return cats.map(c=>({name:c.name, items:c.items, labels:c.items})); }
let matOk = true;
const matOut = mp.map(p => {
  const v = verify(p);
  if (!v.unique || !v.matchesIntended) { matOk=false; console.error('MATRIX FAIL', p.questionText, v); }
  return { difficulty:p.difficulty, questionText:p.questionText, matrixScenario:p.matrixScenario,
    matrixGroups: toGroups(p.categories), matrixClues: p.clues.map(c=>c.text), matrixSolution: p.intended };
});
fs.writeFileSync(__dirname+'/matrix-new.json', JSON.stringify(matOut,null,2));
matOut.forEach((m,i)=>console.error(`MATRIX ${m.difficulty.padEnd(7)} "${m.questionText}" groups=${m.matrixGroups.length}x${m.matrixGroups[0].items.length} clues=${m.matrixClues.length}`));

console.error(`\nNonograms valid: ${nonoOk} | Matrix valid: ${matOk}`);
process.exit(nonoOk && matOk ? 0 : 1);
