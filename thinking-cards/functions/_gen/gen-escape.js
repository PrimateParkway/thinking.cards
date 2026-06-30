/**
 * Escape-room authoring + verifier.
 *
 * A library of station "types" (anagram, Caesar known/unknown shift, Atbash,
 * Morse, riddle, trivia, definition) is mixed differently across rooms so they
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
const MORSE = { A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..' };
function morse(text) { return text.toUpperCase().split('').map(c => MORSE[c] || '?').join(' / '); }
const spaced = s => s.toUpperCase().split('').join(' ');
const norm = s => (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const multiset = s => norm(s).split('').sort().join('');

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
  return { title, kind: told ? 'caesar' : 'caesar-unknown', prompt, answer: plain, takeChar: take(plain),
    hint, reveal: `${spaced(cipher)} shifted back ${shift} spells ${plain.toUpperCase()}.` };
}
function atbashS(title, plain, told, clue, hint) {
  const cipher = atbash(plain);
  const prompt = told
    ? `Mirror the alphabet (A=Z, B=Y...) to read ${clue}: ${spaced(cipher)}`
    : `${clue}: ${spaced(cipher)}`;
  return { title, kind: 'atbash', prompt, answer: plain, takeChar: take(plain), hint,
    reveal: `Mirroring ${spaced(cipher)} (A↔Z) spells ${plain.toUpperCase()}.` };
}
function morseS(title, plain, clue, hint) {
  return { title, kind: 'morse', prompt: `Decode the Morse to find ${clue}: ${morse(plain)}`,
    answer: plain, takeChar: take(plain), hint, reveal: `The Morse spells ${plain.toUpperCase()}.` };
}

// ── Final transforms ────────────────────────────────────────────
function finalDirect(answer, rule, hint) { return { kind: 'direct', rule, prompt: hint.prompt, answer, hint: hint.hint }; }
function finalAnagram(answer, rule, hint) { return { kind: 'anagram', rule, prompt: hint.prompt, answer, hint: hint.hint }; }
function finalAtbash(answer, rule, hint) { return { kind: 'atbash', rule, prompt: hint.prompt, answer, hint: hint.hint }; }

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
    cardNumber: 3, difficulty: 'Medium', questionText: "The Cartographer's Study",
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
    cardNumber: 4, difficulty: 'Hard', questionText: "The Logician's Workshop",
    intro: "You're sealed inside the logician's workshop. Six puzzles each conceal a letter, scattered out of order — and not all of them give up their secret plainly.",
    stations: [
      anagramS('A Question of Character', 'MOLAR', 'MORAL', 'to a word meaning ethical — concerning right conduct.', 'The opposite of immoral.'),
      riddle("The Bath-time Cry", 'Archimedes is said to have leapt from his bath shouting this word — Greek for "I have found it!" — on grasping how to measure volume.', 'EUREKA', 'A cry of sudden discovery.', 'He cried EUREKA.'),
      morseS('The Tapped Direction', 'NORTH', 'the direction a compass needle seeks', 'A cardinal direction.'),
      caesarS('Socrates’ Weapon', 'IRONY', 5, false, 'Socrates’ favourite tactic — feigning ignorance to expose another’s', 'A figure of speech; he pretended to know nothing.'),
      trivia('The Spinning Sphere', 'A spherical model of the Earth that sits on a desk and turns on its axis.', 'GLOBE', 'It spins on a stand.', 'It is a GLOBE.'),
      definition("Reason’s Starting Point", 'A statement accepted as self-evidently true, taken without proof as the foundation of a logical system.', 'AXIOM', 'Euclid began his geometry with these.', 'It is an AXIOM.'),
    ],
    final: finalAnagram('ENIGMA', 'Collect the six first letters — they arrive scrambled. Rearrange them.',
      { prompt: 'Unscramble them to name a baffling riddle (and a famous WWII cipher machine).', hint: 'A puzzle; also a code device.' }),
  },
  {
    cardNumber: 5, difficulty: 'Extreme', questionText: "The Oracle's Antechamber",
    intro: "Torchlight flickers across the Oracle of Delphi's antechamber — the same Oracle that once named Socrates the wisest of all. Six relics each surrender a letter, but the final lock does not read them as they are.",
    stations: [
      definition('The Art of Argument', 'The branch of philosophy concerned with valid reasoning — distinguishing sound arguments from fallacies.', 'LOGIC', 'Aristotle is its father.', 'It is LOGIC.'),
      morseS('The Perfect Form', 'IDEA', 'what Plato called the perfect, eternal Forms behind all things', 'A thought; Plato’s Forms.'),
      riddle('The Paradox-Maker', 'The philosopher of Elea famous for paradoxes of motion — Achilles can never catch the tortoise.', 'ZENO', 'Four letters; a Greek of Elea.', 'It is ZENO of Elea.'),
      riddle('The Loyal Student', 'A soldier and historian, a devoted follower of Socrates, who recorded his teacher’s words in the Memorabilia.', 'XENOPHON', 'Begins with X; a pupil of Socrates.', 'It is XENOPHON.'),
      definition('Mere Belief', 'In Plato, mere belief or appearance (doxa), as opposed to true and certain knowledge.', 'OPINION', 'Everyone has one; few have knowledge.', 'It is OPINION.'),
      caesarS('Aristotle’s Excellence', 'VIRTUE', 9, false, 'the excellence of character Aristotle placed at the golden mean', 'Courage and temperance are examples; find the shift.'),
    ],
    final: finalAtbash('ORACLE', 'Hold the alphabet up to a mirror — the first letter wears the mask of the last (A↔Z, B↔Y) — and reflect the six letters.',
      { prompt: 'Reflect them to name the Delphic seer who called Socrates the wisest of men.', hint: 'A prophet who answers questions; mirror A↔Z.' }),
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
