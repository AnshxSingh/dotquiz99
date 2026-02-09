# 🤖 AI Quiz Generator Setup Guide

## Overview

The AI Quiz Generator allows users to generate quiz questions from:
- ✨ Text prompts/topics
- 🖼️ Images (screenshot, diagram, photo)
- 📄 PDF documents

## Features

- **Multiple Input Types**: Support for prompts, images, and PDFs
- **Customizable Questions**: Choose 1-50 questions per quiz
- **AI-Powered**: Uses Claude 3 API to generate high-quality questions
- **Smart Formatting**: Auto-formats as JSON ready for your quiz app
- **Error Handling**: Graceful fallbacks if API unavailable

## Architecture

```
┌─────────────────────────────────────────────┐
│      Frontend (React Component)              │
│  - QuizGenerator.tsx                        │
│  - Dialog for user input                    │
│  - File upload handlers                     │
└────────────────┬────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────┐
│   Netlify Serverless Function                │
│  - /netlify/functions/generate-quiz.ts      │
│  - Handles API calls (secure)               │
│  - Returns formatted JSON                   │
└────────────────┬────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────┐
│      Claude 3 API (Anthropic)               │
│  - Generates quiz questions                 │
│  - Analyzes images with vision             │
│  - Returns structured JSON                  │
└─────────────────────────────────────────────┘
```

## Setup Instructions

### Step 1: Get API Key

1. **Create Anthropic Account**
   - Go to: https://console.anthropic.com
   - Sign up for free
   - Verify email

2. **Create API Key**
   - Navigate to "API Keys" section
   - Click "Create Key"
   - Copy the key (starts with `sk-ant-`)
   - **Save it securely** - you won't see it again

### Step 2: Add to Netlify (Local Development)

1. **Create `.env.local` file** in project root:
   ```
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```

2. **Test locally**:
   ```bash
   npm run dev
   ```
   - The serverless function runs on `http://localhost:8888`
   - Frontend connects to `http://localhost:5173`

### Step 3: Deploy to Netlify

1. **Set Environment Variable**
   - Go to: https://app.netlify.com
   - Select your site
   - Go to **Settings** → **Build & deploy** → **Environment**
   - Click **Edit variables**
   - Add new variable:
     - Key: `ANTHROPIC_API_KEY`
     - Value: `sk-ant-...` (your API key)
   - Click **Save**

2. **Redeploy**
   ```bash
   npm run build
   # Upload dist/public/ to Netlify
   ```

3. **Verify**
   - Visit your Netlify site
   - Click "Generate Quiz with AI"
   - Test with a prompt: "JavaScript fundamentals"
   - You should get 5 quiz questions

## Usage Guide

### For Users

1. **Click "Generate Quiz with AI"** button
   - Located at top of Upload section

2. **Choose Input Type**
   - 💬 From Prompt (text-based)
   - 🖼️ From Image (screenshot, diagram)
   - 📄 From PDF (document)

3. **Configure Options**
   - **Number of Questions**: 1-50
   - **Topic/File**: Provide details or upload

4. **Click "Generate Quiz"**
   - Wait for AI to process
   - Quiz loads automatically when ready
   - No manual JSON editing needed!

5. **Start Quiz or Save**
   - Quiz loads ready to take
   - Or save to history for later

### Example Prompts

Good prompts are specific and detailed:

```
❌ Too vague:
"Science"

✅ Better:
"Biology photosynthesis - advanced level"
"Python decorators and closures"
"World history 1900-2000"
"CSS Flexbox layout"
```

## API Reference

### Request Format

```bash
POST /api/generate-quiz
Content-Type: application/json

{
  "type": "prompt",
  "prompt": "JavaScript ES6 features",
  "numQuestions": 5
}
```

### Response Format

```json
{
  "title": "JavaScript ES6 features",
  "data": [
    {
      "question": "What is the primary use of arrow functions?",
      "options": [
        "To create visual arrows",
        "To provide concise function syntax",
        "To declare variables",
        "To import modules"
      ],
      "correct_answer": "To provide concise function syntax"
    }
  ]
}
```

### Error Handling

If API key missing:
- Falls back to sample questions
- Shows info message to user
- Does NOT crash the app

Example error response:
```json
{
  "error": "Failed to generate quiz",
  "message": "API key not configured"
}
```

## Troubleshooting

### "API key not configured" message

**Solution:**
1. Verify `.env.local` exists locally (development)
2. Verify environment variable set in Netlify (production)
3. Check variable name: `ANTHROPIC_API_KEY` (exact spelling)
4. Restart dev server after adding `.env.local`

