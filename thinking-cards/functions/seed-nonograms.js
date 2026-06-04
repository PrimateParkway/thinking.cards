/**
 * One-time seed script: creates a Nonograms category and 16 cards (1 instructions + 15 puzzles).
 *
 * Usage:  node seed-nonograms.js
 */
const admin = require('firebase-admin');
if (admin.apps.length === 0) admin.initializeApp({ projectId: 'thinking-cards' });
const db = admin.firestore();

const CATEGORY = {
  name: 'Nonograms',
  description: 'Fill cells based on number clues to reveal hidden pictures. Also known as Picross or Griddlers.',
  color: '#e17055',
  order: 9,
  type: 'nonogram',
};

const CARDS = [
  // ── Instructions ────────────────────────────────────────────────
  {
    cardNumber: 1,
    questionText: 'How to Play Nonograms',
    explanation:
`Nonograms are picture logic puzzles. You have a grid of empty cells and number clues along each row and column.

The numbers tell you how many consecutive filled cells appear in that row or column. For example, a clue of "3 1" means there is a group of 3 filled cells, then at least one empty cell, then 1 filled cell.

How to solve:
• Tap a cell once to fill it (colored)
• Tap again to mark it with an X (definitely empty)
• Tap a third time to clear it back to empty
• Use the row and column clues together to deduce which cells must be filled
• Start with the largest clues — they constrain the most cells
• A clue of "0" means the entire row or column is empty

The puzzle is solved when every filled cell matches the hidden picture. X marks are optional — they just help you track which cells you've ruled out.

Start with the Easy 5×5 puzzles and work up to 10×10!`,
  },

  // ── Easy 5×5 ───────────────────────────────────────────────────
  {
    cardNumber: 2,
    difficulty: 'Easy',
    questionText: 'Heart',
    nonogramSolution: [
      [0, 1, 0, 1, 0],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [0, 1, 1, 1, 0],
      [0, 0, 1, 0, 0],
    ],
    explanation: 'The heart symbol has been used to represent love and affection since the Middle Ages. Its shape may have been inspired by the seed of the silphium plant, used as a contraceptive in ancient times.',
  },
  {
    cardNumber: 3,
    difficulty: 'Easy',
    questionText: 'Cross',
    nonogramSolution: [
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [1, 1, 1, 1, 1],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
    ],
    explanation: 'The plus or cross shape is one of the oldest and most universal symbols. It appears in cultures worldwide, from ancient cave paintings to modern first-aid signs.',
  },
  {
    cardNumber: 4,
    difficulty: 'Easy',
    questionText: 'Arrow',
    nonogramSolution: [
      [0, 0, 1, 0, 0],
      [0, 1, 1, 0, 0],
      [1, 1, 1, 1, 1],
      [0, 1, 1, 0, 0],
      [0, 0, 1, 0, 0],
    ],
    explanation: 'Arrows have been used as projectile weapons for over 10,000 years. The arrow symbol pointing right has become universally associated with "forward" or "next" in user interfaces.',
  },
  {
    cardNumber: 5,
    difficulty: 'Easy',
    questionText: 'Diamond',
    nonogramSolution: [
      [0, 0, 1, 0, 0],
      [0, 1, 1, 1, 0],
      [1, 1, 1, 1, 1],
      [0, 1, 1, 1, 0],
      [0, 0, 1, 0, 0],
    ],
    explanation: 'The diamond shape (rhombus) appears extensively in nature — from crystal structures to the patterns on a snake\'s back. In playing cards, diamonds represent the merchant class.',
  },
  {
    cardNumber: 6,
    difficulty: 'Easy',
    questionText: 'Smiley',
    nonogramSolution: [
      [0, 1, 1, 1, 0],
      [1, 0, 1, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 1, 0, 1, 1],
      [0, 1, 1, 1, 0],
    ],
    explanation: 'The smiley face was popularized in 1963 by graphic artist Harvey Ball, who was paid just $45 for the design. It became one of the most recognizable symbols of the 20th century.',
  },

  // ── Medium 8×8 ─────────────────────────────────────────────────
  {
    cardNumber: 7,
    difficulty: 'Medium',
    questionText: 'House',
    nonogramSolution: [
      [0, 0, 0, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 0, 0, 0, 0, 1, 1],
      [1, 1, 0, 1, 1, 0, 1, 1],
      [1, 1, 0, 1, 1, 0, 1, 1],
      [1, 1, 0, 1, 1, 0, 1, 1],
    ],
    explanation: 'The iconic house shape — a triangle roof on a square base — is one of the first things children learn to draw. Humans have built shelters for at least 400,000 years.',
  },
  {
    cardNumber: 8,
    difficulty: 'Medium',
    questionText: 'Tree',
    nonogramSolution: [
      [0, 0, 0, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 1, 1, 0, 0, 0],
      [0, 0, 0, 1, 1, 0, 0, 0],
      [0, 0, 0, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
    ],
    explanation: 'Trees are the longest-living organisms on Earth. The oldest known tree, a bristlecone pine named Methuselah, is over 4,850 years old — it was already ancient when the pyramids were built.',
  },
  {
    cardNumber: 9,
    difficulty: 'Medium',
    questionText: 'Anchor',
    nonogramSolution: [
      [0, 0, 0, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 1, 1, 0, 0, 0],
      [0, 0, 0, 1, 1, 0, 0, 0],
      [0, 1, 0, 1, 1, 0, 1, 0],
      [1, 1, 0, 1, 1, 0, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 0, 0, 1, 1, 0],
    ],
    explanation: 'The anchor has symbolized hope and steadfastness since early Christianity. Ancient Romans would hide the cross symbol inside anchor drawings to practice their faith in secret.',
  },
  {
    cardNumber: 10,
    difficulty: 'Medium',
    questionText: 'Cat',
    nonogramSolution: [
      [1, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 0, 0, 0, 0, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 1, 0, 0, 1, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 0, 1, 1, 0, 1, 1],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 0, 0, 1, 0, 0],
    ],
    explanation: 'Cats were first domesticated around 10,000 years ago in the Near East. In ancient Egypt, killing a cat was punishable by death — they were considered sacred animals associated with the goddess Bastet.',
  },
  {
    cardNumber: 11,
    difficulty: 'Medium',
    questionText: 'Rocket',
    nonogramSolution: [
      [0, 0, 0, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 1, 0, 0, 1, 0, 0],
      [0, 1, 0, 0, 0, 0, 1, 0],
    ],
    explanation: 'The first liquid-fueled rocket was launched by Robert Goddard in 1926. It flew for just 2.5 seconds and reached 41 feet — yet that brief flight opened the door to space exploration.',
  },

  // ── Hard 10×10 ─────────────────────────────────────────────────
  {
    cardNumber: 12,
    difficulty: 'Hard',
    questionText: 'Skull',
    nonogramSolution: [
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 0, 1, 1, 1, 1, 0, 1, 1],
      [1, 1, 0, 1, 1, 1, 1, 0, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 0, 1, 1, 0, 1, 1, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 0, 1, 0, 1, 1, 0, 1, 0, 0],
      [0, 0, 1, 0, 1, 1, 0, 1, 0, 0],
    ],
    explanation: 'The skull and crossbones symbol was used by pirates, but it was also an ancient symbol of transformation. Alchemists used it to represent the "death" stage of turning base metals into gold.',
  },
  {
    cardNumber: 13,
    difficulty: 'Hard',
    questionText: 'Lighthouse',
    nonogramSolution: [
      [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
      [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
      [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
      [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
      [1, 0, 0, 1, 1, 1, 1, 0, 0, 1],
      [1, 1, 0, 1, 1, 1, 1, 0, 1, 1],
      [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    explanation: 'The Lighthouse of Alexandria, one of the Seven Wonders of the Ancient World, stood over 100 meters tall. Its fire could be seen 50 kilometers out to sea, guiding sailors for nearly 1,000 years.',
  },
  {
    cardNumber: 14,
    difficulty: 'Hard',
    questionText: 'Sailboat',
    nonogramSolution: [
      [0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 1, 1, 0, 0, 0, 0, 0],
      [0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
      [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
      [0, 0, 0, 1, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
    ],
    explanation: 'Sailing is one of humanity\'s oldest forms of travel. The earliest known boats date back 8,000 years. The trade winds that powered ancient sailing routes were so reliable they shaped the course of civilization.',
  },
  {
    cardNumber: 15,
    difficulty: 'Hard',
    questionText: 'Crown',
    nonogramSolution: [
      [1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
      [1, 1, 0, 1, 0, 0, 1, 0, 1, 1],
      [1, 1, 0, 1, 1, 1, 1, 0, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 0, 1, 0, 0, 1, 0, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
    ],
    explanation: 'The British Imperial State Crown contains 2,868 diamonds, 17 sapphires, 11 emeralds, and 269 pearls. It weighs over 1 kilogram and is worn by the monarch at the State Opening of Parliament.',
  },
  {
    cardNumber: 16,
    difficulty: 'Hard',
    questionText: 'Chess Knight',
    nonogramSolution: [
      [0, 0, 1, 1, 1, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 0, 0, 0],
      [0, 1, 1, 0, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 0, 0, 1, 1, 1, 1, 0],
      [0, 0, 0, 0, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 0, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    ],
    explanation: 'The knight is the only chess piece that can jump over others. Its L-shaped move has fascinated mathematicians for centuries — the "Knight\'s Tour" problem (visiting every square once) was first studied by Euler in 1759.',
  },
];

function flattenSolution(card) {
  if (!card.nonogramSolution) return card;
  const grid = card.nonogramSolution;
  const cols = grid[0].length;
  const flat = grid.flat();
  return { ...card, nonogramSolution: flat, nonogramCols: cols };
}

async function seed() {
  // 1. Create category
  const catRef = await db.collection('categories').add(CATEGORY);
  console.log(`Created category "${CATEGORY.name}" → ${catRef.id}`);

  // 2. Create cards (flatten nested arrays for Firestore)
  const batch = db.batch();
  for (const card of CARDS) {
    const ref = db.collection('cards').doc();
    batch.set(ref, { ...flattenSolution(card), categoryId: catRef.id });
  }
  await batch.commit();
  console.log(`Seeded ${CARDS.length} nonogram cards.`);
}

seed().catch(console.error);
