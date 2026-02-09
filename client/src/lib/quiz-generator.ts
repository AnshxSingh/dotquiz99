// Quiz Generation Utility
// This utility provides methods to generate quiz JSON in the required format

import { Question, QuizData } from "@/lib/quiz-types";

/**
 * Validates if the generated quiz is in the correct format
 */
export function validateGeneratedQuiz(data: any): data is QuizData {
  if (!data || typeof data !== "object") return false;
  if (!Array.isArray(data.data)) return false;

  return data.data.every(
    (q: any) =>
      typeof q.question === "string" &&
      Array.isArray(q.options) &&
      q.options.every((opt: any) => typeof opt === "string") &&
      typeof q.correct_answer === "string" &&
      q.options.includes(q.correct_answer)
  );
}

/**
 * Extracts text from base64 encoded images (for OCR-like functionality)
 * In production, you would use an AI API like Claude Vision or similar
 */
export function parseImageContent(imageBase64: string): string {
  // Placeholder - in production, this would use Claude Vision API
  // or another vision API to extract text from images
  return "Image content extraction requires API integration";
}

/**
 * Parses PDF content
 * In production, you would use a PDF parsing library
 */
export async function parsePdfContent(file: File): Promise<string> {
  // Placeholder - in production, this would use pdf-parse or similar
  // and extract text content from the PDF
  return "PDF content extraction requires backend setup";
}

/**
 * Generates a mock quiz for demonstration
 * Replace with actual API call in production
 */
export function generateMockQuiz(
  topic: string,
  numQuestions: number
): QuizData {
  const questions: Question[] = [];

  for (let i = 1; i <= numQuestions; i++) {
    questions.push({
      question: `What is ${topic} concept ${i}?`,
      options: [
        `Option A for ${topic} ${i}`,
        `Option B for ${topic} ${i}`,
        `Option C for ${topic} ${i}`,
        `Option D for ${topic} ${i}`,
      ],
      correct_answer: `Option A for ${topic} ${i}`,
    });
  }

  return {
    title: `${topic} Quiz`,
    data: questions,
  };
}

/**
 * Formats the quiz data to match the app's expected format
 */
export function formatQuizData(questions: Question[], title?: string): QuizData {
  return {
    title: title || "Generated Quiz",
    data: questions,
  };
}

/**
 * Example of how to call an AI API (like Claude/OpenAI)
 * This is a template - you need to implement with your API key
 */
export async function callAIAPI(prompt: string, apiKey: string): Promise<any> {
  // This would be implemented on the backend for security
  // Never expose API keys on the frontend!
  throw new Error(
    "AI API call should be made from backend. See setup documentation."
  );
}
