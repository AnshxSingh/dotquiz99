# Neon PostgreSQL Setup for Netlify

## Quick Setup (5 minutes)

### Step 1: Create Neon Database
1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Go to your site → **Integrations** 
3. Search for **Neon**
4. Click **Install** 
5. Connect your project
6. A PostgreSQL database will be created automatically

### Step 2: Get DATABASE_URL
1. Netlify will automatically create a `DATABASE_URL` environment variable
2. It will look like: `postgresql://user:password@host/database`
3. You can see it in: **Site settings → Build & deploy → Environment**

### Step 3: Update .env.local (Local Development)
Create/update `.env.local`:
```
DATABASE_URL=postgresql://user:password@host/database
ANTHROPIC_API_KEY=your_api_key_here
```

### Step 4: Deploy to Netlify
The app will automatically:
- ✅ Detect `DATABASE_URL` environment variable
- ✅ Create database tables
- ✅ Use PostgreSQL for storing quizzes
- ✅ Work with serverless functions

## How It Works

```
Local Dev: DATABASE_URL exists → Use PostgreSQL (Neon)
                    ↓
                 Tables auto-created
                    ↓
            Quizzes stored in database

Local Dev (no DATABASE_URL): Use file storage
                    ↓
            Quizzes stored in server/quizzes/

Netlify (with Neon): DATABASE_URL exists → PostgreSQL
                    ↓
            Quizzes persist in cloud
```

## Storage Fallback Logic

The app automatically chooses the best storage:

1. **If `DATABASE_URL` env var exists** → PostgreSQL (Neon) ✅
2. **If Netlify/Serverless** → Memory storage
3. **Otherwise** → File storage (local)

## Testing Locally

### With Neon (Recommended)
```bash
# Get DATABASE_URL from Neon
# Add to .env.local
# Run dev server
npm run dev
```

### Without Neon (File Storage)
```bash
# Just run (uses file storage)
npm run dev
# Quizzes stored in server/quizzes/
```

## Netlify Environment Setup

In Netlify Dashboard → **Site settings → Build & deploy → Environment**:

Add these variables:
```
DATABASE_URL=postgresql://...  (Auto-added by Neon integration)
ANTHROPIC_API_KEY=your_key
```

## Database Schema

Automatically created in Neon:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255)
);

-- Quizzes table
CREATE TABLE quizzes (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Features with Neon

✅ **Persistent storage** - Quizzes never lost
✅ **Scale automatically** - Works with serverless
✅ **Real-time queries** - Fast access
✅ **Auto-backup** - Neon handles backups
✅ **Secure** - SSL connection to database
✅ **Free tier** - Generous limits

## Troubleshooting

### "Cannot find module 'pg'"
- Run: `npm install`
- Restart dev server

### "DATABASE_URL not set"
- Running locally without Neon? That's OK - will use file storage
- On Netlify? Add Neon integration to site

### "FATAL: password authentication failed"
- Check DATABASE_URL in .env.local
- Get fresh URL from Neon dashboard

### Quizzes not persisting
- Check if DATABASE_URL is set: `echo $DATABASE_URL`
- Check Neon database exists in Netlify dashboard
- Check server logs for errors

## Migration from File Storage

When you add Neon:
1. Old quizzes in `server/quizzes/` won't automatically transfer
2. New quizzes will go to PostgreSQL
3. To migrate: Copy old JSON files and re-upload them

## API Endpoints (No Change)

Same endpoints work with both file and database storage:

```
POST /api/save-quiz
GET /api/stored-quizzes  
DELETE /api/delete-quiz/:id
```

## Next Steps

1. ✅ Add Neon integration to Netlify
2. ✅ Deploy site
3. ✅ Test quiz upload
4. ✅ Verify data persists
5. 🎉 Done!

---

**Status**: Ready for Netlify with Neon PostgreSQL
**Storage**: Automatic based on environment
**Zero config**: Just deploy!
