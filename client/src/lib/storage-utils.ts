import { StoredQuiz, QuizResult } from "@/lib/quiz-types";

const SAVED_QUIZZES_KEY = "savedQuizzes";
const QUIZ_HISTORY_KEY = "quizHistory";

export const storageUtils = {
  // Quiz persistence
  getSavedQuizzes: (): StoredQuiz[] => {
    try {
      const stored = localStorage.getItem(SAVED_QUIZZES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Failed to get saved quizzes", error);
      return [];
    }
  },

  saveQuiz: (quiz: StoredQuiz): void => {
    try {
      const quizzes = storageUtils.getSavedQuizzes();
      quizzes.push(quiz);
      localStorage.setItem(SAVED_QUIZZES_KEY, JSON.stringify(quizzes));
    } catch (error) {
      console.error("Failed to save quiz", error);
    }
  },

  updateQuiz: (quizId: string, updates: Partial<StoredQuiz>): void => {
    try {
      const quizzes = storageUtils.getSavedQuizzes();
      const index = quizzes.findIndex(q => q.id === quizId);
      if (index !== -1) {
        quizzes[index] = { ...quizzes[index], ...updates };
        localStorage.setItem(SAVED_QUIZZES_KEY, JSON.stringify(quizzes));
      }
    } catch (error) {
      console.error("Failed to update quiz", error);
    }
  },

  deleteQuiz: (quizId: string): void => {
    try {
      const quizzes = storageUtils.getSavedQuizzes();
      const filtered = quizzes.filter(q => q.id !== quizId);
      localStorage.setItem(SAVED_QUIZZES_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error("Failed to delete quiz", error);
    }
  },

  // History management
  getHistory: (): QuizResult[] => {
    try {
      const stored = localStorage.getItem(QUIZ_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Failed to get history", error);
      return [];
    }
  },

  addToHistory: (item: QuizResult): void => {
    try {
      const history = storageUtils.getHistory();
      history.push(item);
      localStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error("Failed to add to history", error);
    }
  },

  clearHistory: (): void => {
    try {
      localStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify([]));
    } catch (error) {
      console.error("Failed to clear history", error);
    }
  },

  // Utility functions
  exportQuizzes: (): string => {
    try {
      const quizzes = storageUtils.getSavedQuizzes();
      return JSON.stringify(quizzes, null, 2);
    } catch (error) {
      console.error("Failed to export quizzes", error);
      return "";
    }
  },

  importQuizzes: (jsonData: string): boolean => {
    try {
      const imported = JSON.parse(jsonData);
      if (Array.isArray(imported)) {
        const existing = storageUtils.getSavedQuizzes();
        const merged = [...existing, ...imported];
        localStorage.setItem(SAVED_QUIZZES_KEY, JSON.stringify(merged));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to import quizzes", error);
      return false;
    }
  }
};
