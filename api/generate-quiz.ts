import type { VercelRequest, VercelResponse } from "@vercel/node";

interface Question {
  question: string;
  options: string[];
  correct_answer: string;
}

interface QuizResponse {
  title: string;
  data: Question[];
}

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

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("Could not extract JSON from Claude response");
      return generateMockQuiz(prompt, numQuestions);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) {
      console.error("Parsed content is not an array");
      return generateMockQuiz(prompt, numQuestions);
    }

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { type, prompt, numQuestions } = req.body;

    if (!type || !numQuestions || numQuestions < 1 || numQuestions > 50) {
      return res.status(400).json({
        error: "Invalid input: type and numQuestions (1-50) are required",
      });
    }

    if (type === "prompt") {
      if (!prompt || !prompt.trim()) {
        return res.status(400).json({
          error: "Prompt required for prompt type",
        });
      }

      const questions = await generateFromPromptWithClaude(
        prompt.trim(),
        Number(numQuestions)
      );

      const response: QuizResponse = {
        title: prompt,
        data: questions,
      };

      return res.status(200).json(response);
    }

    if (type === "image" || type === "pdf") {
      return res.status(400).json({
        error: `${type} generation not yet implemented. Please use prompt type.`,
      });
    }

    return res.status(400).json({ error: "Invalid type" });
  } catch (error) {
    console.error("Error in quiz generation:", error);
    return res.status(500).json({
      error: "Failed to generate quiz",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
