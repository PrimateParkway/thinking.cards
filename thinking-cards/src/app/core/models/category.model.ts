export interface Category {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color: string;
  order: number;
  type?: 'standard' | 'quiz' | 'matrix' | 'cryptogram' | 'nonogram' | 'codebreaker' | 'knights' | 'escape';
}
