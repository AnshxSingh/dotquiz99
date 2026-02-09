export interface Question {
  question: string;
  options: string[];
  correct_answer: string;
}

export interface QuizData {
  title?: string;
  data: Question[];
}

export interface QuizResult {
  id: string;
  title: string;
  score: number;
  total: number;
  date: string;
}

export interface StoredQuiz {
  id: string;
  title: string;
  data: Question[];
  createdAt: string;
  attempts: number;
}

export interface StoredJsonQuiz {
  id: string;
  title: string;
  data: Question[];
  createdAt: string;
}

export interface QuestionResult {
  question: string;
  userAnswer: string | null;
  correctAnswer: string;
  topic: string;
  isCorrect: boolean;
}
