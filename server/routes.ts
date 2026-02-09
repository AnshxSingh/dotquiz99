import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

interface Question {
  question: string;
  options: string[];
  correct_answer: string;
}

interface QuizResponse {
  title: string;
  data: Question[];
}

/**
 * Generate mock quiz for fallback
 */
function generateMockQuiz(title: string, numQuestions: number): Question[] {
  const questions: Question[] = [];
  
  for (let i = 1; i <= numQuestions; i++) {
    questions.push({
      question: `What is ${title} concept ${i}?`,
      options: [
        `Option A for ${title}`,
        `Option B for ${title}`,
        `Option C for ${title}`,
        `Option D for ${title}`,
      ],
      correct_answer: `Option A for ${title}`,
    });
  }
  
  return questions;
}

/**
 * Call Claude API to generate quiz
 */
async function generateFromPromptWithClaude(
  prompt: string,
  numQuestions: number
): Promise<Question[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.warn("ANTHROPIC_API_KEY not set. Using mock quiz.");
    return generateMockQuiz(prompt, numQuestions);
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: `Generate a quiz with ${numQuestions} multiple choice questions about: "${prompt}"

Return ONLY a valid JSON array. Each question must have exactly this structure:
[
  {
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "Option A"
  }
]

Rules:
- Each question must have exactly 4 options
- correct_answer must be one of the options
- Make questions clear and educational
- Difficulty: mix of easy, medium, and hard questions
- No markdown, no code blocks, ONLY JSON

Now generate the quiz:`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Claude API error:", error);
      return generateMockQuiz(prompt, numQuestions);
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("Could not extract JSON from response");
      return generateMockQuiz(prompt, numQuestions);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) {
      console.error("Parsed content is not an array");
      return generateMockQuiz(prompt, numQuestions);
    }

    // Validate questions
    return parsed.filter(
      (q: any) =>
        q.question &&
        q.options &&
        Array.isArray(q.options) &&
        q.correct_answer &&
        q.options.includes(q.correct_answer)
    );
  } catch (error) {
    console.error("Error calling Claude API:", error);
    return generateMockQuiz(prompt, numQuestions);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Quiz generation endpoint
  app.post("/api/generate-quiz", async (req, res) => {
    try {
      const { type, prompt, numQuestions } = req.body;

      // Validate input
      if (!type || !numQuestions || numQuestions < 1 || numQuestions > 50) {
        return res.status(400).json({
          error: "Invalid input: type and numQuestions required",
        });
      }

      if (type === "prompt") {
        if (!prompt || !prompt.trim()) {
          return res.status(400).json({
            error: "Prompt required for prompt type",
          });
        }

        // Generate quiz using Claude
        const questions = await generateFromPromptWithClaude(
          prompt.trim(),
          Number(numQuestions)
        );

        const response: QuizResponse = {
          title: prompt,
          data: questions,
        };

        return res.json(response);
      } else if (type === "image" || type === "pdf") {
        // Image and PDF not yet implemented
        return res.status(400).json({
          error: `${type} generation not yet implemented. Please use prompt type.`,
        });
      }

      return res.status(400).json({
        error: "Invalid type",
      });
    } catch (error) {
      console.error("Error in quiz generation:", error);
      return res.status(500).json({
        error: "Failed to generate quiz",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Save JSON quiz endpoint
  app.post("/api/save-quiz", async (req, res) => {
    try {
      console.log("[SAVE-QUIZ] Received request:", { title: req.body.title });
      const { title, quizData } = req.body;

      if (!title || !title.trim()) {
        console.log("[SAVE-QUIZ] Error: Title is required");
        return res.status(400).json({
          error: "Quiz title is required"
        });
      }

      if (!quizData || !quizData.data || !Array.isArray(quizData.data)) {
        console.log("[SAVE-QUIZ] Error: Invalid quiz data format");
        return res.status(400).json({
          error: "Invalid quiz data format. Must have 'data' array"
        });
      }

      if (quizData.data.length === 0) {
        console.log("[SAVE-QUIZ] Error: Quiz has no questions");
        return res.status(400).json({
          error: "Quiz must have at least one question"
        });
      }

      // Validate each question
      for (let i = 0; i < quizData.data.length; i++) {
        const q = quizData.data[i];
        if (!q.question || !Array.isArray(q.options) || !q.correct_answer) {
          console.log(`[SAVE-QUIZ] Error: Question ${i + 1} invalid format`);
          return res.status(400).json({
            error: `Question ${i + 1}: invalid format`
          });
        }
      }

      console.log(`[SAVE-QUIZ] Saving quiz: "${title}" with ${quizData.data.length} questions`);
      const savedQuiz = await storage.saveQuiz(title.trim(), quizData);
      console.log(`[SAVE-QUIZ] Quiz saved successfully:`, savedQuiz);
      return res.status(201).json(savedQuiz);
    } catch (error) {
      console.error("Error saving quiz:", error);
      return res.status(500).json({
        error: "Failed to save quiz",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get stored quizzes endpoint
  app.get("/api/stored-quizzes", async (req, res) => {
    try {
      const quizzes = await storage.getStoredQuizzes();
      return res.json(quizzes);
    } catch (error) {
      console.error("Error retrieving quizzes:", error);
      return res.status(500).json({
        error: "Failed to retrieve quizzes",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Delete quiz endpoint
  app.delete("/api/delete-quiz/:quizId", async (req, res) => {
    try {
      const { quizId } = req.params;

      if (!quizId) {
        return res.status(400).json({
          error: "Quiz ID is required"
        });
      }

      const deleted = await storage.deleteQuiz(quizId);
      
      if (!deleted) {
        return res.status(404).json({
          error: "Quiz not found"
        });
      }

      return res.json({ message: "Quiz deleted successfully" });
    } catch (error) {
      console.error("Error deleting quiz:", error);
      return res.status(500).json({
        error: "Failed to delete quiz",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  return httpServer;
}
