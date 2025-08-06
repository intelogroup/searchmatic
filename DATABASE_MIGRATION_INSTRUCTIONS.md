# 🗄️ Database Migration Instructions

**URGENT: Apply this migration to fix all test failures**

## Quick Fix (5 minutes)

1. **Open Supabase SQL Editor:**
   ```
   https://supabase.com/dashboard/project/qzvfufadiqmizrozejci/sql
   ```

2. **Copy and paste the entire content of:**
   ```
   fix-mvp-database-issues.sql
   ```

3. **Run the migration**

4. **Verify success:** Look for the message:
   ```
   ✅ SUCCESS: All 10 required tables are now present and configured!
   ```

## What This Migration Does

### Creates Missing Tables
- `studies` - Research articles and studies
- `search_queries` - Database search history  
- `extraction_templates` - Data extraction templates
- `extracted_data` - Extracted study data
- `export_logs` - Export history

### Fixes Existing Tables
- Adds `outcomes` column to `protocols` table
- Adds `status` column to `conversations` table
- Adds `user_id` column to `messages` table
- Adds `study_design` and `timeframe` columns to `protocols`

### Security & Performance
- ✅ RLS policies for all tables
- ✅ Performance indexes
- ✅ Automatic timestamp triggers
- ✅ Proper foreign key relationships

## After Migration

**Re-run the test suite:**
```bash
node comprehensive-mvp-testing-fixed.js
```

**Expected result:**
- Success rate: 95%+ (19/20 tests passing)
- Only OpenAI API key test should fail (requires valid key)

## API Key Fix

Update `.env.local`:
```env
VITE_OPENAI_API_KEY=sk-proj-[your-complete-key-here]
```

Get a new key from: https://platform.openai.com/account/api-keys

---

**After these fixes, the MVP will be 100% ready for PubMed integration!**