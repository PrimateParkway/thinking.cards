/**
 * One-time script: fixes ALL card text to match the original PDF verbatim.
 *
 * Usage:  node fix-card-text.js
 */
const admin = require('firebase-admin');
if (admin.apps.length === 0) admin.initializeApp({ projectId: 'thinking-cards' });
const db = admin.firestore();

const updates = [
  // ── Moral Compass (ALL 10 cards) ─────────────────────────────────

  {
    docId: 'mMNMjbdTMzN38pj4L5tu',
    questionText:
      "Self Driving Sacrifice\n\n" +
      "You are programming an autonomous vehicle that must decide between swerving to avoid a pedestrian but hitting another car, or staying on course and potentially injuring the pedestrian.\n\n" +
      "How should the vehicle be programmed?"
  },
  {
    docId: 'Ucxl5EggmtBY9FtoIZB6',
    questionText:
      "Friend's Secret\n\n" +
      "Your close friend confides in you that they have been cheating on their partner for several months. They ask you to keep this a secret, but you also know their partner well.\n\n" +
      "What do you do?"
  },
  {
    docId: 'DHBR9UxGFtvqSThUQQx0',
    questionText:
      "Equally Responsible\n\n" +
      "Two individuals are pushing rocks off a cliff. One rock lands harmlessly in the river, while the other strikes and injures a swimmer below.\n\n" +
      "Given that both actions were the same, but only one led to harm, are they equally morally accountable for the outcome?"
  },
  {
    docId: 'qcOKf0ffHUywT3igNMfA',
    questionText:
      "Lifeboat Dilemma\n\n" +
      "You are on a lifeboat with ten people, but the boat can only safely hold eight. A storm is approaching, and if the boat is overloaded, it will capsize, killing everyone.\n\n" +
      "How does the group decide who stays on the boat and who is left behind?"
  },
  {
    docId: 'LAnEPpCvGyY88Qqrraln',
    questionText:
      "Privacy vs. Security\n\n" +
      "As the head of a government agency, you have access to a program that can monitor all communications in your country, potentially preventing terrorist attacks but also infringing on citizens' privacy.\n\n" +
      "How do you balance the need for security with the right to privacy?"
  },
  {
    docId: 'ZkTaQc4e2GiBZTFd8txT',
    questionText:
      "Rich Cat\n\n" +
      "A wealthy individual dies and leaves their fortune to their pet cat, instead of their struggling family members. You are the executor of the will and have the power to override the deceased's wishes and distribute the wealth to the family instead.\n\n" +
      "Do you honor the will or provide for the family?"
  },
  {
    docId: 'xWaUgoRfPlrlziRSZnvk',
    questionText:
      "Bystanders Choice\n\n" +
      "You're in a crowded area when an altercation breaks out, and someone is being attacked. The crowd watches without intervening. If you step in, you could help save the person but put yourself in danger.\n\n" +
      "Do you risk your safety to help, or stay back like everyone else and avoid involvement?"
  },
  {
    docId: 'sL4wqKcTzXf19VCjQ5NM',
    questionText:
      "Rope Problem\n\n" +
      "While rock climbing with a friend, you find yourself hanging from a rope with your friend below you, putting the rope under extreme tension. The strain makes it likely that you both could fall.\n\n" +
      "Do you cut the rope to save yourself, sacrificing your friend, or hold on and risk both your lives?"
  },
  {
    docId: 'GMV4iICbNMQ4jOeXC1ga',
    questionText:
      "Honesty vs. Compassion\n\n" +
      "You are a doctor with a terminally ill patient who asks if they are going to die. Telling them the truth will likely cause great distress, while lying might give them comfort in their final days.\n\n" +
      "Do you tell them the truth?"
  },
  {
    docId: 'eZc0BfLY1R7gRtK0fbVf',
    questionText:
      "Finders Keepers\n\n" +
      "You find a wallet filled with cash on the street. Inside, there's a note that says the money is meant for a lifesaving surgery for the owner's child. You desperately need money to pay off your own debts.\n\n" +
      "Do you keep the wallet for yourself or return it, potentially saving a life but remaining in financial trouble?"
  },

  // ── Mind Bogglers (7 wrong + 1 minor fix) ────────────────────────

  {
    docId: 'dAQHxmGpAmTNYj00LKvp',
    questionText:
      "Veil of Ignorance\n\n" +
      "You are given the power to design your own utopia\u2014a perfect society where you set all the rules and principles.\n\n" +
      "How would you structure it to ensure fairness and equality for everyone?"
  },
  {
    docId: 'XTzbc9elRr5s60tHpBRg',
    questionText:
      "The Teleporter\n\n" +
      "Imagine a teleporter that can instantly transport you from one location to another by scanning your body, disassembling it, and reconstructing an exact copy at the destination. However, the original is destroyed in the process.\n\n" +
      "Is the 'you' who arrives at the destination still you?"
  },
  {
    docId: 'DG7wbjTJpYN31OHZxD3W',
    questionText:
      "Experience Machine\n\n" +
      "Imagine a machine that can give you any experience you desire. Once plugged in, you could experience a lifetime of perfect happiness, love, and success\u2014all indistinguishable from reality.\n\n" +
      "However, once you enter, you can never leave. Would you plug in?"
  },
  {
    docId: 'xRs9eX2OBYxW8Lr8Z8Zu',
    questionText:
      "Perfect Simulation\n\n" +
      "Consider the possibility that our entire universe is a sophisticated simulation created by an advanced civilization. All of your experiences, memories, and the physical laws of the universe are just part of this simulation.\n\n" +
      "If this were true, would it change the way you conduct your life?"
  },
  {
    docId: '055ayUieC2whGwy31Jay',
    questionText:
      "Expiration Date\n\n" +
      "Imagine a world where people are born with an expiration date visible on their forearm, indicating the exact day they will die.\n\n" +
      "How might this knowledge affect how they live their lives?"
  },
  {
    docId: 'rBr2U1WYhLNPwtnKlaWu',
    questionText:
      "Time Travel\n\n" +
      "Imagine you have the ability to travel back in time and change a single event in your past. However, this change could create unforeseen consequences in the present.\n\n" +
      "Would you still change the past, and how would you decide what to alter?"
  },
  {
    docId: '30CL7eUf09H0sMQQmzEy',
    questionText:
      "Moral Clone\n\n" +
      "Imagine a perfect clone of yourself is created, with all your memories, personality, and thoughts up to the moment of creation.\n\n" +
      "If this clone commits a crime, who should be held responsible - you or the clone?"
  },
  {
    docId: 'Q4AIzQ3pbPxAaCtiKRYv',
    questionText:
      "AI Companion\n\n" +
      "Imagine an AI is created to be your perfect companion - understanding your needs, emotions, and desires better than any human could. It provides constant support, love, and companionship, but it is not conscious.\n\n" +
      "Would a relationship with this AI be meaningful, and could it ever replace human connection?"
  },
];

(async () => {
  const batch = db.batch();
  for (const u of updates) {
    const ref = db.collection('cards').doc(u.docId);
    batch.update(ref, { questionText: u.questionText });
    console.log('Queued: ' + u.docId);
  }
  await batch.commit();
  console.log('\nAll ' + updates.length + ' cards updated successfully.');
})();
