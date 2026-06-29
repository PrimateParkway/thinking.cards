/**
 * Brings every difficulty-based puzzle category to 6 Easy / 6 Medium / 6 Hard /
 * 6 Extreme, in place. For each category it:
 *   - keeps the instruction card,
 *   - removes any puzzles in REMOVE,
 *   - appends the new puzzles from _gen/*.json to their difficulty group,
 *   - renumbers every puzzle so cardNumber runs Easy -> Extreme.
 *
 * Existing puzzle docs are updated (cardNumber only); new puzzles are created;
 * removed puzzles are deleted. Player progress is keyed by index, so anyone
 * mid-category may see cards shift — acceptable for a one-time content update.
 *
 * Usage:  node apply-puzzle-expansion.js --dry   (preview, no writes)
 *         node apply-puzzle-expansion.js         (apply)
 */
const admin = require('firebase-admin');
if (admin.apps.length === 0) admin.initializeApp({ projectId: 'thinking-cards' });
const db = admin.firestore();

const DRY = process.argv.includes('--dry');
const ORDER = ['Easy', 'Medium', 'Hard', 'Extreme'];
const load = f => require('./_gen/' + f);
const strip = o => { const c = { ...o }; for (const k of Object.keys(c)) if (k.startsWith('_')) delete c[k]; return c; };

const CONFIG = [
  { name: 'Codebreakers', newCards: load('codebreakers-new.json'), remove: [] },
  { name: 'Cryptograms',  newCards: load('cryptograms-new.json'),  remove: [] },
  { name: 'Nonograms',    newCards: load('nonograms-new.json').map(strip), remove: [] },
  { name: 'Logic Matrix', newCards: load('matrix-new.json'),       remove: ['Pet Adoption Day'] },
];

async function categoryIdByName(name) {
  const snap = await db.collection('categories').where('name', '==', name).get();
  if (snap.empty) throw new Error(`Category "${name}" not found`);
  return snap.docs[0].id;
}

function planCategory(existingDocs, cfg) {
  // Split instruction card (no difficulty) from puzzles.
  const docs = existingDocs.map(d => ({ ref: d.ref, data: d.data() }));
  const instr = docs.filter(d => !d.data.difficulty).sort((a, b) => (a.data.cardNumber ?? 0) - (b.data.cardNumber ?? 0));
  const puzzles = docs.filter(d => d.data.difficulty);

  const removed = puzzles.filter(d => cfg.remove.includes(d.data.questionText));
  const kept = puzzles.filter(d => !cfg.remove.includes(d.data.questionText));

  // Group kept existing puzzles by difficulty, preserving current order.
  const byDiff = {};
  for (const diff of ORDER) {
    byDiff[diff] = kept.filter(d => d.data.difficulty === diff)
      .sort((a, b) => (a.data.cardNumber ?? 0) - (b.data.cardNumber ?? 0));
  }
  // Append new puzzles to their difficulty group.
  const newByDiff = {};
  for (const diff of ORDER) newByDiff[diff] = cfg.newCards.filter(c => c.difficulty === diff);

  // Assign sequential numbers: instruction first (keep its number), then puzzles.
  const instrNum = instr.length ? (instr[0].data.cardNumber ?? 1) : 1;
  let n = instrNum + 1;
  const updates = []; // { ref, cardNumber } existing
  const creates = []; // { card } new
  const counts = {};

  for (const diff of ORDER) {
    counts[diff] = byDiff[diff].length + newByDiff[diff].length;
    for (const d of byDiff[diff]) updates.push({ ref: d.ref, cardNumber: n++, title: d.data.questionText, diff });
    for (const c of newByDiff[diff]) creates.push({ cardNumber: n++, card: c, diff });
  }
  return { instr, instrNum, removed, updates, creates, counts };
}

async function run() {
  console.log(DRY ? '── DRY RUN (no writes) ──\n' : '── APPLYING ──\n');
  const batch = DRY ? null : db.batch();
  let totalRemove = 0, totalCreate = 0, totalUpdate = 0;

  for (const cfg of CONFIG) {
    const categoryId = await categoryIdByName(cfg.name);
    const snap = await db.collection('cards').where('categoryId', '==', categoryId).get();
    const plan = planCategory(snap.docs, cfg);

    console.log(`${cfg.name}  (instruction #${plan.instrNum})`);
    console.log(`  counts -> ${ORDER.map(d => `${d}:${plan.counts[d]}`).join('  ')}`);
    for (const r of plan.removed) {
      console.log(`  REMOVE  "${r.data.questionText}" (${r.data.difficulty})`);
      if (!DRY) batch.delete(r.ref);
      totalRemove++;
    }
    for (const c of plan.creates) {
      console.log(`  CREATE  #${c.cardNumber} ${c.diff.padEnd(7)} "${c.card.questionText}"`);
      if (!DRY) batch.set(db.collection('cards').doc(), { ...c.card, cardNumber: c.cardNumber, categoryId });
      totalCreate++;
    }
    for (const u of plan.updates) {
      if (!DRY) batch.update(u.ref, { cardNumber: u.cardNumber });
      totalUpdate++;
    }
    console.log(`  renumbered ${plan.updates.length} existing puzzles\n`);
  }

  console.log(`Totals: ${totalCreate} created, ${totalRemove} removed, ${totalUpdate} renumbered.`);
  if (DRY) { console.log('\nDry run only — re-run without --dry to apply.'); process.exit(0); }
  await batch.commit();
  console.log('\n✅  Applied to Firestore.');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
