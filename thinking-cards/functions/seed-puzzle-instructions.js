/**
 * One-time seed script: adds instructions cards (card #1) to existing Matrix and Cryptogram categories,
 * bumping existing card numbers up by 1.
 *
 * Usage:  node seed-puzzle-instructions.js
 */
const admin = require('firebase-admin');
if (admin.apps.length === 0) admin.initializeApp({ projectId: 'thinking-cards' });
const db = admin.firestore();

const MATRIX_CATEGORY_ID = '0Ser5Ko3vSvdCThoP4jb';
const CRYPTOGRAM_CATEGORY_ID = 'M8mMPIzZBV5tVx7KxkSt';

const MATRIX_INSTRUCTIONS = {
  cardNumber: 1,
  questionText: 'How to Play Logic Matrix',
  explanation:
`Logic matrix puzzles challenge you to figure out which items go together using only the clues provided.

You'll see a grid with rows and columns representing different categories (like people, colors, and pets). Your job is to mark which pairs match and which don't.

How to solve:
• Tap a cell once to mark X (these two do NOT go together)
• Tap again to mark a checkmark (these two DO go together)
• Tap a third time to clear the cell
• Each item matches exactly one item from every other category
• When you place a checkmark, you can X out the rest of that row and column
• Read each clue carefully — some tell you what IS true, others what ISN'T
• Tap a clue to strike it through once you've used it

Tips:
• Start with clues that give direct information ("Alice has a red car")
• Use elimination — if you can rule out all but one option, that's your answer
• Work across all sections of the grid, not just one at a time

Press "Check Grid" when you think you've solved it!`,
};

const CRYPTOGRAM_INSTRUCTIONS = {
  cardNumber: 1,
  questionText: 'How to Play Cryptograms',
  explanation:
`Cryptograms are substitution cipher puzzles. Each letter in the hidden quote has been replaced with a different letter — your job is to crack the code.

Every puzzle hides a real quote from a famous thinker. The same substitution is used throughout: if A becomes X in one place, every A in the quote is shown as X.

How to solve:
• Tap a cipher letter (shown in small text above) to select it
• Then tap a letter from the alphabet grid below to assign your guess
• Each letter can only be assigned once — if you reuse a letter, it moves from its previous spot
• Use the backspace button to clear your guess for the selected letter

Tips:
• Start with short words — one-letter words are usually "I" or "A"
• Look for common patterns: "THE", "AND", "THAT", double letters like "LL" or "SS"
• Apostrophes help too — endings like 'S, 'T, or 'RE narrow things down
• Pay attention to word length and letter frequency

Use hints if you get stuck — each hint reveals one correct letter. The puzzle is solved when every letter matches!`,
};

async function seed() {
  // Bump existing matrix cards
  const matrixCards = await db.collection('cards')
    .where('categoryId', '==', MATRIX_CATEGORY_ID)
    .get();

  const batch1 = db.batch();
  for (const doc of matrixCards.docs) {
    const data = doc.data();
    batch1.update(doc.ref, { cardNumber: data.cardNumber + 1 });
  }
  // Add instructions card
  const matrixRef = db.collection('cards').doc();
  batch1.set(matrixRef, { ...MATRIX_INSTRUCTIONS, categoryId: MATRIX_CATEGORY_ID });
  await batch1.commit();
  console.log(`Added instructions card to Matrix and bumped ${matrixCards.size} existing cards.`);

  // Bump existing cryptogram cards
  const cryptogramCards = await db.collection('cards')
    .where('categoryId', '==', CRYPTOGRAM_CATEGORY_ID)
    .get();

  const batch2 = db.batch();
  for (const doc of cryptogramCards.docs) {
    const data = doc.data();
    batch2.update(doc.ref, { cardNumber: data.cardNumber + 1 });
  }
  // Add instructions card
  const cryptoRef = db.collection('cards').doc();
  batch2.set(cryptoRef, { ...CRYPTOGRAM_INSTRUCTIONS, categoryId: CRYPTOGRAM_CATEGORY_ID });
  await batch2.commit();
  console.log(`Added instructions card to Cryptograms and bumped ${cryptogramCards.size} existing cards.`);
}

seed().catch(console.error);
