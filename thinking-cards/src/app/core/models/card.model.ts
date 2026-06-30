export interface MatrixGroup {
  name: string;
  items: string[];
  labels: string[];
}

export interface CodebreakerClue {
  guess: string;
  correct: number;
  misplaced: number;
}

export interface KnightsCharacter {
  name: string;
  statements: string[];
}

export interface EscapeStation {
  title: string;
  prompt: string;
  answer: string;
  takeChar: string;
  hint?: string;
  reveal?: string;
}

export interface EscapeFinal {
  prompt: string;
  rule: string;
  answer: string;
  hint?: string;
}

export interface Card {
  id: string;
  questionText: string;
  categoryId: string;
  cardNumber: number;
  options?: string[];
  correctIndex?: number;
  explanation?: string;
  matrixGroups?: MatrixGroup[];
  matrixClues?: string[];
  matrixSolution?: Record<string, Record<string, string>>;
  matrixScenario?: string;
  matrixExplanation?: string[];
  difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Extreme';
  cryptogramPlaintext?: string;
  cryptogramAuthor?: string;
  nonogramSolution?: number[];
  nonogramCols?: number;
  codebreakerAnswer?: string;
  codebreakerClues?: CodebreakerClue[];
  knightsScenario?: string;
  knightsCharacters?: KnightsCharacter[];
  knightsSolution?: Record<string, 'Knight' | 'Knave'>;
  knightsExplanation?: string[];
  knightsTagLabel?: string;
  knightsTagSolution?: Record<string, string>;
  escapeIntro?: string;
  escapeStations?: EscapeStation[];
  escapeFinal?: EscapeFinal;
}
