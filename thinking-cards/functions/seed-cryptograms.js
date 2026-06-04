/**
 * One-time seed script: creates a Cryptograms category and 10 quote cards.
 *
 * Usage:  node seed-cryptograms.js
 */
const admin = require('firebase-admin');
if (admin.apps.length === 0) admin.initializeApp({ projectId: 'thinking-cards' });
const db = admin.firestore();

const CATEGORY = {
  name: 'Cryptograms',
  description: 'Decode substitution ciphers to reveal famous quotes about thinking, science, and philosophy.',
  color: '#6c5ce7',
  order: 7,
  type: 'cryptogram',
};

const CARDS = [
  // ── Easy (short quotes, common words) ─────────────────────────
  {
    cardNumber: 1,
    difficulty: 'Easy',
    questionText: 'The Unexamined Life',
    cryptogramPlaintext: 'The unexamined life is not worth living.',
    cryptogramAuthor: 'Socrates',
    explanation: 'Socrates spoke these words at his trial in 399 BC, as recorded in Plato\'s Apology. Rather than beg for mercy, he argued that a life without questioning, self-reflection, and the pursuit of wisdom has no real value. This idea became the foundation of Western philosophy — that thinking critically about how we live is itself what makes life meaningful.',
  },
  {
    cardNumber: 2,
    difficulty: 'Easy',
    questionText: 'Knowledge and Wonder',
    cryptogramPlaintext: 'I know that I know nothing.',
    cryptogramAuthor: 'Socrates',
    explanation: 'Known as the Socratic paradox, this phrase captures the idea that true wisdom begins with recognizing the limits of your own knowledge. The Oracle at Delphi declared Socrates the wisest man in Athens — he concluded it was because he alone knew how much he didn\'t know. It\'s a reminder that intellectual humility is the starting point of real learning.',
  },
  {
    cardNumber: 3,
    difficulty: 'Easy',
    questionText: 'Thinking Into Being',
    cryptogramPlaintext: 'I think therefore I am.',
    cryptogramAuthor: 'Rene Descartes',
    explanation: 'Written in Latin as "Cogito, ergo sum," this is philosophy\'s most famous one-liner. Descartes arrived at it by doubting everything — the world, his body, even mathematics — until he found the one thing he couldn\'t doubt: that he was doubting. The very act of thinking proved he existed. It became the bedrock of modern philosophy and the starting point for understanding consciousness.',
  },

  // ── Medium (longer quotes, less common words) ─────────────────
  {
    cardNumber: 4,
    difficulty: 'Medium',
    questionText: 'Imagination Over Knowledge',
    cryptogramPlaintext: 'Imagination is more important than knowledge. Knowledge is limited. Imagination encircles the world.',
    cryptogramAuthor: 'Albert Einstein',
    explanation: 'Einstein said this in a 1929 Saturday Evening Post interview. Coming from the man who revolutionized physics, it\'s a striking claim: knowledge tells you what is, but imagination lets you see what could be. His own breakthroughs — like envisioning himself riding a beam of light — came from thought experiments, not textbooks. It\'s a reminder that creativity drives discovery.',
  },
  {
    cardNumber: 5,
    difficulty: 'Medium',
    questionText: 'The Measure of Intelligence',
    cryptogramPlaintext: 'The measure of intelligence is the ability to change.',
    cryptogramAuthor: 'Albert Einstein',
    explanation: 'Often attributed to Einstein, this quote challenges the idea that intelligence is about how much you know. Instead, it\'s about adaptability — the willingness to update beliefs, abandon failed approaches, and grow. In science, the greatest minds are those who can let go of elegant theories when the evidence points elsewhere.',
  },
  {
    cardNumber: 6,
    difficulty: 'Medium',
    questionText: 'Extraordinary Claims',
    cryptogramPlaintext: 'Extraordinary claims require extraordinary evidence.',
    cryptogramAuthor: 'Carl Sagan',
    explanation: 'Sagan popularized this principle (originally from Laplace and Hume) in his show Cosmos. It\'s a cornerstone of scientific skepticism: the more surprising a claim, the stronger the proof needs to be. Saying "I had coffee today" needs little evidence. Saying "aliens visited me" requires much more. It teaches us to scale our skepticism to the boldness of the claim.',
  },
  {
    cardNumber: 7,
    difficulty: 'Medium',
    questionText: 'Pale Blue Dot',
    cryptogramPlaintext: 'Look again at that dot. That is here. That is home. That is us.',
    cryptogramAuthor: 'Carl Sagan',
    explanation: 'In 1990, at Sagan\'s request, Voyager 1 turned its camera back toward Earth from 6 billion kilometers away. Our planet appeared as a tiny speck — a pale blue dot suspended in a sunbeam. Sagan\'s reflection on that image became one of the most humbling passages ever written, urging us to treat each other with kindness on the only home we\'ve ever known.',
  },

  // ── Hard (long quotes, unusual vocabulary) ────────────────────
  {
    cardNumber: 8,
    difficulty: 'Hard',
    questionText: 'The Cosmos Within',
    cryptogramPlaintext: 'The nitrogen in our DNA, the calcium in our teeth, the iron in our blood, the carbon in our apple pies were made in the interiors of collapsing stars.',
    cryptogramAuthor: 'Carl Sagan',
    explanation: 'This is Sagan\'s poetic way of explaining stellar nucleosynthesis — the fact that every heavy element in your body was forged inside a star that exploded billions of years ago. Carbon, iron, calcium: all cooked in nuclear furnaces and scattered across the cosmos. We are, quite literally, made of star stuff. It connects the grandest scales of the universe to the most intimate parts of ourselves.',
  },
  {
    cardNumber: 9,
    difficulty: 'Hard',
    questionText: 'Science and Beauty',
    cryptogramPlaintext: 'Science is not only compatible with spirituality; it is a profound source of spirituality.',
    cryptogramAuthor: 'Carl Sagan',
    explanation: 'Sagan argued that wonder and awe — feelings often associated with religion — are exactly what science delivers. Understanding that the universe is 13.8 billion years old, that we share DNA with every living thing, that light from distant galaxies has traveled millions of years to reach our eyes: these truths inspire a reverence that rivals any sacred text.',
  },
  {
    cardNumber: 10,
    difficulty: 'Hard',
    questionText: 'Two Things Are Infinite',
    cryptogramPlaintext: 'Two things are infinite: the universe and human stupidity; and I am not sure about the universe.',
    cryptogramAuthor: 'Albert Einstein',
    explanation: 'This witty remark (whose exact attribution is debated) captures Einstein\'s frustration with humanity\'s capacity for foolishness — even as he marveled at the cosmos. It\'s a joke with teeth: we can split the atom and photograph black holes, yet still repeat the same mistakes. It reminds us that intelligence without wisdom is never enough.',
  },
];

async function seed() {
  // 1. Create category
  const catRef = await db.collection('categories').add(CATEGORY);
  console.log(`Created category "${CATEGORY.name}" → ${catRef.id}`);

  // 2. Create cards
  const batch = db.batch();
  for (const card of CARDS) {
    const ref = db.collection('cards').doc();
    batch.set(ref, { ...card, categoryId: catRef.id });
  }
  await batch.commit();
  console.log(`Seeded ${CARDS.length} cryptogram cards.`);
}

seed().catch(console.error);
