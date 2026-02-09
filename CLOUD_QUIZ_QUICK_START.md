# Cloud Quiz Storage - Quick Start

## What's New? 🎯

A new **"Add & Save Quiz to Cloud"** section that lets users:
- Upload JSON quiz files
- Paste JSON text directly  
- Name and save quizzes to cloud
- Play, copy, or delete saved quizzes

## How to Use

### Save a Quiz
1. Go to "Add & Save Quiz to Cloud" section
2. Enter a quiz name
3. Upload JSON file OR paste JSON text
4. Click "Save to Cloud"
5. Quiz appears in "Cloud Quizzes" list

### Play a Saved Quiz
1. Find quiz in "Cloud Quizzes" list
2. Click "Play" button
3. Take the quiz
4. See results

### Copy Quiz JSON
1. Click the copy icon on any quiz
2. JSON copied to clipboard
3. Share or backup the JSON

### Delete a Quiz
1. Click trash icon on quiz
2. Confirm deletion
3. Quiz removed from cloud

## JSON Format

```json
{
  "data": [
    {
      "question": "What is the capital of France?",
      "options": [
        "London",
        "Paris",
        "Berlin",
        "Madrid"
      ],
      "correct_answer": "Paris"
    }
  ]
}
```

**Required fields:**
- `data` - Array of questions
- `question` - Question text
- `options` - Array of options (min 2)
- `correct_answer` - Must match one option

## Features

✅ Drag & drop files
✅ Upload folders  
✅ Paste JSON text
✅ Auto question detection
✅ Cloud storage (persistent)
✅ Play anytime
✅ Copy to clipboard
✅ Delete quizzes
✅ Date sorting
✅ Full validation

## Files Changed

```
client/src/
  components/quiz/JsonQuizzesSection.tsx (NEW)
  lib/quiz-types.ts (updated)
  pages/home.tsx (updated)

server/
  storage.ts (updated)
  routes.ts (updated)
  quizzes/ (NEW - storage directory)
```

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/save-quiz` | Save quiz to cloud |
| GET | `/api/stored-quizzes` | Get all quizzes |
| DELETE | `/api/delete-quiz/:id` | Delete a quiz |

## Error Messages

| Error | Solution |
|-------|----------|
| "Please upload a JSON file" | Use .json file only |
| "JSON must have a 'data' array" | Fix JSON structure |
| "Quiz must have at least one question" | Add questions to data array |
| "Missing 'question' field" | Add question text |
| "Must have at least 2 options" | Add more options |
| "Missing 'correct_answer' field" | Specify correct answer |
| "Correct answer must be one of the options" | Match exact option text |

## Example Workflow

```
1. User has quiz in JSON file
   └─> Drag & drop to upload area
   
2. File loads automatically
   └─> User enters quiz name
   
3. User clicks "Save to Cloud"
   └─> Quiz stored on server
   
4. Quiz appears in "Cloud Quizzes"
   └─> User can play it anytime
   
5. User clicks "Play"
   └─> Takes the full quiz
   
6. Quiz complete
   └─> Can retake, copy, or delete
```

## Storage Location

Quizzes stored at: `server/quizzes/{id}.json`

Example structure:
```
server/
├── quizzes/
│   ├── abc123-def456.json
│   ├── xyz789-qwe123.json
│   └── ... more quizzes
```

## Tips & Tricks

- **Batch Upload**: Upload folder with multiple JSONs
- **Copy & Share**: Use copy button to backup/share
- **Easy Naming**: File name auto-populates quiz name
- **Question Count**: Auto-detects and shows question count
- **Date Tracking**: Quizzes sorted by creation date
- **Persistent**: Quizzes survive server restarts

## Troubleshooting

**Quiz not appearing?**
- Check JSON format
- Verify "data" array exists
- Ensure questions have all required fields

**Can't upload file?**
- File must be .json format
- Check file structure
- Verify JSON is valid

**Copy button not working?**
- Check browser permissions
- Try copying again
- Check console for errors

---

**Ready to use!** 🚀 Just drag, drop, and save!
