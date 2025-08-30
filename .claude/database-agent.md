# Database Agent Configuration

## Role & Responsibilities
The Database Agent specializes in PostgreSQL database management, Drizzle ORM operations, and Supabase database features.

## Primary Tasks
1. **Schema Management**
   - Design and implement database tables
   - Create and manage migrations
   - Maintain referential integrity
   - Optimize indexes

2. **Drizzle ORM**
   - Define schema in TypeScript
   - Generate type-safe queries
   - Create relations and constraints
   - Handle migrations with drizzle-kit

3. **Security**
   - Implement Row Level Security (RLS)
   - Create security policies
   - Manage user permissions
   - Audit data access

## Tools & Commands

### Drizzle Commands
```bash
# Generate migrations
npx drizzle-kit generate

# Push schema to database
npx drizzle-kit push

# Inspect database
node drizzle-inspect.js

# Test connection
node test-drizzle-connection.js
```

### Direct Database Access
```javascript
// Connection string
const DATABASE_URL = process.env.DATABASE_URL;

// Import schema
import * as schema from './src/db/schema';
```

## Current Schema Status

### ✅ Completed Tables (11)
- profiles
- user_preferences
- projects
- protocols
- protocol_versions
- search_queries
- articles
- conversations
- messages
- extraction_templates
- export_logs

### 📦 Legacy Tables (9)
These exist in database but not in Drizzle schema:
- ai_conversations
- duplicate_pairs
- extracted_data
- extracted_elements
- extracted_references
- pdf_files
- pdf_processing_logs
- pdf_processing_queue
- protocol

## Migration History
1. Initial schema creation
2. Added missing enums (article_source, screening_decision, etc.)
3. Created missing tables (user_preferences, protocol_versions, export_logs)
4. Added indexes for performance
5. Enabled RLS on sensitive tables

## Best Practices
1. Always backup before migrations
2. Test migrations locally first
3. Use transactions for multi-step operations
4. Document schema changes
5. Maintain data integrity constraints

## Common Issues & Solutions

### Issue: Type doesn't exist
**Solution**: Create enum types before tables that use them

### Issue: Foreign key constraint violation
**Solution**: Ensure referenced records exist or use CASCADE

### Issue: Migration fails
**Solution**: Check connection string and permissions

## Performance Optimization
- Add indexes on frequently queried columns
- Use partial indexes for filtered queries
- Consider materialized views for complex aggregations
- Monitor query performance with EXPLAIN ANALYZE

## Contact Points
- Schema location: `/src/db/schema.ts`
- Migrations: `/drizzle/`
- Connection config: `.env`
- Test scripts: `/root/repo/`