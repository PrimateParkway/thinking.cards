const { verify } = require('./matrix-gen');

// ── HARD (4×4): Research Symposium ──────────────────────────────
const HARD = {
  difficulty: 'Hard',
  questionText: 'The Research Symposium',
  matrixScenario:
    'Four researchers each presented a talk in a different field, at a different time, and each comes from a different country. Work out who studies what, when they spoke, and where they are from.',
  categories: [
    { name: 'Researcher', items: ['Dr. Adler', 'Dr. Boyd', 'Dr. Chen', 'Dr. Eaton'] },
    { name: 'Field', items: ['Astronomy', 'Biology', 'Chemistry', 'Physics'] },
    { name: 'Time', items: ['9 AM', '10 AM', '11 AM', '1 PM'] },
    { name: 'Country', items: ['Canada', 'Japan', 'Kenya', 'Norway'] },
  ],
  clues: [
    { text: 'The astronomer gave the earliest talk, at 9 AM.',
      test: a => a.itemOf('Time', a.whoHas('Field', 'Astronomy')) === '9 AM' },
    { text: 'The biologist presented at 11 AM.',
      test: a => a.itemOf('Time', a.whoHas('Field', 'Biology')) === '11 AM' },
    { text: 'The chemist gave the final talk of the day, at 1 PM.',
      test: a => a.itemOf('Time', a.whoHas('Field', 'Chemistry')) === '1 PM' },
    { text: 'Dr. Adler presented at 10 AM.',
      test: a => a.itemOf('Time', 'Dr. Adler') === '10 AM' },
    { text: 'Dr. Boyd gave the last talk of the day.',
      test: a => a.itemOf('Time', 'Dr. Boyd') === '1 PM' },
    { text: 'Dr. Chen is from Japan.',
      test: a => a.itemOf('Country', 'Dr. Chen') === 'Japan' },
    { text: 'The researcher from Canada studies chemistry.',
      test: a => a.itemOf('Field', a.whoHas('Country', 'Canada')) === 'Chemistry' },
    { text: 'The biologist is from Kenya.',
      test: a => a.itemOf('Country', a.whoHas('Field', 'Biology')) === 'Kenya' },
  ],
  intended: {
    'Dr. Adler': { Field: 'Physics', Time: '10 AM', Country: 'Norway' },
    'Dr. Boyd': { Field: 'Chemistry', Time: '1 PM', Country: 'Canada' },
    'Dr. Chen': { Field: 'Astronomy', Time: '9 AM', Country: 'Japan' },
    'Dr. Eaton': { Field: 'Biology', Time: '11 AM', Country: 'Kenya' },
  },
};

// ── EXTREME (tricky 4×4): The Summit Expedition ─────────────────
const EXTREME = {
  difficulty: 'Extreme',
  questionText: 'The Summit Expedition',
  matrixScenario:
    'Four climbers each summited a different peak in a different year, each wearing a different color of gear. The clues are indirect — work from what they rule out. Deduce each climber\'s peak, year, and gear color.',
  categories: [
    { name: 'Climber', items: ['Ama', 'Bruno', 'Lena', 'Tariq'] },
    { name: 'Peak', items: ['Denali', 'Elbrus', 'Kilimanjaro', 'Vinson'] },
    { name: 'Year', items: ['2018', '2019', '2020', '2021'] },
    { name: 'Color', items: ['Amber', 'Crimson', 'Teal', 'Violet'] },
  ],
  clues: [
    { text: 'The climber wearing teal summited Kilimanjaro.',
      test: a => a.itemOf('Peak', a.whoHas('Color', 'Teal')) === 'Kilimanjaro' },
    { text: 'Whoever summited Vinson did so in 2021.',
      test: a => a.itemOf('Year', a.whoHas('Peak', 'Vinson')) === '2021' },
    { text: 'The climber in crimson made the earliest expedition, in 2018.',
      test: a => a.itemOf('Year', a.whoHas('Color', 'Crimson')) === '2018' },
    { text: 'Tariq summited the year immediately before Ama did.',
      test: a => a.rank('Year', a.itemOf('Year', 'Tariq')) === a.rank('Year', a.itemOf('Year', 'Ama')) - 1 },
    { text: 'Bruno made the earliest expedition of the four.',
      test: a => a.itemOf('Year', 'Bruno') === '2018' },
    { text: 'Lena summited Vinson.',
      test: a => a.itemOf('Peak', 'Lena') === 'Vinson' },
    { text: 'Neither Bruno nor Tariq summited Kilimanjaro.',
      test: a => a.itemOf('Peak', 'Bruno') !== 'Kilimanjaro' && a.itemOf('Peak', 'Tariq') !== 'Kilimanjaro' },
    { text: 'The climber who summited Elbrus went the year immediately after Bruno.',
      test: a => a.rank('Year', a.itemOf('Year', a.whoHas('Peak', 'Elbrus'))) === a.rank('Year', a.itemOf('Year', 'Bruno')) + 1 },
    { text: 'Neither Ama nor Tariq wore amber.',
      test: a => a.itemOf('Color', 'Ama') !== 'Amber' && a.itemOf('Color', 'Tariq') !== 'Amber' },
  ],
  intended: {
    'Ama': { Peak: 'Kilimanjaro', Year: '2020', Color: 'Teal' },
    'Bruno': { Peak: 'Denali', Year: '2018', Color: 'Crimson' },
    'Lena': { Peak: 'Vinson', Year: '2021', Color: 'Amber' },
    'Tariq': { Peak: 'Elbrus', Year: '2019', Color: 'Violet' },
  },
};

module.exports = [HARD, EXTREME];

if (require.main === module) {
  for (const p of [HARD, EXTREME]) {
    const r = verify(p);
    console.log(`${p.difficulty.padEnd(7)} "${p.questionText}"  solutions=${r.count}  unique=${r.unique}  matchesIntended=${r.matchesIntended}`);
    if (!r.unique) console.log('   >>> NOT UNIQUE');
    else if (!r.matchesIntended) console.log('   >>> unique but differs from intended:', JSON.stringify(r.solution));
  }
}
