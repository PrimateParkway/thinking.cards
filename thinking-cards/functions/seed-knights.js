/**
 * One-time seed: creates the "Knights & Knaves" category, an instruction card,
 * and 24 logic puzzles (6 Easy / 6 Medium / 6 Hard / 6 Extreme) generated and
 * validated by _gen/gen-knights.js (each has exactly one consistent solution).
 *
 * Usage:  node seed-knights.js
 */
const admin = require('firebase-admin');
if (admin.apps.length === 0) admin.initializeApp({ projectId: 'thinking-cards' });
const db = admin.firestore();

const PUZZLES = require('./_gen/knights-new.json');

const CATEGORY = {
  name: 'Knights & Knaves',
  description: 'Knights always tell the truth and knaves always lie. From what the islanders say, deduce who is which.',
  color: '#0984e3',
  order: 12,
  type: 'knights',
};

const INSTRUCTIONS = {
  cardNumber: 1,
  questionText: 'How to Play Knights & Knaves',
  explanation:
`Every islander is either a Knight or a Knave. Knights always tell the truth — every statement they make is true. Knaves always lie — every statement they make is false.

Read each islander's statement, then mark them as a Knight or a Knave using the toggle on their card.

How to solve:
• Try assuming an islander is a Knight — then everything they say must be true. Follow the consequences.
• If that leads to a contradiction, they must be a Knave instead, and everything they say is false.
• Cross-check statements about the others to pin everyone down.
• When every islander is labelled, tap Check.

Every puzzle has exactly one consistent answer. Tap Hint to reveal one islander, or give up to see the full walkthrough. Start with the Easy two-person puzzles and work your way up to the five-person Extreme riddles!`,
};

function buildCards() {
  // PUZZLES are already ordered Easy -> Extreme; number them after the instruction card.
  const cards = [INSTRUCTIONS];
  PUZZLES.forEach((p, i) => {
    cards.push({
      cardNumber: i + 2,
      difficulty: p.difficulty,
      questionText: p.questionText,
      knightsCharacters: p.characters,
      knightsSolution: p.solution,
      knightsExplanation: p.explanation,
    });
  });
  return cards;
}

async function seed() {
  const catRef = await db.collection('categories').add(CATEGORY);
  console.log(`Created category "${CATEGORY.name}" → ${catRef.id}`);

  const cards = buildCards();
  const batch = db.batch();
  for (const card of cards) {
    const ref = db.collection('cards').doc();
    batch.set(ref, { ...card, categoryId: catRef.id });
  }
  await batch.commit();
  console.log(`Seeded ${cards.length} cards (1 instruction + ${cards.length - 1} puzzles).`);
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
