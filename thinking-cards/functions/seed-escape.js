/**
 * One-time seed: creates the "Escape Rooms" category, an instruction card, and
 * a pilot room. Each room has several stations whose answers combine (here:
 * the first letter of each) into a final lock.
 *
 * Usage:  node seed-escape.js
 */
const admin = require('firebase-admin');
if (admin.apps.length === 0) admin.initializeApp({ projectId: 'thinking-cards' });
const db = admin.firestore();

const CATEGORY = {
  name: 'Escape Rooms',
  description: 'Crack a handful of mini-puzzles, then combine their answers to open the final lock and escape.',
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
• Solve each station: read its clue, type your answer, and tap Check. A solved station turns green and drops one letter (or digit) into the Final Lock.
• Stations can be solved in any order. Stuck on one? Tap "Need a hint?" or skip ahead and come back.
• The Final Lock tells you how the pieces combine (for example, "the first letter of each answer"). Enter the combined answer and tap Escape.
• Solve the final lock to escape the room!

Tap "I give up — show answers" to reveal every station and how the lock is cracked. Good luck!`,
};

const ROOMS = [
  {
    cardNumber: 2,
    difficulty: 'Medium',
    questionText: "The Apothecary's Vault",
    escapeIntro: "Dusk falls and the apothecary's door clicks shut behind you. Four labelled drawers each hide a word. Find them, take the first letter of each, and spell the herb that opens the vault.",
    escapeStations: [
      { title: 'The Jumbled Label', prompt: "Rearrange the letters of LISTEN to spell a word meaning 'completely quiet'.",
        answer: 'SILENT', takeChar: 'S', hint: 'It starts with S and ends with T.', reveal: 'LISTEN is an anagram of SILENT.' },
      { title: 'The Cipher Vial', prompt: "A poison's name is written in cipher. Shift each letter back 3 places: D U V H Q L F.",
        answer: 'ARSENIC', takeChar: 'A', hint: 'A classic poison that begins with A.', reveal: 'Shifting DUVHQLF back by 3 letters gives ARSENIC.' },
      { title: 'The Warming Root', prompt: 'A knobbly root that warms the throat, settles the stomach, and spices many a tea. What is it?',
        answer: 'GINGER', takeChar: 'G', hint: "It's also a word for red hair.", reveal: 'The warming root is GINGER.' },
      { title: 'The Cure-All', prompt: 'Alchemists spent lifetimes seeking this fabled potion, said to cure any ill and grant eternal life.',
        answer: 'ELIXIR', takeChar: 'E', hint: 'Six letters, begins with E.', reveal: 'The fabled cure-all is the ELIXIR of life.' },
    ],
    escapeFinal: {
      rule: 'Take the first letter of each answer, from top to bottom.',
      prompt: 'Spell the herb — and word for "wise" — that unlocks the vault.',
      answer: 'SAGE',
      hint: "It's a herb, and also means wise.",
    },
  },
];

const norm = s => (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

function validate() {
  for (const room of ROOMS) {
    const assembled = room.escapeStations.map(s => norm(s.takeChar)).join('');
    const want = norm(room.escapeFinal.answer);
    if (assembled !== want) {
      throw new Error(`Room "${room.questionText}": station letters "${assembled}" != final "${want}"`);
    }
    for (const s of room.escapeStations) {
      if (norm(s.answer)[0] !== norm(s.takeChar)) {
        console.warn(`  note: ${room.questionText} / ${s.title}: takeChar ${s.takeChar} is not answer's first letter`);
      }
    }
    console.log(`✓ "${room.questionText}": ${assembled} = ${want}`);
  }
}

async function seed() {
  validate();
  const catRef = await db.collection('categories').add(CATEGORY);
  console.log(`Created category "${CATEGORY.name}" → ${catRef.id}`);

  const cards = [INSTRUCTIONS, ...ROOMS];
  const batch = db.batch();
  for (const card of cards) {
    const ref = db.collection('cards').doc();
    batch.set(ref, { ...card, categoryId: catRef.id });
  }
  await batch.commit();
  console.log(`Seeded ${cards.length} cards (1 instruction + ${ROOMS.length} room).`);
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
