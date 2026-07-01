/**
 * Replaces the Escape Rooms puzzle cards with the 4-room set (one per level)
 * from _gen/escape-rooms.json. Keeps the instruction card (#1); deletes any
 * existing room cards (cardNumber >= 2) and recreates rooms #2–#5.
 *
 * Usage:  node update-escape.js [--dry]
 */
const admin = require('firebase-admin');
if (admin.apps.length === 0) admin.initializeApp({ projectId: 'thinking-cards' });
const db = admin.firestore();
const DRY = process.argv.includes('--dry');
const ROOMS = require('./_gen/escape-rooms.json');

async function run() {
  const cats = await db.collection('categories').get();
  let categoryId;
  cats.forEach(d => { if (d.data().name === 'Escape Rooms') categoryId = d.id; });
  if (!categoryId) throw new Error('Escape Rooms category not found — run seed-escape.js first.');

  const snap = await db.collection('cards').where('categoryId', '==', categoryId).get();
  const oldRooms = snap.docs.filter(d => (d.data().cardNumber ?? 0) >= 2);

  console.log(`${DRY ? '[DRY] ' : ''}Deleting ${oldRooms.length} old room card(s), creating ${ROOMS.length}.`);
  if (DRY) {
    ROOMS.forEach(r => console.log(`  #${r.cardNumber} ${r.difficulty.padEnd(7)} "${r.questionText}" (${r.escapeStations.length} stations → ${r.escapeFinal.answer})`));
    process.exit(0);
  }

  const batch = db.batch();
  for (const d of oldRooms) batch.delete(d.ref);
  for (const r of ROOMS) {
    const ref = db.collection('cards').doc();
    batch.set(ref, { ...r, categoryId });
    console.log(`  + #${r.cardNumber} ${r.difficulty.padEnd(7)} "${r.questionText}" → ${r.escapeFinal.answer}`);
  }

  // Keep the instruction card's text current with the mechanics.
  const instr = snap.docs.find(d => (d.data().cardNumber ?? 0) === 1);
  if (instr) {
    batch.update(instr.ref, {
      explanation:
`Each room is a set of small puzzles — and one final lock that only opens once you combine their answers.

How to play:
• Solve each station: read its clue, type your answer, and tap Check. A solved station turns green and drops one letter or digit into the Final Lock.
• Stations can be solved in any order. Stuck? Tap "Need a hint?" — hints teach you how each code works. Skip ahead and come back any time.
• The Final Lock tells you how the pieces combine: sometimes read straight through, sometimes unscrambled, sorted, or decoded through one last cipher.
• Enter the combined answer and tap Escape!

Tap "I give up — show answers" to reveal every station and how the lock is cracked. The rooms run from Easy to Extreme — good luck!`,
    });
    console.log('  ~ refreshed instruction card');
  }
  await batch.commit();
  console.log(`\n✅  Escape Rooms updated to ${ROOMS.length} rooms.`);
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
