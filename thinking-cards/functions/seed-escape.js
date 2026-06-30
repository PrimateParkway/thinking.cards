/**
 * One-time seed: creates the "Escape Rooms" category, an instruction card, and
 * the room set from _gen/escape-rooms.json (authored + verified by gen-escape.js).
 * Each room's station answers combine — directly, by unscrambling, or via a
 * cipher — into the final lock.
 *
 * Usage:  node seed-escape.js
 */
const admin = require('firebase-admin');
if (admin.apps.length === 0) admin.initializeApp({ projectId: 'thinking-cards' });
const db = admin.firestore();

const ROOMS = require('./_gen/escape-rooms.json');

const CATEGORY = {
  name: 'Escape Rooms',
  description: 'Crack a handful of themed mini-puzzles, then combine their answers to open the final lock and escape.',
  color: '#00cec9',
  order: 13,
  type: 'escape',
};

const INSTRUCTIONS = {
  cardNumber: 1,
  questionText: 'How to Play Escape Rooms',
  explanation:
`Each room is a set of small puzzles — and one final lock that only opens once you combine their answers.

How to play:
• Solve each station: read its clue, type your answer, and tap Check. A solved station turns green and drops one letter into the Final Lock.
• Stations can be solved in any order. Stuck on one? Tap "Need a hint?" or skip ahead and come back.
• The Final Lock tells you how the pieces combine. Sometimes the letters spell the answer directly; harder rooms make you unscramble them or crack one last cipher.
• Enter the combined answer and tap Escape to escape the room!

Tap "I give up — show answers" to reveal every station and how the lock is cracked. The rooms get harder as you go — good luck!`,
};

async function seed() {
  const catRef = await db.collection('categories').add(CATEGORY);
  console.log(`Created category "${CATEGORY.name}" → ${catRef.id}`);
  const cards = [INSTRUCTIONS, ...ROOMS];
  const batch = db.batch();
  for (const card of cards) {
    const ref = db.collection('cards').doc();
    batch.set(ref, { ...card, categoryId: catRef.id });
  }
  await batch.commit();
  console.log(`Seeded ${cards.length} cards (1 instruction + ${ROOMS.length} rooms).`);
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
