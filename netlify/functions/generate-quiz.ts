// Netlify Serverless Function for Quiz Generation
// This function generates quiz questions using AI APIs
// 
// Setup:
// 1. Get API key from Claude (anthropic.com) or OpenAI
// 2. Add to Netlify environment variables:
//    - ANTHROPIC_API_KEY (for Claude)
//    - OPENAI_API_KEY (for OpenAI)
// 3. Deploy to Netlify

interface GenerateQuizRequest {
  type: "prompt" | "image" | "pdf";
  prompt?: string;
  numQuestions: number;
  file?: any;
}

interface Question {
  question: string;
  options: string[];
  correct_answer: string;
}

interface QuizResponse {
  title: string;
  data: Question[];
}

interface NetlifyEvent {
  httpMethod: string;
  body: string | null;
  isBase64Encoded: boolean;
}

interface NetlifyResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
}

/**
 * Parse JSON response from Claude API
 */
function parseClaudeResponse(content: string): Question[] {
  try {
    // Extract JSON from the response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return generateFallbackQuiz("Generated Quiz", 5);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) {
      return generateFallbackQuiz("Generated Quiz", 5);
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
    console.error("Error parsing Claude response:", error);
    return generateFallbackQuiz("Generated Quiz", 5);
  }
}

/**
 * Generate fallback quiz when API fails
 */
function generateFallbackQuiz(title: string, numQuestions: number): Question[] {
  const questions: Question[] = [];

  for (let i = 1; i <= numQuestions; i++) {
    questions.push({
      question: `Sample Question ${i}`,
      options: [
        `Option A`,
        `Option B`,
        `Option C`,
        `Option D`,
      ],
      correct_answer: "Option A",
    });
  }

  return questions;
}

/**
 * Generate quiz from text prompt using Claude API
 */
async function generateFromPrompt(
  prompt: string,
  numQuestions: number
): Promise<Question[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn(
      "ANTHROPIC_API_KEY not set. Using fallback quiz generator."
    );
    return generateFallbackQuiz(prompt, numQuestions);
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
      return generateFallbackQuiz(prompt, numQuestions);
    }

    const data = await response.json();
    const content = data.content[0].text;
    return parseClaudeResponse(content);
  } catch (error) {
    console.error("Error calling Claude API:", error);
    return generateFallbackQuiz(prompt, numQuestions);
  }
}

/**
 * Generate quiz from image
 */
async function generateFromImage(
  file: Buffer,
  numQuestions: number
): Promise<Question[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn(
      "ANTHROPIC_API_KEY not set. Using fallback quiz generator."
    );
    return generateFallbackQuiz("Image Content", numQuestions);
  }

  try {
    // Convert buffer to base64
    const base64Image = file.toString("base64");

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
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: base64Image,
                },
              },
              {
                type: "text",
                text: `Analyze this image and generate ${numQuestions} multiple choice quiz questions based on its content.

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
- Questions should test understanding of image content
- Mix of easy, medium, and hard questions
- No markdown, no code blocks, ONLY JSON

Generate the quiz:`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Claude API error:", error);
      return generateFallbackQuiz("Image Content", numQuestions);
    }

    const data = await response.json();
    const content = data.content[0].text;
    return parseClaudeResponse(content);
  } catch (error) {
    console.error("Error processing image with Claude:", error);
    return generateFallbackQuiz("Image Content", numQuestions);
  }
}

/**
 * Generate quiz from PDF
 */
async function generateFromPDF(
  file: Buffer,
  numQuestions: number
): Promise<Question[]> {
  // Note: For PDF parsing, you would typically use a library like pdfjs
  // or send to Claude with the extracted text
  // This is a simplified implementation

  try {
    // For now, we'll just acknowledge the PDF
    // In production, extract text from PDF first
    return generateFallbackQuiz("PDF Content", numQuestions);
  } catch (error) {
    console.error("Error processing PDF:", error);
    return generateFallbackQuiz("PDF Content", numQuestions);
  }
}

/**
 * Main handler function
 */
const handler = async (event: NetlifyEvent): Promise<NetlifyResponse> => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    let body;

    // Parse request body
    if (event.isBase64Encoded) {
      const buffer = Buffer.from(event.body || "", "base64");
      body = JSON.parse(buffer.toString("utf-8"));
    } else {
      body = JSON.parse(event.body || "{}");
    }

    const { type, prompt, numQuestions } = body;

    // Validate input
    if (!type || !numQuestions || numQuestions < 1 || numQuestions > 50) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Invalid input: type and numQuestions required",
        }),
      };
    }

    let questions: Question[] = [];

    // Generate quiz based on type
    switch (type) {
      case "prompt":
        if (!prompt) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: "Prompt required for prompt type" }),
          };
        }
        questions = await generateFromPrompt(prompt, numQuestions);
        break;

      case "image":
        // Handle file upload - extract from multipart form data
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: "Image generation not yet implemented. Use prompt instead.",
          }),
        };

      case "pdf":
        // Handle file upload - extract from multipart form data
        return {
          statusCode: 400,
          body: JSON.stringify({
            error:
              "PDF generation not yet implemented. Use prompt instead.",
          }),
        };

      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Invalid type" }),
        };
    }

    // Format response
    const response: QuizResponse = {
      title: prompt || "Generated Quiz",
      data: questions,
    };

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error("Error in quiz generation:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to generate quiz",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};

export { handler };
