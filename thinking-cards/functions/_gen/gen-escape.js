/**
 * Escape-room authoring + verifier.
 *
 * A library of 12 word station types (riddle, trivia, definition, anagram,
 * Caesar known/unknown, Atbash, A1Z26 letter-numbers, reversed, disemvowel,
 * rail-fence, Vigenère) and 12 number station types (arithmetic, number-riddle,
 * Roman, binary, sequence, digital-root, clock, word-length, square-root,
 * remainder, nth-prime, factorial) is mixed differently across rooms so they
 * don't feel repetitive. Each station contributes one letter or digit; those
 * combine via the room's FINAL transform (direct / anagram / sort / cipher /
 * digit-shift) into the code. Every cipher is computed from plaintext (so it's
 * provably correct) and the assembled pieces are asserted to transform into the
 * final answer. Emits escape-rooms.json.
 *
 * Run:  node gen-escape.js            (verify + emit all rooms)
 *       node gen-escape.js --types    (list every station type)
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
function reversedS(title, plain, clue, hint) {
  const cipher = plain.toUpperCase().split('').reverse().join('');
  return { title, kind: 'reversed', prompt: `Written backwards — reverse it to find ${clue}: ${spaced(cipher)}`,
    answer: plain, takeChar: take(plain), hint: join('How it works: read the letters from right to left.', hint),
    reveal: `${cipher} reversed spells ${plain.toUpperCase()}.` };
}
function disemvowelS(title, plain, clue, hint) {
  const cipher = plain.toUpperCase().replace(/[AEIOU]/g, '');
  return { title, kind: 'disemvowel', prompt: `The vowels have been stripped out — put them back to find ${clue}: ${spaced(cipher)}`,
    answer: plain, takeChar: take(plain), hint: join('How it works: only the consonants remain. Slot the vowels A, E, I, O, U back in until it reads as a word.', hint),
    reveal: `Restoring the vowels of ${cipher} spells ${plain.toUpperCase()}.` };
}
function railEncode(plain) {
  const up = plain.toUpperCase().replace(/[^A-Z]/g, '');
  let top = '', bot = '';
  for (let i = 0; i < up.length; i++) (i % 2 === 0 ? top += up[i] : bot += up[i]);
  return top + bot;
}
function railfenceS(title, plain, clue, hint) {
  const cipher = railEncode(plain);
  const primer = 'How a rail-fence works: the letters were written in a two-row zig-zag (1st on top, 2nd on the bottom, 3rd on top…), then read off — all of the top row, then all of the bottom row. Split the code in half and interleave the two halves back together.';
  return { title, kind: 'railfence', prompt: `A two-row rail-fence cipher — unzip it to find ${clue}: ${spaced(cipher)}`,
    answer: plain, takeChar: take(plain), hint: join(primer, hint),
    reveal: `Interleaving the two rows of ${cipher} spells ${plain.toUpperCase()}.` };
}
function vigenereEncode(plain, key) {
  const up = plain.toUpperCase(); const k = key.toUpperCase(); let out = '', ki = 0;
  for (const c of up) {
    if (/[A-Z]/.test(c)) { out += A[(A.indexOf(c) + A.indexOf(k[ki % k.length])) % 26]; ki++; }
    else out += c;
  }
  return out;
}
function vigenereS(title, plain, key, clue, hint) {
  const cipher = vigenereEncode(plain, key);
  const primer = `How Vigenère works: write the keyword under the code, repeating it. Each key letter is a shift amount (A=0, B=1, C=2 …); shift each code letter back by its key letter to reveal the plaintext.`;
  return { title, kind: 'vigenere', prompt: `A Vigenère cipher with the keyword ${key.toUpperCase()} — decode ${clue}: ${spaced(cipher)}`,
    answer: plain, takeChar: take(plain), hint: join(primer, hint),
    reveal: `Decoding ${cipher} with key ${key.toUpperCase()} spells ${plain.toUpperCase()}.` };
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
function digitalRoot(n) { n = Math.abs(n); while (n >= 10) n = String(n).split('').reduce((a, d) => a + Number(d), 0); return n; }
function nthPrime(n) { const ps = []; let c = 2; while (ps.length < n) { if (ps.every(p => c % p !== 0)) ps.push(c); c++; } return ps[n - 1]; }
function factorial(n) { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f; }
function ordinal(n) { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
function sequenceS(title, seq, answer, clue, hint) {
  return numStation(title, 'sequence', `What single digit continues the pattern${clue ? ' (' + clue + ')' : ''}: ${seq.join(', ')}, ?`, answer, hint, `The pattern continues with ${answer}.`);
}
function digitalRootS(title, number, hint) {
  const dr = digitalRoot(number);
  return numStation(title, 'digitalroot', `Add the digits of ${number}, then keep adding until a single digit remains — its digital root.`, dr,
    join('How it works: sum the digits; if that still has more than one digit, sum again, and repeat until one digit is left.', hint), `The digital root of ${number} is ${dr}.`);
}
function clockS(title, start, add, hint) {
  const r = ((start + add - 1) % 12) + 1;
  return numStation(title, 'clock', `A clock reads ${start} o'clock. What hour will it show ${add} hours later, on a 12-hour clock?`, r, hint,
    `${add} hours after ${start} o'clock is ${r} o'clock.`);
}
function wordLengthS(title, word, clue, hint) {
  return numStation(title, 'wordlength', `How many letters are in the word ${word.toUpperCase()}${clue ? ', ' + clue : ''}?`, word.replace(/[^A-Za-z]/g, '').length, hint,
    `${word.toUpperCase()} has ${word.replace(/[^A-Za-z]/g, '').length} letters.`);
}
function sqrtS(title, square, hint) {
  const r = Math.round(Math.sqrt(square));
  if (r * r !== square) throw new Error(`not a perfect square: ${square}`);
  return numStation(title, 'sqrt', `What is the square root of ${square}?`, r, join('How it works: find the number that, multiplied by itself, gives this value.', hint), `√${square} = ${r}.`);
}
function remainderS(title, a, b, hint) {
  return numStation(title, 'remainder', `What is the remainder when ${a} is divided by ${b}?`, a % b,
    join('How it works: divide and keep only what is left over (the modulo).', hint), `${a} ÷ ${b} leaves a remainder of ${a % b}.`);
}
function primeS(title, n, hint) {
  const p = nthPrime(n);
  return numStation(title, 'prime', `What is the ${ordinal(n)} prime number?`, p,
    join('How it works: primes are whole numbers greater than 1 divisible only by 1 and themselves — 2, 3, 5, 7, 11…', hint), `The ${ordinal(n)} prime is ${p}.`);
}
function factorialS(title, n, hint) {
  const f = factorial(n);
  return numStation(title, 'factorial', `In how many different orders can ${n} distinct items be lined up (that is, ${n} factorial)?`, f,
    join('How it works: multiply every whole number from 1 up to n — for example 3 factorial = 1 × 2 × 3 = 6.', hint), `${n}! = ${f}.`);
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

  // ── Second set: varied themes showcasing the expanded library ──
  {
    cardNumber: 10, difficulty: 'Easy', questionText: "The Detective's Office",
    intro: "The office door locks behind you. Four scraps of a case file each hide a word — take the first letter of each to name what you must crack.",
    stations: [
      reversedS('The Backwards Memo', 'CLUE', 'what every detective hunts for', 'Four letters.'),
      a1z26S('The Numbered Alibi', 'ALIBI', "a suspect's claim to have been elsewhere", 'A is 1.'),
      caesarS('The Coded Culprit', 'SUSPECT', 2, true, 'the person the police are watching', 'Under suspicion.'),
      riddle('The Trace Left Behind', 'Fingerprints, fibres and footprints gathered at a crime scene are all this.', 'EVIDENCE', 'Proof of what happened.', 'It is EVIDENCE.'),
    ],
    final: finalDirect('CASE', 'Take the first letter of each answer, top to bottom.',
      { prompt: 'Spell what a detective works to crack.', hint: 'A mystery to solve; four letters.' }),
  },
  {
    cardNumber: 11, difficulty: 'Medium', questionText: 'The Starship Bridge',
    intro: "Alarms blare on the bridge. Five instruments each read out a digit — but the airlock only opens when they're set in order, smallest to largest.",
    stations: [
      sqrtS('The Hull Plate', 81, 'A plate is stamped with a square number.'),
      sequenceS('The Warning Lights', [9, 7, 5], 3, 'they fall by two', 'Count down.'),
      digitalRootS('The Reactor Code', 88, 'Reduce it to one digit.'),
      clockS('The Docking Clock', 10, 4, 'A twelve-hour dial.'),
      wordLengthS('The Ship Name', 'ROCKET', 'painted on the hull', 'Count the letters.'),
    ],
    final: finalSort('23679', 'The five digits come through jumbled — set them smallest to largest.',
      { prompt: 'Enter the airlock code with the digits in ascending order.', hint: 'Smallest digit first.' }),
  },
  {
    cardNumber: 12, difficulty: 'Hard', questionText: 'The Haunted Library',
    intro: "The library doors slam shut. Five mouldering volumes each surrender a letter, scrambled and encoded — decode them all, then rearrange the letters.",
    stations: [
      disemvowelS('The Vowelless Sign', 'OMEN', 'a foreboding sign of things to come', 'A bad sign.'),
      riddle('The Stone Chamber', 'A stone vault where the dead are laid to rest.', 'TOMB', 'A grave or crypt.', 'It is a TOMB.'),
      railfenceS('The Zig-Zag Epitaph', 'GHOUL', 'a grave-robbing spirit', 'It haunts graveyards.'),
      reversedS('The Mirror Writing', 'SHADE', 'another word for a ghost or spectre', 'A lingering spirit.'),
      vigenereS('The Keyed Curse', 'HAUNT', 'MOON', 'what a restless ghost does to a house', 'Ghosts do this to houses.'),
    ],
    final: finalAnagram('GHOST', 'The five first letters come out jumbled — rearrange them.',
      { prompt: 'Unscramble them to name what walks the library at night.', hint: 'A spooky spectre; five letters.' }),
  },
  {
    cardNumber: 13, difficulty: 'Extreme', questionText: 'The Bank Heist',
    intro: "You're inside the vault with minutes to spare. Six dials, and a scrawled warning: 'Every digit has crept forward by the same secret amount.' Solve them, find the step, and wind them back.",
    stations: [
      primeS('The Third Tumbler', 3),
      remainderS('The Leftover Dial', 23, 6),
      factorialS('The Arrangement Lock', 3),
      sqrtS('The Root Dial', 49),
      digitalRootS('The Reduced Code', 999),
      clockS('The Countdown Timer', 11, 3),
    ],
    final: finalDigitShift('112358', 4, false, 'Every digit has crept forward by the same secret amount, past 9 rolling back to 0. Find the step and wind them all back.',
      { prompt: "Enter the six-digit vault code once you've reversed the step.", hint: 'The Fibonacci sequence begins 1, 1, 2, 3, 5, 8…' }),
  },
];

// ── Type library self-test (node gen-escape.js --types) ─────────
if (process.argv.includes('--types')) {
  const word = [
    riddle('t', 'A clue…', 'RIVER'), trivia('t', 'Fact?', 'ROME'), definition('t', 'Meaning…', 'LOGIC'),
    anagramS('t', 'LISTEN', 'SILENT', 'to quiet.'), caesarS('t', 'ARSENIC', 3, true, 'a poison'),
    caesarS('t', 'IRONY', 5, false, 'a device'), atbashS('t', 'EMBER', true, 'a coal'),
    a1z26S('t', 'IDEA', 'a form'), reversedS('t', 'CLUE', 'a hint'), disemvowelS('t', 'OMEN', 'a sign'),
    railfenceS('t', 'GHOUL', 'a spirit'), vigenereS('t', 'HAUNT', 'MOON', 'to spook'),
  ];
  const num = [
    arithS('t', '5 + 4 - 7'), numRiddle('t', 'Muses?', 9), romanS('t', 3, ''), binaryS('t', 8, ''),
    sequenceS('t', [9, 7, 5], 3, 'down by 2'), digitalRootS('t', 88), clockS('t', 10, 4), wordLengthS('t', 'ROCKET', ''),
    sqrtS('t', 81), remainderS('t', 23, 6), primeS('t', 3), factorialS('t', 3),
  ];
  const show = arr => arr.forEach(s => process.stdout.write(`  ${String(s.kind).padEnd(14)} ans=${String(s.answer).padEnd(9)} take=${s.takeChar}  | ${s.prompt.slice(0, 78)}\n`));
  process.stdout.write(`WORD TYPES (${word.length}):\n`); show(word);
  process.stdout.write(`NUMBER TYPES (${num.length}):\n`); show(num);
  process.exit(0);
}

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
