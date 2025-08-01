# 🚀 Searchmatic MVP Deployment Guide

## Step 1: Apply Database Migration (5 minutes)

### Option A: Using Supabase Dashboard
1. Go to your Supabase project: https://supabase.com/dashboard/project/qzvfufadiqmizrozejci
2. Navigate to **SQL Editor**
3. Copy the entire contents of `scripts/apply-migration.sql`
4. Paste and run the SQL
5. Verify you see: "Database migration completed successfully!"

### Option B: Using Supabase CLI (if you have it installed)
```bash
supabase db push
```

## Step 2: Create Storage Buckets (2 minutes)

1. In Supabase Dashboard, go to **Storage**
2. Create two buckets:
   - `pdfs` (for PDF files)
   - `exports` (for generated exports)
3. Set both to **Private** with RLS policies

## Step 3: Configure Edge Functions (3 minutes)

1. In Supabase Dashboard, go to **Edge Functions**
2. Go to **Settings** → **Secrets**
3. Add the following secrets:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

## Step 4: Deploy to Netlify (5 minutes)

### Prerequisites
- GitHub repository for this project
- Netlify account

### Steps
1. **Push to GitHub**: Commit and push all current code
2. **Connect to Netlify**:
   - Go to netlify.com
   - "New site from Git"
   - Select your repository
3. **Configure Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. **Set Environment Variables**:
   ```
   VITE_SUPABASE_URL=https://qzvfufadiqmizrozejci.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS
   VITE_ENABLE_DEV_TOOLS=false
   ```
5. **Deploy**: Click "Deploy site"

## Step 5: Test the Deployment (2 minutes)

1. Visit your Netlify URL
2. Test user registration
3. Test login/logout
4. Create a test project
5. Verify three-panel layout appears

## 🎯 What You'll See After Deployment

### ✅ Working Features:
- User authentication (signup/login/logout)
- Project dashboard
- Project creation
- Three-panel layout
- Responsive design
- Professional UI with shadcn/ui components

### 🚧 Coming Next (Sprint 1):
- AI chat interface
- Protocol generation
- Real OpenAI integration
- Project management features

## 🔧 Quick Development Commands

```bash
# Start local development
npm run dev

# Test production build
npm run build && npm run preview

# Run tests
npm run test

# Type checking
npm run type-check
```

## 🚨 Troubleshooting

### Build Fails
```bash
npm run type-check
```
Fix any TypeScript errors first.

### Database Connection Issues
- Verify environment variables in Netlify
- Check RLS policies are enabled
- Confirm migration ran successfully

### Authentication Issues
- Check Supabase project URL and key
- Verify you're using the publishable key (not secret)
- Check browser console for errors

## 📊 Success Metrics

After deployment, you should have:
- ✅ Live, accessible web application
- ✅ Working user registration and login
- ✅ Professional, modern UI
- ✅ Responsive design (works on mobile)
- ✅ Secure authentication with RLS
- ✅ Foundation for MVP features

**Total Setup Time**: ~15 minutes
**Result**: Production-ready foundation for Searchmatic MVP

---

🎉 **Congratulations!** You'll have a live, working application that users can access and start using as we build out the AI features.