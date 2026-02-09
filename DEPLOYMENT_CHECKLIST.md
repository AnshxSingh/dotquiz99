# DotQuiz Netlify Deployment Checklist

## Pre-Deployment Checklist

### Code Quality
- [ ] Run `npm run check` - TypeScript check passes
- [ ] Run `npm run build` - Build completes successfully locally
- [ ] All console errors are resolved
- [ ] No console warnings in production build
- [ ] Test on multiple browsers (Chrome, Firefox, Safari, Edge)

### Functionality
- [ ] Quiz upload works correctly
- [ ] Quiz completion saves results
- [ ] Reattempt functionality works
- [ ] Exit quiz confirmation works
- [ ] Responsive design verified on mobile
- [ ] Dark/light theme toggle works
- [ ] localStorage persistence verified

### Git Repository
- [ ] All changes committed to git
- [ ] Repository is on GitHub (or GitLab/Bitbucket)
- [ ] Main branch is clean and stable
- [ ] No merge conflicts

### Netlify Account Setup
- [ ] Create/login to netlify.com
- [ ] Authorize Netlify with GitHub
- [ ] Save `NETLIFY_SITE_ID` for CI/CD (if using GitHub Actions)

## Deployment Steps

### Step 1: Initial Setup
```bash
# Push code to GitHub
git add .
git commit -m "Prepare for Netlify deployment"
git push origin main
```

### Step 2: Connect to Netlify
1. Go to https://netlify.com
2. Click "Add new site" → "Import an existing project"
3. Select GitHub
4. Select your `DotQuiz` repository
5. Verify build settings:
   - Build command: `npm run build`
   - Publish directory: `dist/public`

### Step 3: Configure Environment Variables (if needed)
1. Site settings → Build & deploy → Environment
2. Add variables:
   - `NODE_ENV=production`
   - `NODE_OPTIONS=--max-old-space-size=1024`

### Step 4: Deploy
1. Click "Deploy site"
2. Wait for build to complete
3. Access your site at `[name].netlify.app`

### Step 5: Custom Domain (Optional)
1. Go to Domain settings
2. Add custom domain
3. Point DNS records to Netlify

## Post-Deployment Checklist

### Verify Deployment
- [ ] Site loads without errors
- [ ] Quiz functionality works
- [ ] localStorage works (quiz saves/loads)
- [ ] No 404 errors for routes (SPA routing works)
- [ ] Assets load correctly
- [ ] Images and styles render properly
- [ ] Dark theme works
- [ ] Mobile responsive on deployed site

### Monitor Performance
- [ ] Check Lighthouse score
- [ ] Verify load time < 3 seconds
- [ ] Check Core Web Vitals
- [ ] Monitor error logs in Netlify

### Security Check
- [ ] HTTPS enabled (automatic)
- [ ] Security headers present
- [ ] No sensitive data in logs
- [ ] No API keys exposed

## GitHub Actions CI/CD Setup (Optional)

If using GitHub Actions for automatic deployment:

1. Get Netlify credentials:
   ```bash
   netlify login
   # This creates ~/.netlify/state.json
   ```

2. Get Site ID:
   ```bash
   netlify sites:list
   ```

3. Add GitHub Secrets:
   - Go to GitHub repo → Settings → Secrets and variables → Actions
   - Add:
     - `NETLIFY_AUTH_TOKEN`: From `netlify status`
     - `NETLIFY_SITE_ID`: From `netlify sites:list`

4. GitHub Actions will now:
   - Run on every push to main
   - Build the project
   - Deploy to Netlify automatically

## Troubleshooting

### Build Fails on Netlify
- Check build logs in Netlify dashboard
- Run locally: `npm run build`
- Common fixes:
  - Clear cache: Site settings → Deploys → Trigger clear cache
  - Check Node version matches
  - Verify all dependencies in package.json

### Site Shows Old Version
- Netlify cache issue
- Solution:
  1. Site settings → Deploys → Trigger clear cache and deploy
  2. Or redeploy previous successful version

### Routes Return 404
- SPA routing not configured
- Solution:
  1. Verify `netlify.toml` exists in root
  2. Check `dist/public/index.html` exists
  3. Redeploy

### Performance Issues
- Check bundle size: `npm run build` and examine `dist/public`
- Enable Netlify CDN (automatic)
- Monitor in Netlify Analytics

### localStorage Not Working
- Not an issue - localStorage works in browser
- Test in browser DevTools → Application → Local Storage

## Monitoring & Maintenance

### Daily
- Monitor Netlify dashboard for failed deployments
- Check error logs if issues reported

### Weekly
- Review performance metrics
- Check for security updates in npm packages

### Monthly
- Update dependencies: `npm update`
- Test all functionality
- Review user feedback

## Rollback Procedure

If deployment breaks:
```
Netlify Dashboard → Deploys → Click previous successful deploy → Publish deploy
```

## Advanced: Custom API Endpoints

To add backend API in future:

Option 1: Netlify Functions
```typescript
// netlify/functions/my-api.ts
export const handler = async (event: any) => {
  // Your API logic
  return { statusCode: 200, body: JSON.stringify({}) };
};
```

Option 2: External Backend
```typescript
// Set API_URL environment variable
const apiUrl = process.env.API_URL || 'https://api.example.com';
```

## Success Criteria

Deployment is successful when:
✅ Site loads at https://[domain].netlify.app
✅ All routes work without 404
✅ Quiz functionality works end-to-end
✅ localStorage persists data
✅ Mobile responsive
✅ No console errors
✅ Lighthouse score > 80

## Support & Resources

- Netlify Docs: https://docs.netlify.com
- Build logs: Available in Netlify dashboard
- Status: Check Netlify status page for outages
- Community: netlify.com/community

## Quick Reference

### Common Netlify Commands
```bash
# Install CLI
npm install -g netlify-cli

# Login
netlify login

# Local preview
netlify dev

# Deploy manually
netlify deploy --prod

# View logs
netlify api:listBuilds --json
```

### Environment Variables Location
Netlify Dashboard → Site settings → Build & deploy → Environment

### Clear Cache
Netlify Dashboard → Site settings → Deploys → Trigger clear cache

### Domain Settings
Netlify Dashboard → Site settings → Domain management

---

**Status**: Ready for deployment 🚀
**Last Updated**: December 27, 2025
