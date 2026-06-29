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
}
