# Testing Neon Connection

## Quick Test

### 1. Start Dev Server
```bash
npm run dev
```

### 2. Check Server Logs
Look for one of these messages:
```
✓ Using Neon PostgreSQL for storage
✓ Using file storage (local development)
✓ Using memory storage (serverless environment)
```

### 3. Test the Feature
1. Open app in browser (http://localhost:8888)
2. Go to **"Add & Save Quiz to Cloud"** section
3. Enter quiz name: `Test Quiz`
4. Paste this JSON:
```json
{
  "data": [
    {
      "question": "What is 2+2?",
      "options": ["3", "4", "5", "6"],
      "correct_answer": "4"
    },
    {
      "question": "What is the capital of France?",
      "options": ["London", "Berlin", "Paris", "Madrid"],
      "correct_answer": "Paris"
    }
  ]
}
```
5. Click **"Save to Cloud"** button

### 4. Check Results
- ✅ Should see success toast: "Quiz 'Test Quiz' saved to cloud"
- ✅ Quiz appears in "Cloud Quizzes" section
- ✅ Can click "Play" to take quiz
- ✅ Can click copy icon to get JSON back

## If Using Neon

### Expected Behavior
```
DATABASE_URL detected
    ↓
Neon PostgreSQL connected
    ↓
Tables auto-created
    ↓
Quiz data stored in cloud database
    ↓
Persists after server restart
```

### Verify in Neon Console
1. Go to [Neon Console](https://console.neon.tech)
2. Find your project
3. Click "SQL Editor"
4. Run:
```sql
SELECT * FROM quizzes;
```
Should see your "Test Quiz" quiz stored!

## If Using File Storage (Local)

### Expected Behavior
```
No DATABASE_URL found
    ↓
Using file storage
    ↓
Quiz data stored in server/quizzes/
    ↓
Files created as {id}.json
```

### Verify Files
1. Check `server/quizzes/` directory
2. Should see JSON files with quiz data
3. Files survive server restarts

## Troubleshooting

### "Using memory storage"
This happens if:
- ❌ No DATABASE_URL
- ❌ Running on Netlify without Neon
- ⚠️ Quizzes lost on server restart

**Fix**: 
- Set DATABASE_URL in `.env.local`
- Add Neon to Netlify site

### "Using Neon PostgreSQL"
This is correct! ✅
- Quizzes persist in PostgreSQL
- Survives server restarts
- Ready for production

### Connection Error
```
Error: Failed to initialize database
```

**Fix**:
1. Check DATABASE_URL is valid
2. Ensure PostgreSQL service is running (Neon)
3. Check internet connection
4. Verify credentials in DATABASE_URL

### Quiz Not Saving
```
toast: "Failed to save quiz"
```

**Check**:
1. Console logs for detailed error
2. DATABASE_URL environment variable
3. Network tab (API request response)
4. Database tables exist

## Commands to Debug

### Check Environment
```bash
echo $DATABASE_URL
```
Should show PostgreSQL connection string.

### Check Database Connection
```bash
psql $DATABASE_URL -c "SELECT version();"
```
Should return PostgreSQL version.

### View All Quizzes
```bash
psql $DATABASE_URL -c "SELECT id, title, created_at FROM quizzes ORDER BY created_at DESC;"
```

### Clear All Quizzes (Testing)
```bash
psql $DATABASE_URL -c "DELETE FROM quizzes;"
```

## Next Steps

After Testing:
1. ✅ Verify data persists (restart server)
2. ✅ Test on deployed Netlify site
3. ✅ Confirm quizzes sync across devices
4. ✅ Monitor Neon usage in dashboard

---

**Done?** Your Neon integration is working! 🎉
