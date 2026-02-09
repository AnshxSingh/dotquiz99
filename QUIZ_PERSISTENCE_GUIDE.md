# Quiz Persistence & Reattempt Feature

## Overview
The DotQuiz application now supports persistent quiz storage and the ability to reattempt saved quizzes. Users can upload quizzes, and they will be automatically saved for future attempts.

## Features

### 1. **Automatic Quiz Persistence**
- When a user uploads a quiz and completes it, the quiz is automatically saved to local storage
- Saved quizzes include:
  - Quiz ID (unique identifier)
  - Quiz title
  - All questions and options
  - Creation timestamp
  - Attempt counter

### 2. **Saved Quizzes Section**
- Displays all previously saved quizzes on the main page
- Shows quiz details:
  - Quiz title
  - Number of questions
  - Number of attempts made
  - Buttons to reattempt or delete

### 3. **Reattempt Functionality**
- Click the "Reattempt" button on any saved quiz to retake it
- The quiz will load with fresh answers (previous answers are cleared)
- Attempt counter increments each time you reattempt
- New scores are added to the history

### 4. **Quiz Management**
- **Delete Quiz**: Remove a saved quiz from your collection
- **View History**: See all previous attempts with scores and timestamps
- **Organize**: Quizzes are sorted by creation date (newest first)

## Data Structure

### StoredQuiz Interface
```typescript
interface StoredQuiz {
  id: string;                    // Unique quiz identifier
  title: string;                 // Quiz title
  data: Question[];              // Array of questions
  createdAt: string;             // ISO timestamp of creation
  attempts: number;              // Number of attempts
}
```

### Local Storage Keys
- `savedQuizzes`: Array of StoredQuiz objects
- `quizHistory`: Array of QuizResult objects (scores and dates)

## How It Works

### Quiz Upload Flow
1. User uploads/pastes JSON quiz data
2. Quiz is validated and displayed
3. User answers all questions
4. Upon completion:
   - Score is saved to `quizHistory`
   - Quiz is saved to `savedQuizzes` (if new)
   - Attempt counter is incremented (if existing)

### Reattempt Flow
1. User clicks "Reattempt" on a saved quiz
2. Quiz loads with fresh answers
3. User completes the quiz
4. New attempt is recorded in history
5. Attempt counter on the saved quiz increments

## Storage Limits
- Browser local storage has a limit of ~5-10MB
- For most use cases with reasonable quiz sizes, this should be sufficient
- Users can delete old quizzes to free up space if needed

## Utility Functions (storage-utils.ts)

### Quiz Management
```typescript
// Get all saved quizzes
storageUtils.getSavedQuizzes(): StoredQuiz[]

// Save a new quiz
storageUtils.saveQuiz(quiz: StoredQuiz): void

// Update a quiz (e.g., increment attempts)
storageUtils.updateQuiz(quizId: string, updates: Partial<StoredQuiz>): void

// Delete a quiz
storageUtils.deleteQuiz(quizId: string): void
```

### History Management
```typescript
// Get all history items
storageUtils.getHistory(): QuizResult[]

// Add to history
storageUtils.addToHistory(item: QuizResult): void

// Clear all history
storageUtils.clearHistory(): void
```

### Import/Export
```typescript
// Export quizzes as JSON string
storageUtils.exportQuizzes(): string

// Import quizzes from JSON string
storageUtils.importQuizzes(jsonData: string): boolean
```

## User Interface Changes

### HistorySection Component
The history section now displays two sections:
1. **Saved Quizzes** - All quizzes available to reattempt
2. **Recent History** - All attempt scores and dates

### Buttons Added
- **Reattempt Button**: Reloads a saved quiz for another attempt
- **Delete Button**: Removes a quiz from saved collection

## Technical Implementation

### State Management
- `currentQuizId`: Tracks if the current quiz is from saved quizzes
- Used to determine whether to create new quiz or update existing

### Component Props
- `HistorySection` now accepts `onReattempt` callback
- `onReattempt` receives `QuizData` and `quizId`

### LocalStorage Operations
All operations include error handling:
- Try-catch blocks for JSON parsing
- Console logging for debugging
- Graceful degradation if storage fails

## Browser Compatibility
- Works in all modern browsers with localStorage support
- Data persists across browser sessions
- Private/Incognito mode may not persist data

## Future Enhancements
- [ ] Cloud sync across devices
- [ ] Quiz categories/tags
- [ ] Search and filter saved quizzes
- [ ] Performance analytics
- [ ] Backup and restore functionality
- [ ] Quiz sharing via URL
- [ ] Collaborative quizzes

## Example Usage

### Accessing saved quizzes programmatically
```typescript
import { storageUtils } from "@/lib/storage-utils";

// Get all quizzes
const quizzes = storageUtils.getSavedQuizzes();

// Find a specific quiz
const quiz = quizzes.find(q => q.id === "quiz-123");

// Get history for a quiz
const history = storageUtils.getHistory();
const quizAttempts = history.filter(h => h.title === quiz?.title);
```

## Troubleshooting

### Quiz not saving
- Check browser's localStorage is enabled
- Verify storage quota is not exceeded
- Check browser console for errors

### Reattempt button not working
- Ensure quiz data is valid
- Check that quiz ID is properly set
- Verify onReattempt callback is passed to HistorySection

### Data loss
- LocalStorage can be cleared by user actions
- Encourage users to export important quizzes
- Consider implementing backup reminders
