/**
 * Replaces the 24 Knights & Knaves puzzles in place with the themed set from
 * _gen/knights-new.json (whodunnit + role statements, not just knight/knave).
 * Matches existing cards by cardNumber (2-25); the instruction card is untouched.
 *
 * Usage:  node update-knights.js
 */
const admin = require('firebase-admin');
if (admin.apps.length === 0) admin.initializeApp({ projectId: 'thinking-cards' });
const db = admin.firestore();
const { FieldValue } = admin.firestore;

const PUZZLES = require('./_gen/knights-new.json');

async function run() {
  const cats = await db.collection('categories').get();
  let categoryId;
  cats.forEach(d => { if (d.data().name === 'Knights & Knaves') categoryId = d.id; });
  if (!categoryId) throw new Error('Knights & Knaves category not found');

  const batch = db.batch();
  let updated = 0, missing = 0;
  for (let i = 0; i < PUZZLES.length; i++) {
    const p = PUZZLES[i];
    const cardNumber = i + 2; // instruction card is #1
    const snap = await db.collection('cards')
      .where('categoryId', '==', categoryId)
      .where('cardNumber', '==', cardNumber)
      .limit(1).get();
    if (snap.empty) { console.log(`⚠  #${cardNumber} not found`); missing++; continue; }

    const data = {
      difficulty: p.difficulty,
      questionText: p.questionText,
      knightsScenario: p.knightsScenario,
      knightsCharacters: p.characters,
      knightsSolution: p.solution,
      knightsExplanation: p.explanation,
      knightsTagLabel: p.tagLabel ?? FieldValue.delete(),
      knightsTagSolution: p.tagSolution ?? FieldValue.delete(),
    };
    batch.update(snap.docs[0].ref, data);
    console.log(`  #${cardNumber} ${p.difficulty.padEnd(7)} "${p.questionText}"${p.tagLabel ? ' [' + p.tagLabel + ']' : ''}`);
    updated++;
  }
  await batch.commit();
  console.log(`\n✅  Updated ${updated} puzzles${missing ? `, ${missing} missing` : ''}.`);
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
