# CRITICAL SCHEMA FIX - DEPLOYMENT GUIDE

## 🚨 CRITICAL DATABASE SCHEMA MISMATCH RESOLVED

This document outlines the resolution of the critical database schema mismatch that was preventing project creation and causing application crashes.

## Problem Summary

The `projectService.ts` expected the following fields that **did not exist** in the database:
- ❌ `project_type` - Required for project creation
- ❌ `research_domain` - Optional field for project metadata
- ❌ `progress_percentage` - Required for progress tracking
- ❌ `current_stage` - Required for workflow management
- ❌ `last_activity_at` - Required for project ordering

Additional issues:
- ❌ `project_status` enum missing `draft` and `review` values
- ❌ TypeScript types didn't match expected database schema

## Solution Implemented

### 1. Migration Created: `20250807_fix_project_schema.sql`

**Location**: `/root/repo/supabase/migrations/20250807_fix_project_schema.sql`

**Key Changes**:
- ✅ Added missing `project_type` column with constraint
- ✅ Added missing `research_domain` column (nullable)
- ✅ Added missing `progress_percentage` column with range constraint (0-100)
- ✅ Added missing `current_stage` column with default value
- ✅ Added missing `last_activity_at` column with auto-update trigger
- ✅ Updated `project_status` enum to include `draft` and `review`
- ✅ Created `get_project_stats` function for service compatibility
- ✅ Added performance indexes for new fields
- ✅ Updated existing projects with valid default values

### 2. TypeScript Types Updated: `src/types/database.ts`

**Changes Made**:
- ✅ Added all missing fields to `projects` table Row/Insert/Update types
- ✅ Updated `project_status` enum to include all required values
- ✅ Added new `project_type` enum definition
- ✅ Ensured full compatibility with `projectService.ts`

### 3. Integration Test Created: `src/__tests__/project-schema-integration.test.ts`

**Validation Coverage**:
- ✅ All required project fields exist in TypeScript types
- ✅ All enum values are correctly defined
- ✅ CreateProject and UpdateProject interfaces match database types
- ✅ Progress percentage validation logic
- ✅ Required field validation for project creation

## Deployment Instructions

### Step 1: Apply Database Migration

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
2. Copy and paste the contents of `supabase/migrations/20250807_fix_project_schema.sql`
3. Click "Run" to execute the migration
4. Verify success message: "✓ SCHEMA-APPLICATION MISMATCH RESOLVED"

### Step 2: Verify Migration Success

After running the migration, you should see:
```sql
✓ SUCCESS: All required project columns are now present
✓ project_type column added with constraint
✓ research_domain column added
✓ progress_percentage column added with range constraint
✓ current_stage column added
✓ last_activity_at column added with auto-update trigger
✓ project_status enum updated with all required values
✓ get_project_stats function created
✓ Performance indexes created
```

### Step 3: Deploy Application Code

The TypeScript types have already been updated, so you can deploy the application code immediately after applying the migration.

## Validation Commands

Run these commands to verify the fix:

```bash
# Run the validation script
node scripts/validate-schema-fix.js

# Run the integration tests
npm test src/__tests__/project-schema-integration.test.ts
```

## Impact on Application Functions

After this fix, the following functions will work correctly:

### ✅ `projectService.createProject()`
- Can now set `project_type`, `research_domain`, `progress_percentage`, `current_stage`
- Will automatically set `last_activity_at`
- Uses correct `draft` status by default

### ✅ `projectService.getUserProjects()`
- Can now order by `last_activity_at`
- Will receive all project fields including the new ones
- `get_project_stats` function provides statistics

### ✅ `projectService.updateProject()`
- Can now update `status`, `progress_percentage`, `current_stage`, `research_domain`
- `last_activity_at` automatically updates via trigger

### ✅ `projectService.getDashboardStats()`
- Can now access `progress_percentage` for all projects
- Statistics calculations will work correctly

## Backward Compatibility

- ✅ **Existing projects**: Automatically updated with valid default values
- ✅ **Existing code**: No breaking changes to current functionality
- ✅ **API contracts**: All existing endpoints continue to work
- ✅ **RLS policies**: All security policies preserved

## Performance Improvements

- ✅ Indexes added for new columns for optimal query performance
- ✅ `last_activity_at` index for efficient project ordering
- ✅ `progress_percentage` index for dashboard statistics
- ✅ `project_type` and `research_domain` indexes for filtering

## Security

- ✅ All existing RLS policies maintained
- ✅ New fields covered by existing project ownership policies
- ✅ Constraints added to prevent invalid data

## Post-Deployment Verification

After deployment, verify the fix works by:

1. **Create a new project** - Should work without errors
2. **View project list** - Should show projects ordered by activity
3. **Update project progress** - Should accept progress percentage updates
4. **Check dashboard stats** - Should display accurate statistics

## Files Changed

1. **`/supabase/migrations/20250807_fix_project_schema.sql`** - New migration file
2. **`/src/types/database.ts`** - Updated TypeScript types
3. **`/scripts/validate-schema-fix.js`** - Validation script
4. **`/src/__tests__/project-schema-integration.test.ts`** - Integration tests
5. **`/SCHEMA_FIX_DEPLOYMENT_GUIDE.md`** - This deployment guide

---

## ✅ DEPLOYMENT STATUS: READY

**The critical schema-application mismatch has been resolved.**

**Run the migration to unblock MVP deployment.**