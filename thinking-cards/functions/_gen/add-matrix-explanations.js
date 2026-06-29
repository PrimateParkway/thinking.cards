const admin = require('firebase-admin');
if (admin.apps.length === 0) admin.initializeApp({ projectId: 'thinking-cards' });
const db = admin.firestore();

const EXPLANATIONS = {
  'The Research Symposium': [
    'Clues 1-3 tie each field to a time: Astronomy = 9 AM, Biology = 11 AM, Chemistry = 1 PM. That leaves the last field, Physics, in the remaining slot, 10 AM.',
    'Clue 4 puts Dr. Adler at 10 AM, so Adler is the physicist.',
    'Clue 5 says Dr. Boyd gave the last talk (1 PM), and clue 3 marks 1 PM as the chemist\'s slot — so Boyd studies Chemistry.',
    'Astronomy (9 AM) and Biology (11 AM) remain for Dr. Chen and Dr. Eaton. Clue 6 makes Chen Japanese, but clue 8 says the biologist is from Kenya, so Chen cannot be the biologist. Chen is the astronomer (9 AM) and Eaton is the biologist (11 AM).',
    'Countries: clue 6 gives Chen = Japan; clue 8 gives Eaton = Kenya; clue 7 gives Boyd (Chemistry) = Canada; the last country, Norway, goes to Adler.',
    'Final answer: Adler — Physics, 10 AM, Norway; Boyd — Chemistry, 1 PM, Canada; Chen — Astronomy, 9 AM, Japan; Eaton — Biology, 11 AM, Kenya.',
  ],
  'The Summit Expedition': [
    'Clue 6 puts Lena on Vinson, and clue 2 dates any Vinson climb to 2021 — so Lena summited in 2021.',
    'Clue 5 makes Bruno the earliest, in 2018. Clue 4 says Tariq climbed the year just before Ama, and the only consecutive years left are 2019 and 2020 — so Tariq = 2019 and Ama = 2020.',
    'Clue 7 keeps Bruno and Tariq off Kilimanjaro, and Lena is on Vinson, so Ama climbed Kilimanjaro. Clue 1 then gives Ama the teal gear.',
    'Clue 8 says the Elbrus climber went the year right after Bruno (2018) — that is 2019, which is Tariq. So Tariq climbed Elbrus, and Bruno took the remaining peak, Denali.',
    'Colors: clue 3 gives the 2018 climber, Bruno, crimson. Clue 9 keeps amber off Ama and Tariq, and Ama already wears teal, so amber goes to Lena. The last color, violet, goes to Tariq.',
    'Final answer: Ama — Kilimanjaro, 2020, Teal; Bruno — Denali, 2018, Crimson; Lena — Vinson, 2021, Amber; Tariq — Elbrus, 2019, Violet.',
  ],
};

(async () => {
  const cats = await db.collection('categories').get();
  let id; cats.forEach(d => { if (d.data().name === 'Logic Matrix') id = d.id; });
  const batch = db.batch();
  let n = 0;
  for (const [title, steps] of Object.entries(EXPLANATIONS)) {
    const snap = await db.collection('cards').where('categoryId', '==', id).where('questionText', '==', title).limit(1).get();
    if (snap.empty) { console.log(`⚠  "${title}" not found`); continue; }
    batch.update(snap.docs[0].ref, { matrixExplanation: steps });
    console.log(`  ${title} → ${steps.length} steps`);
    n++;
  }
  await batch.commit();
  console.log(`\n✅  Added explanations to ${n} puzzles.`);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
