# DotQuiz - Netlify Deployment Guide

## Overview
This guide explains how to deploy DotQuiz to Netlify.

## Prerequisites
- GitHub account (or GitLab/Bitbucket)
- Netlify account (free tier available at netlify.com)
- Project pushed to git repository

## Deployment Steps

### Step 1: Prepare Your Repository
1. Make sure all changes are committed:
   ```bash
   git add .
   git commit -m "Prepare for Netlify deployment"
   git push origin main
   ```

### Step 2: Connect to Netlify
1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Select your git provider (GitHub, GitLab, Bitbucket)
4. Authorize and select your `DotQuiz` repository

### Step 3: Configure Build Settings
The `netlify.toml` file already contains the necessary configuration:
- **Build command**: `npm run build`
- **Publish directory**: `dist/public`
- **Functions directory**: `netlify/functions`

Netlify should auto-detect these settings. If not:
1. Go to Site settings → Build & deploy → Build settings
2. Set Build command: `npm run build`
3. Set Publish directory: `dist/public`

### Step 4: Deploy
1. Click "Deploy site"
2. Netlify will automatically:
   - Install dependencies (`npm install`)
   - Build the project (`npm run build`)
   - Deploy the `dist/public` folder
3. Your site will be live at a `.netlify.app` domain

## Environment Variables
Set these in Netlify dashboard (Site settings → Build & deploy → Environment):
```
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=1024
```

## Key Features Configured

### 1. **SPA Routing**
The `netlify.toml` redirects all routes to `index.html` for client-side routing.

### 2. **Caching**
- Static assets: Cached for 1 year (immutable)
- HTML files: No caching (always fresh)

### 3. **Security Headers**
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Referrer-Policy

### 4. **Serverless Functions**
The `netlify/functions` directory can host serverless functions if needed in the future.

## Project Structure for Netlify
```
DotQuiz/
├── netlify.toml              # Netlify configuration
├── netlify/functions/        # Serverless functions
├── client/                   # React frontend
│   ├── src/
│   ├── index.html
│   └── vite.config.ts
├── server/                   # Express backend (optional)
├── script/build.ts          # Build script
├── package.json
└── tsconfig.json
```

## How DotQuiz Works on Netlify

### Client-Side (React + Vite)
- Builds to `dist/public` folder
- All UI runs in the browser
- Uses localStorage for quiz persistence
- No backend required for core functionality

### Optional Backend
- If API endpoints are added later, can use:
  - Netlify Functions (serverless)
  - External backend service
  - Supabase / Firebase for database

## Post-Deployment

### 1. Custom Domain
1. Go to Site settings → Domain management
2. Click "Add custom domain"
3. Point your domain's DNS to Netlify

### 2. HTTPS
- Automatically enabled (Let's Encrypt)
- No additional setup needed

### 3. CI/CD
- Every push to main branch triggers automatic deployment
- Preview deployments for pull requests
- Rollbacks available

### 4. Monitoring
- Check deployment status in Deploys tab
- View build logs if deployment fails
- Analytics available in Pro plan

## Troubleshooting

### Build Fails
1. Check build logs in Netlify dashboard
2. Run `npm run build` locally to reproduce
3. Common issues:
   - Missing environment variables
   - TypeScript errors
   - Missing dependencies

### Routes Not Working
- Verify `netlify.toml` redirect rules exist
- Check that `dist/public/index.html` exists after build

### Performance Issues
- Check Network tab in DevTools
- Optimize bundle size: `npm run build -- --analyze`
- Enable compression in Netlify (usually automatic)

## Local Testing

Test the build locally before deploying:
```bash
npm run build
npm install -g netlify-cli
netlify dev
```

This simulates the Netlify environment locally on `http://localhost:8888`.

## Continuous Deployment

Every push to your repository automatically:
1. Triggers a new build
2. Runs tests (if configured)
3. Deploys to production (on main branch)
4. Creates preview for pull requests

## Rollback

If deployment breaks:
1. Go to Deploys tab
2. Click on a previous successful deployment
3. Click "Publish deploy"

## Advanced Configuration

For future enhancements, you can add:
- Database connections (Supabase, MongoDB)
- Authentication (Netlify Identity, Auth0)
- Serverless functions in `netlify/functions/`
- Form handling with Netlify Forms
- Email notifications with Sendgrid

## Support

- Netlify Docs: https://docs.netlify.com
- Community Forums: https://community.netlify.com
- Contact Support: Netlify dashboard → Support

## Summary

Your DotQuiz application is now ready for Netlify deployment! The configuration includes:
✅ Automatic builds on git push
✅ SPA routing support
✅ Security headers
✅ Caching optimization
✅ Serverless functions ready
✅ Environment variable support
✅ HTTPS & custom domains

Simply connect your repository to Netlify and you're done! 🚀
