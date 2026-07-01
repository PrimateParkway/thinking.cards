/**
 * Escape-room authoring + verifier.
 *
 * A library of station "types" (anagram, Caesar known/unknown shift, Atbash,
 * A1Z26 letter-numbers, riddle, trivia, definition) is mixed differently across rooms so they
 * don't feel repetitive. Each room's stations each contribute one letter; those
 * letters combine via the room's FINAL transform (direct / anagram-scramble /
 * cipher) into the password. This script computes every cipher from plaintext
 * (so they're provably correct) and asserts the assembled letters really do
 * transform into the final answer. Emits escape-rooms.json.
 *
 * Run:  node gen-escape.js
 */
const fs = require('fs');

// ── Cipher helpers ──────────────────────────────────────────────
const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function caesar(text, shift) {
  return text.toUpperCase().replace(/[A-Z]/g, c => A[(A.indexOf(c) + shift + 26) % 26]);
}
function atbash(text) {
  return text.toUpperCase().replace(/[A-Z]/g, c => A[25 - A.indexOf(c)]);
}
function a1z26(text) { return text.toUpperCase().split('').filter(c => /[A-Z]/.test(c)).map(c => A.indexOf(c) + 1).join(' '); }
const spaced = s => s.toUpperCase().split('').join(' ');
const norm = s => (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const multiset = s => norm(s).split('').sort().join('');

// ── "How it works" primers (added to hints so a player who doesn't
//    know the notation isn't simply stuck) ───────────────────────
const A1Z26_PRIMER = 'How it works: each number is a letter’s position in the alphabet — 1=A, 2=B, 3=C, … 26=Z. Count to that position for each number, then read the letters in order.';
const BINARY_PRIMER = 'How binary works: it is base-2. Reading right to left, the columns are worth 1, 2, 4, 8, 16… Add up the column values wherever there is a 1 — for example 1101 = 8 + 4 + 0 + 1 = 13.';
const ROMAN_PRIMER = 'How Roman numerals work: I=1, V=5, X=10, L=50, C=100, D=500, M=1000. A smaller numeral before a larger one subtracts (IV = 4); otherwise you add (VI = 6).';
const CAESAR_CRACK_PRIMER = 'How to crack it: every letter has moved the same number of steps along the alphabet. Try shifting each letter back by 1, then 2, then 3… until the letters read as a real word.';
const CAESAR_BACK_PRIMER = 'To shift a letter back, step earlier in the alphabet — e.g. D back 3 is A (D→C→B→A).';
const join = (a, b) => (a && b) ? `${a} ${b}` : (a || b);

// ── Station builders (each returns a card station object) ───────
function take(answer, ch) { return ch || norm(answer)[0]; }
const riddle = (title, prompt, answer, hint, reveal) =>
  ({ title, kind: 'riddle', prompt, answer, takeChar: take(answer), hint, reveal });
const trivia = (title, prompt, answer, hint, reveal) =>
  ({ title, kind: 'trivia', prompt, answer, takeChar: take(answer), hint, reveal });
const definition = (title, prompt, answer, hint, reveal) =>
  ({ title, kind: 'definition', prompt, answer, takeChar: take(answer), hint, reveal });
function anagramS(title, source, answer, clue, hint) {
  if (multiset(source) !== multiset(answer)) throw new Error(`anagram mismatch: ${source} vs ${answer}`);
  return { title, kind: 'anagram', prompt: `Rearrange ${source.toUpperCase()} ${clue}`, answer,
    takeChar: take(answer), hint, reveal: `${source.toUpperCase()} is an anagram of ${answer.toUpperCase()}.` };
}
function caesarS(title, plain, shift, told, clue, hint) {
  const cipher = caesar(plain, shift);
  const prompt = told
    ? `Shift each letter back ${shift} to read ${clue}: ${spaced(cipher)}`
    : `A fixed shift through the alphabet hides ${clue}. Crack it: ${spaced(cipher)}`;
  const fullHint = told ? join(CAESAR_BACK_PRIMER, hint) : join(CAESAR_CRACK_PRIMER, hint);
  return { title, kind: told ? 'caesar' : 'caesar-unknown', prompt, answer: plain, takeChar: take(plain),
    hint: fullHint, reveal: `${spaced(cipher)} shifted back ${shift} spells ${plain.toUpperCase()}.` };
}
function atbashS(title, plain, told, clue, hint) {
  const cipher = atbash(plain);
  const prompt = told
    ? `Mirror the alphabet (A=Z, B=Y...) to read ${clue}: ${spaced(cipher)}`
    : `${clue}: ${spaced(cipher)}`;
  return { title, kind: 'atbash', prompt, answer: plain, takeChar: take(plain), hint,
    reveal: `Mirroring ${spaced(cipher)} (A↔Z) spells ${plain.toUpperCase()}.` };
}
function a1z26S(title, plain, clue, hint) {
  return { title, kind: 'a1z26', prompt: `A code of numbers, each the position of a letter in the alphabet — decode ${clue}: ${a1z26(plain)}`,
    answer: plain, takeChar: take(plain), hint: join(A1Z26_PRIMER, hint),
    reveal: `${a1z26(plain)} reads (1=A, 2=B…) as ${plain.toUpperCase()}.` };
}

// ── Number-station builders (each yields one digit) ─────────────
function calc(expr) {
  if (!/^[-0-9+*/() ]+$/.test(expr)) throw new Error('bad expr ' + expr);
  // eslint-disable-next-line no-new-func
  return Function('return (' + expr + ')')();
}
function toBinary(n) { return n.toString(2); }
function toRoman(n) {
  const map = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let r = ''; for (const [v, s] of map) while (n >= v) { r += s; n -= v; } return r;
}
function numStation(title, kind, prompt, digit, hint, reveal) {
  if (digit < 0 || digit > 9) throw new Error(`digit out of range: ${digit}`);
  return { title, kind, prompt, answer: String(digit), takeChar: String(digit), hint, reveal };
}
const numRiddle = (title, prompt, digit, hint, reveal) => numStation(title, 'number', prompt, digit, hint, reveal);
function binaryS(title, value, clue, hint) {
  return numStation(title, 'binary', `Convert the binary number ${toBinary(value)} to a decimal digit${clue ? ', ' + clue : ''}.`, value, join(BINARY_PRIMER, hint), `Binary ${toBinary(value)} is ${value}.`);
}
function romanS(title, value, clue, hint) {
  return numStation(title, 'roman', `What digit is the Roman numeral ${toRoman(value)}${clue ? ', ' + clue : ''}?`, value, join(ROMAN_PRIMER, hint), `${toRoman(value)} is ${value}.`);
}
function arithS(title, expr, hint) {
  const v = calc(expr);
  return numStation(title, 'arithmetic', `What is ${expr.replace(/\*/g, '×')}?`, v, hint, `${expr.replace(/\*/g, '×')} = ${v}.`);
}
const sortDigits = s => norm(s).split('').sort().join('');
const shiftDigits = (s, k) => norm(s).split('').map(c => String((Number(c) + k + 10) % 10)).join('');

// ── Final transforms ────────────────────────────────────────────
function finalDirect(answer, rule, hint) { return { kind: 'direct', rule, prompt: hint.prompt, answer, hint: hint.hint }; }
function finalAnagram(answer, rule, hint) { return { kind: 'anagram', rule, prompt: hint.prompt, answer, hint: hint.hint }; }
function finalAtbash(answer, rule, hint) { return { kind: 'atbash', rule, prompt: hint.prompt, answer, hint: hint.hint }; }
function finalSort(answer, rule, hint) { return { kind: 'sortAsc', rule, prompt: hint.prompt, answer, hint: hint.hint }; }
function finalDigitShift(answer, shift, told, rule, hint) { return { kind: 'digitShift', shift, told, rule, prompt: hint.prompt, answer, hint: hint.hint }; }

// ── Rooms ───────────────────────────────────────────────────────
const ROOMS = [
  {
    cardNumber: 2, difficulty: 'Easy', questionText: "The Philosopher's Study",
    intro: "Socrates has locked his study and left four challenges. Take the first letter of each answer and spell what every philosopher hopes to become.",
    stations: [
      riddle('The Unshaken School', 'A school of ancient philosophy that taught calm acceptance of fate and mastery over the passions; its name now means coolly enduring hardship.', 'STOIC', 'Marcus Aurelius was one.', 'The school is STOIC (Stoicism).'),
      anagramS('The Cradle of Thought', 'HASTEN', 'ATHENS', 'to the Greek city where Socrates questioned everyone he met.', 'The home of the Academy.'),
      riddle('The Stinging Insect', 'Socrates called himself this insect, sent to sting a sluggish Athens awake with awkward questions.', 'GADFLY', 'A biting fly that pesters cattle.', 'He called himself a GADFLY.'),
      caesarS('The Study of Conduct', 'ETHICS', 3, true, 'the branch of philosophy about right and wrong', "Aristotle wrote one 'to Nicomachus'."),
    ],
    final: finalDirect('SAGE', 'Take the first letter of each answer, top to bottom.',
      { prompt: 'Spell the word for a wise thinker that unlocks the study.', hint: 'A wise one — also a herb.' }),
  },
  {
    cardNumber: 4, difficulty: 'Medium', questionText: "The Cartographer's Study",
    intro: "The map-maker's study locks tight at nightfall. Five charts each yield a letter — but the lock won't take them in order. Gather them, then set them straight.",
    stations: [
      anagramS('Narrow Waters', 'TRAITS', 'STRAIT', 'to a narrow channel of water between two seas.', 'A narrow sea passage.'),
      definition('The Equator Lines', 'The angular distance of a place north or south of the equator.', 'LATITUDE', 'Lines that run east–west.', 'It is LATITUDE.'),
      caesarS('The Coral Ring', 'ATOLL', 1, true, 'a ring-shaped coral island', 'A ring of coral.'),
      riddle('The Hot Zone', 'I am a line of latitude that names a sweltering zone; the Tropic of Cancer is one of me.', 'TROPIC', 'Tropic of Cancer / Capricorn.', 'The line is a TROPIC.'),
      trivia('The Compass Bearing', 'A horizontal bearing measured clockwise from due north, in degrees.', 'AZIMUTH', 'Begins with A; a surveyor’s term.', 'The bearing is the AZIMUTH.'),
    ],
    final: finalAnagram('ATLAS', 'Each answer gives its first letter — but jumbled. Unscramble the five letters.',
      { prompt: 'Unscramble them to name the book every map-maker binds together — and the Titan who holds up the sky.', hint: 'A book of maps.' }),
  },
  {
    cardNumber: 6, difficulty: 'Hard', questionText: "The Logician's Workshop",
    intro: "You're sealed inside the logician's workshop. Six puzzles each conceal a letter, scattered out of order — and not all of them give up their secret plainly.",
    stations: [
      anagramS('A Question of Character', 'MOLAR', 'MORAL', 'to a word meaning ethical — concerning right conduct.', 'The opposite of immoral.'),
      riddle("The Bath-time Cry", 'Archimedes is said to have leapt from his bath shouting this word — Greek for "I have found it!" — on grasping how to measure volume.', 'EUREKA', 'A cry of sudden discovery.', 'He cried EUREKA.'),
      a1z26S('The Numbered Direction', 'NORTH', 'the direction a compass needle seeks', 'A cardinal direction.'),
      caesarS('Socrates’ Weapon', 'IRONY', 5, false, 'Socrates’ favourite tactic — feigning ignorance to expose another’s', 'A figure of speech; he pretended to know nothing.'),
      trivia('The Spinning Sphere', 'A spherical model of the Earth that sits on a desk and turns on its axis.', 'GLOBE', 'It spins on a stand.', 'It is a GLOBE.'),
      definition("Reason’s Starting Point", 'A statement accepted as self-evidently true, taken without proof as the foundation of a logical system.', 'AXIOM', 'Euclid began his geometry with these.', 'It is an AXIOM.'),
    ],
    final: finalAnagram('ENIGMA', 'Collect the six first letters — they arrive scrambled. Rearrange them.',
      { prompt: 'Unscramble them to name a baffling riddle (and a famous WWII cipher machine).', hint: 'A puzzle; also a code device.' }),
  },
  {
    cardNumber: 8, difficulty: 'Extreme', questionText: "The Oracle's Antechamber",
    intro: "Torchlight flickers across the Oracle of Delphi's antechamber — the same Oracle that once named Socrates the wisest of all. Six relics each surrender a letter, but the final lock does not read them as they are.",
    stations: [
      definition('The Art of Argument', 'The branch of philosophy concerned with valid reasoning — distinguishing sound arguments from fallacies.', 'LOGIC', 'Aristotle is its father.', 'It is LOGIC.'),
      a1z26S('The Perfect Form', 'IDEA', 'what Plato called the perfect, eternal Forms behind all things', 'A thought; Plato’s Forms.'),
      riddle('The Paradox-Maker', 'The philosopher of Elea famous for paradoxes of motion — Achilles can never catch the tortoise.', 'ZENO', 'Four letters; a Greek of Elea.', 'It is ZENO of Elea.'),
      riddle('The Loyal Student', 'A soldier and historian, a devoted follower of Socrates, who recorded his teacher’s words in the Memorabilia.', 'XENOPHON', 'Begins with X; a pupil of Socrates.', 'It is XENOPHON.'),
      definition('Mere Belief', 'In Plato, mere belief or appearance (doxa), as opposed to true and certain knowledge.', 'OPINION', 'Everyone has one; few have knowledge.', 'It is OPINION.'),
      caesarS('Aristotle’s Excellence', 'VIRTUE', 9, false, 'the excellence of character Aristotle placed at the golden mean', 'Courage and temperance are examples; find the shift.'),
    ],
    final: finalAtbash('ORACLE', 'Hold the alphabet up to a mirror — the first letter wears the mask of the last (A↔Z, B↔Y) — and reflect the six letters.',
      { prompt: 'Reflect them to name the Delphic seer who called Socrates the wisest of men.', hint: 'A prophet who answers questions; mirror A↔Z.' }),
  },

  // ── Number-lock rooms (one per level) ─────────────────────────
  {
    cardNumber: 3, difficulty: 'Easy', questionText: 'The Numbered Safe',
    intro: "A small iron safe sits on the desk, its four dials waiting. Solve each clue for a single digit, then read them top to bottom.",
    stations: [
      romanS("The Chiselled Numeral", 3, 'carved above the door', 'Three strokes.'),
      numRiddle('The Nine Sisters', 'How many Muses did the ancient Greeks say inspired the arts and sciences?', 9, 'One more than eight.', 'There were 9 Muses.'),
      arithS('The Ledger Sum', '5 + 4 - 7', 'Work left to right.'),
      numRiddle('Four Corners', 'How many sides does a square have?', 4, 'Count the corners.', 'A square has 4 sides.'),
    ],
    final: finalDirect('3924', 'Read the four digits from top to bottom.',
      { prompt: 'Enter the four-digit combination.', hint: 'Just the digits, in order.' }),
  },
  {
    cardNumber: 5, difficulty: 'Medium', questionText: 'The Sorting Vault',
    intro: "Five tumblers each hide a digit — but this vault only opens when the digits are set in order. Find all five, then line them up from smallest to largest.",
    stations: [
      binaryS('The Binary Plate', 8, 'etched on a brass plate', 'Powers of two: 8, 4, 2, 1.'),
      numRiddle('The Three Graces', 'How many Graces (Charites) attended Aphrodite in Greek myth?', 3, 'A famous trio.', 'There were 3 Graces.'),
      numRiddle('The Cube', 'How many faces does a cube have?', 6, 'Like a die.', 'A cube has 6 faces.'),
      numRiddle('The Idle Number', 'Multiplying any number by this leaves it completely unchanged.', 1, 'The multiplicative identity.', 'It is 1.'),
      numRiddle('The Classical Elements', 'Empedocles taught that all things are made from this many elements: earth, water, air and fire.', 4, 'Earth, water, air, fire.', 'There are 4 elements.'),
    ],
    final: finalSort('13468', 'The five digits come out jumbled — arrange them from smallest to largest.',
      { prompt: 'Enter the five digits in ascending order.', hint: 'Smallest digit first.' }),
  },
  {
    cardNumber: 7, difficulty: 'Hard', questionText: 'The Cryptic Dial',
    intro: "Six dials, and a note: 'I have turned every digit forward by two.' Solve each clue, then wind the whole code back to where it began.",
    stations: [
      binaryS('The Binary Cog', 5, 'stamped inside the case', 'Powers of two: 4 + 1.'),
      numRiddle('The Three Fates', 'How many Fates (Moirai) spun, measured and cut the thread of life in Greek myth?', 3, 'Clotho, Lachesis, Atropos.', 'There were 3 Fates.'),
      numRiddle('Six Walls', 'How many sides does a hexagon have?', 6, 'Like a honeycomb cell.', 'A hexagon has 6 sides.'),
      numRiddle('The Trivium', 'The Trivium of the classical liberal arts — grammar, logic and rhetoric — comprises how many subjects?', 3, 'Grammar, logic, rhetoric.', 'The Trivium has 3 arts.'),
      numRiddle('The Week', 'How many days are there in a week?', 7, 'Monday through Sunday.', 'There are 7 days.'),
      numRiddle('The Lone Star', 'How many stars sit at the centre of our solar system?', 1, 'Look up by day.', 'Just 1 — the Sun.'),
    ],
    final: finalDigitShift('314159', 2, true, 'Every digit was turned forward by 2 (past 9 rolls back to 0). Wind each digit back by 2.',
      { prompt: "Enter the six-digit code once you've wound it back.", hint: 'The code is a famous circle constant — 3.14159…' }),
  },
  {
    cardNumber: 9, difficulty: 'Extreme', questionText: 'The Golden Lock',
    intro: "The final lock bears no instructions — only a note: 'Every digit has stepped forward by the same secret amount.' Solve the six clues, discover the step, and wind them all back.",
    stations: [
      numRiddle("Aristotle's Causes", 'Aristotle held that a full explanation of anything needs how many kinds of cause — material, formal, efficient and final?', 4, 'Material, formal, efficient, final.', 'There are 4 causes.'),
      binaryS('The Binary Seal', 9, 'pressed into the wax', 'Powers of two: 8 + 1.'),
      arithS('The Square', '2 * 2', 'A number times itself.'),
      romanS('The Single Stroke', 1, 'the smallest numeral', 'One line.'),
      numRiddle('Three Angles', 'How many sides does a triangle have?', 3, 'Count the corners.', 'A triangle has 3 sides.'),
      numRiddle('The Perfect Number', 'The Pythagoreans prized this smallest "perfect number", whose divisors 1, 2 and 3 add up to itself.', 6, '1 + 2 + 3 = it.', 'It is 6.'),
    ],
    final: finalDigitShift('161803', 3, false, 'Every digit has stepped forward by the same secret amount, past 9 rolling back to 0. Find the step and wind them all back.',
      { prompt: "Enter the six-digit code once you've found the step and reversed it.", hint: 'The golden ratio (φ) begins 1, 6, 1, 8, 0, 3…' }),
  },
];

// ── Verify + emit ───────────────────────────────────────────────
function assemble(room) { return room.stations.map(s => norm(s.takeChar)).join(''); }
function check(room) {
  const asm = assemble(room);
  const want = norm(room.final.answer);
  let ok, detail;
  switch (room.final.kind) {
    case 'direct': ok = asm === want; detail = `${asm} == ${want}`; break;
    case 'anagram': ok = multiset(asm) === multiset(want); detail = `${asm} ~ ${want} (anagram)`; break;
    case 'atbash': ok = atbash(asm) === want; detail = `atbash(${asm}) = ${atbash(asm)} == ${want}`; break;
    case 'caesar': ok = asm === caesar(want, room.final.shift); detail = `${asm} decodes to ${want}`; break;
    case 'sortAsc': ok = sortDigits(asm) === want; detail = `sort(${asm}) = ${sortDigits(asm)} == ${want}`; break;
    case 'digitShift': ok = shiftDigits(want, room.final.shift) === asm; detail = `shift(${want}, +${room.final.shift}) = ${shiftDigits(want, room.final.shift)} == assembled ${asm}`; break;
    default: ok = false; detail = 'unknown final kind';
  }
  return { ok, asm, detail };
}

let allOk = true;
const out = ROOMS.map(room => {
  const v = check(room);
  if (!v.ok) { allOk = false; process.stderr.write(`✗ ${room.questionText}: ${v.detail}\n`); }
  else process.stderr.write(`✓ ${room.difficulty.padEnd(7)} "${room.questionText}" [${room.stations.map(s => s.kind).join(', ')}] → ${room.final.kind}: ${v.detail}\n`);
  return {
    cardNumber: room.cardNumber,
    difficulty: room.difficulty,
    questionText: room.questionText,
    escapeIntro: room.intro,
    escapeStations: room.stations.map(s => ({
      title: s.title, prompt: s.prompt, answer: s.answer.toUpperCase(),
      takeChar: norm(s.takeChar), ...(s.hint ? { hint: s.hint } : {}), ...(s.reveal ? { reveal: s.reveal } : {}),
    })),
    escapeFinal: {
      rule: room.final.rule, prompt: room.final.prompt,
      answer: room.final.answer.toUpperCase(), ...(room.final.hint ? { hint: room.final.hint } : {}),
    },
  };
});

fs.writeFileSync(__dirname + '/escape-rooms.json', JSON.stringify(out, null, 2));
process.stderr.write(`\n${allOk ? 'ALL ROOMS VALID' : 'VALIDATION FAILED'} — wrote ${out.length} rooms.\n`);
if (!allOk) process.exit(1);
