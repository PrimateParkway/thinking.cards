/**
 * Updates the existing Codebreakers puzzles in place with the harder, validated
 * boards from seed-codebreakers.js — WITHOUT creating a duplicate category.
 *
 * For each puzzle card (cardNumber 1-20) it overwrites only `codebreakerAnswer`
 * and `codebreakerClues`. The instruction card (#0), titles, and difficulty are
 * left untouched. Player progress lives in a separate collection and is not
 * affected here (though anyone mid-puzzle will see the new code).
 *
 * Usage:  node update-codebreakers.js
 */
const admin = require('firebase-admin');
if (admin.apps.length === 0) admin.initializeApp({ projectId: 'thinking-cards' });
const db = admin.firestore();

const { CATEGORY, EASY, MEDIUM, HARD, EXTREME } = require('./seed-codebreakers');
const PUZZLES = [...EASY, ...MEDIUM, ...HARD, ...EXTREME];

async function findCategoryId() {
  const snap = await db.collection('categories').where('name', '==', CATEGORY.name).get();
  if (snap.empty) throw new Error(`Category "${CATEGORY.name}" not found.`);
  const codebreaker = snap.docs.find(d => d.data().type === 'codebreaker') ?? snap.docs[0];
  if (snap.size > 1) console.log(`⚠  ${snap.size} categories named "${CATEGORY.name}"; using ${codebreaker.id}`);
  return codebreaker.id;
}

async function run() {
  const categoryId = await findCategoryId();
  console.log(`Updating puzzles in category ${categoryId}`);

  const batch = db.batch();
  let updated = 0;
  let missing = 0;

  for (const puzzle of PUZZLES) {
    const snap = await db
      .collection('cards')
      .where('categoryId', '==', categoryId)
      .where('cardNumber', '==', puzzle.cardNumber)
      .limit(1)
      .get();

    if (snap.empty) {
      console.log(`⚠  Card #${puzzle.cardNumber} (${puzzle.questionText}) not found — skipping`);
      missing++;
      continue;
    }

    batch.update(snap.docs[0].ref, {
      codebreakerAnswer: puzzle.codebreakerAnswer,
      codebreakerClues: puzzle.codebreakerClues,
    });
    console.log(`  #${String(puzzle.cardNumber).padStart(2)} ${puzzle.questionText} → ${puzzle.codebreakerAnswer} (${puzzle.codebreakerClues.length} clues)`);
    updated++;
  }

  await batch.commit();
  console.log(`\n✅  Updated ${updated} puzzles${missing ? `, ${missing} missing` : ''}.`);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
