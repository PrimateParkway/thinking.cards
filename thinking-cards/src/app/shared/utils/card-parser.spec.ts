import { parseCardBlocks, CardBlock } from './card-parser';

describe('parseCardBlocks', () => {
  describe('empty / trivial input', () => {
    it('returns empty array for empty string', () => {
      expect(parseCardBlocks('')).toEqual([]);
    });

    it('returns empty array for whitespace-only string', () => {
      expect(parseCardBlocks('   \n  \n  ')).toEqual([]);
    });

    it('returns a single title block for a one-liner', () => {
      expect(parseCardBlocks('What is justice?')).toEqual([
        { type: 'title', content: 'What is justice?' },
      ]);
    });
  });

  describe('multi-line format', () => {
    it('first line becomes title, rest become text blocks', () => {
      const input = 'Main Question\nSome detail\nAnother detail';
      const result = parseCardBlocks(input);

      expect(result).toEqual([
        { type: 'title', content: 'Main Question' },
        { type: 'text', content: 'Some detail' },
        { type: 'text', content: 'Another detail' },
      ]);
    });

    it('skips blank lines between content', () => {
      const input = 'Title\n\nLine two\n\nLine three';
      const result = parseCardBlocks(input);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ type: 'title', content: 'Title' });
      expect(result[1]).toEqual({ type: 'text', content: 'Line two' });
      expect(result[2]).toEqual({ type: 'text', content: 'Line three' });
    });
  });

  describe('philosopher format', () => {
    it('detects philosopher format and parses name/content pairs', () => {
      const input = 'What is virtue?\nSocrates: Knowledge is virtue\nPlato: Virtue is harmony';
      const result = parseCardBlocks(input);

      expect(result).toEqual([
        { type: 'title', content: 'What is virtue?' },
        { type: 'philosopher', name: 'Socrates', content: 'Knowledge is virtue' },
        { type: 'divider', content: '' },
        { type: 'philosopher', name: 'Plato', content: 'Virtue is harmony' },
      ]);
    });

    it('handles philosopher names with accents', () => {
      const input = 'Question\nRené Descartes: I think therefore I am';
      const result = parseCardBlocks(input);

      expect(result).toEqual([
        { type: 'title', content: 'Question' },
        { type: 'philosopher', name: 'René Descartes', content: 'I think therefore I am' },
      ]);
    });

    it('skips lines that do not match philosopher pattern', () => {
      const input = 'Title\nAristotle: Golden mean\njust a plain line';
      const result = parseCardBlocks(input);

      const philosopherBlocks = result.filter((b) => b.type === 'philosopher');
      expect(philosopherBlocks).toHaveLength(1);
      expect(philosopherBlocks[0].name).toBe('Aristotle');
    });

    it('inserts dividers between consecutive philosophers', () => {
      const input = 'Q\nAlice: answer1\nBob: answer2\nCarl: answer3';
      const result = parseCardBlocks(input);

      const dividers = result.filter((b) => b.type === 'divider');
      expect(dividers).toHaveLength(2);
    });
  });

  describe('bullet format', () => {
    it('detects bullet format and parses bullet items', () => {
      const input = 'Key Points\n• First point\n• Second point';
      const result = parseCardBlocks(input);

      expect(result).toEqual([
        { type: 'title', content: 'Key Points' },
        { type: 'bullet', content: 'First point' },
        { type: 'bullet', content: 'Second point' },
      ]);
    });

    it('treats non-bullet, non-first lines as text blocks', () => {
      const input = 'Title\n• Bullet one\nA regular line\n• Bullet two';
      const result = parseCardBlocks(input);

      expect(result).toEqual([
        { type: 'title', content: 'Title' },
        { type: 'bullet', content: 'Bullet one' },
        { type: 'text', content: 'A regular line' },
        { type: 'bullet', content: 'Bullet two' },
      ]);
    });

    it('trims whitespace around bullet content', () => {
      const input = '• Spaced content  ';
      const result = parseCardBlocks(input);

      expect(result).toEqual([{ type: 'bullet', content: 'Spaced content' }]);
    });
  });

  describe('format priority', () => {
    it('philosopher format takes priority over bullet format', () => {
      const input = 'Question\nSocrates: Wisdom\n• A bullet';
      const result = parseCardBlocks(input);

      expect(result[0].type).toBe('title');
      expect(result.some((b) => b.type === 'philosopher')).toBe(true);
      expect(result.some((b) => b.type === 'bullet')).toBe(false);
    });

    it('bullet format takes priority over plain multi-line', () => {
      const input = 'Title\n• Bullet\nPlain text';
      const result = parseCardBlocks(input);

      expect(result.some((b) => b.type === 'bullet')).toBe(true);
    });
  });
});