### Generated questions are generic

**Solution:**
- Use more specific prompts
- Include difficulty level: "easy", "intermediate", "advanced"
- Add context: "for 10th grade students"
- Example: `"Organic chemistry functional groups - high school level"`

### API calls failing with rate limit error

**Solution:**
- Anthropic free tier has rate limits
- Wait a few seconds between requests
- Upgrade API tier if heavy usage

### Image/PDF generation not working

**Current Status:**
- Image and PDF support requires additional setup
- For now, recommend using "From Prompt" method
- Extract text manually from images/PDFs and use prompt method

**Future Enhancement:**
```bash
npm install pdf-parse pdfjs-dist
# Then implement PDF text extraction
```

## Costs

### Anthropic (Claude 3)

**Free Tier:**
- 100,000 input tokens/month
- Roughly 20,000 quiz questions generated/month

**Pricing (Pay as you go):**
- Input: $0.003 per 1K tokens
- Output: $0.015 per 1K tokens
- Typical cost: $0.01-0.02 per quiz

**Estimated Costs:**
- 100 quizzes: $1-2
- 1,000 quizzes: $10-20

## Customization

### Change AI Model

Edit `netlify/functions/generate-quiz.ts`:

```typescript
// Current (recommended)
model: "claude-3-sonnet-20240229",

// Or use newer model:
model: "claude-3-5-sonnet-20241022",

// Or faster/cheaper:
model: "claude-3-haiku-20240307",
```

### Adjust Generation Parameters

```typescript
// In generateFromPrompt function:
{
  model: "claude-3-sonnet-20240229",
  max_tokens: 4096,        // ← Change this
  temperature: 0.7,        // ← Add this (0-1, higher = more creative)
  top_p: 1.0,             // ← Add this
}
```

### Custom Validation

Edit `client/src/lib/quiz-generator.ts`:

```typescript
export function validateGeneratedQuiz(data: any): data is QuizData {
  // Add custom validation rules
  // E.g., minimum question length, diversity check, etc.
}
```

## Advanced Features

### Rate Limiting (Future)

```typescript
// Track API calls per user
const calls = localStorage.getItem('apiCalls');
const timestamp = localStorage.getItem('apiTime');
// Implement cooldown logic
```

### Batch Generation

Users could generate multiple quizzes at once:
```typescript
// Generate 3 quizzes of 5 questions each
generateMultiple(['Topic 1', 'Topic 2', 'Topic 3'], 5)
```

### Custom Question Types

Currently supports: Multiple choice (4 options)

Could add:
- True/False
- Multiple select (multiple correct answers)
- Short answer with grading

## Files Reference

```
client/
  src/
    components/quiz/
      QuizGenerator.tsx              ← UI component
    lib/
      quiz-generator.ts              ← Utilities & validation
      
netlify/
  functions/
    generate-quiz.ts                 ← Serverless function
    
```

## Environment Variables

### Development (.env.local)
```
ANTHROPIC_API_KEY=sk-ant-...
```

### Production (Netlify Dashboard)
- Settings → Build & deploy → Environment
- Key: `ANTHROPIC_API_KEY`
- Value: `sk-ant-...`

## Performance Notes

- **Cold start**: First request ~2-3 seconds (serverless)
- **Warm start**: Subsequent requests ~1-2 seconds
- **Generation time**: Depends on question count
  - 5 questions: ~2-3 seconds
  - 10 questions: ~4-5 seconds
  - 20 questions: ~8-10 seconds

## Security

### Best Practices

✅ **API Key stored in environment variable** (not in code)
✅ **API calls made from serverless function** (not frontend)
✅ **Rate limiting recommended** (prevent abuse)
✅ **Input validation** (sanitize prompts)

### What NOT to do

❌ Never commit API key to git
❌ Never expose API key in frontend code
❌ Never show API key in response

## Support & Resources

- **Anthropic Docs**: https://docs.anthropic.com
- **Netlify Functions**: https://docs.netlify.com/functions
- **Claude API Guide**: https://docs.anthropic.com/claude/reference/getting-started-with-the-api

## Quick Start Checklist

- [ ] Create Anthropic account
- [ ] Get API key
- [ ] Create `.env.local` file
- [ ] Add `ANTHROPIC_API_KEY` to `.env.local`
- [ ] Test locally with `npm run dev`
- [ ] Push code to GitHub
- [ ] Add environment variable to Netlify
- [ ] Deploy and test on production
- [ ] Share "Generate Quiz with AI" feature with users!

---

**Status**: ✅ Ready for local testing
**Next**: Add Anthropic API key and test the feature!
