# Searchmatic MVP Development Guide

## Project Overview
Searchmatic is an AI-powered systematic literature review tool that helps researchers streamline their review process. This guide contains specific instructions for development.

## Critical Project Information

### Supabase Configuration
- **Project URL**: https://qzvfufadiqmizrozejci.supabase.co
- **Publishable Key**: sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS
- **Project Reference ID**: qzvfufadiqmizrozejci
- **Access Token (for MCP)**: sbp_99c994d6970e1d4cb36d4cb8caae9e120e499337

**Important**: The publishable key above is safe to use in the browser because we have enabled Row Level Security (RLS) for all tables and configured proper policies. This key can be safely shared publicly and is already configured in the `.env.local` file.

### MCP Server Setup
The project includes MCP (Model Context Protocol) configuration for AI-assisted database operations:
- **VS Code/Cursor**: Configuration in `.vscode/mcp.json`
- **Claude Desktop**: Use `claude-desktop-mcp-config.json`
- **Setup Guide**: See `MCP_SETUP.md` for detailed instructions
- **Mode**: Read-only access for safety

## Core Architecture Decisions

### Frontend Stack
- **React + Vite + TypeScript**: Fast development with type safety
- **Tailwind CSS + Shadcn/ui**: Rapid UI development with consistent design
- **React Router**: Client-side routing
- **React Query (TanStack Query)**: Server state management with Supabase
- **Zustand**: Client state management for complex UI state

### Backend Stack
- **Supabase**: Complete BaaS solution
  - Auth: User management with RLS
  - Postgres: Main database with pgvector and pg_trgm extensions
  - Storage: PDF file management
  - Edge Functions: Serverless compute
  - Realtime: Live updates

### Testing Strategy
- **Vitest**: Unit and integration tests
- **React Testing Library**: Component testing
- **Playwright**: E2E testing for critical user journeys
- **MSW**: Mock Service Worker for API testing
  
### Important Instructions
1. We need to test or unit after big changes to make sure everything work before moving forward.
2. Make sure you MCP on first intention and then ClI tools.
3. Make sure you use appwrite mcp and use other mcp like chadcn and Superclaude to manage our context usage.
4. Use on first intentions exa search to check for developers curated and uptodate informations and help you fix bugs better.
5. Any time user prompt you to change or implement something you have to always get the latest full context of the database , its data and schema etc.. before making changes even if there is nothing to do with the db.

## Development Principles

### 1. Three-Panel UI Architecture
Every screen follows the three-panel layout:
```
+------------------+------------------+------------------+
| Main Content     | Protocol Panel   | AI Chat          |
| (Primary Work)   | (Reference)      | (Assistant)      |
+------------------+------------------+------------------+
```

### 2. Progressive Enhancement
- Start with basic functionality, enhance with AI
- Always provide fallbacks for AI failures
- Show loading states and progress indicators

### 3. Data Security
- All data access through RLS policies
- Never expose Supabase service key to frontend
- Use Edge Functions for sensitive operations

### 4. Performance Guidelines
- Lazy load heavy components
- Implement virtual scrolling for large lists
- Use React.memo for expensive renders
- Cache API responses with React Query

## Code Conventions

### File Structure
```
src/
├── components/
│   ├── ui/           # Shadcn components
│   ├── layout/       # Layout components
│   └── features/     # Feature-specific components
├── hooks/            # Custom React hooks
├── lib/              # Utilities and configs
├── pages/            # Route components
├── services/         # API and Supabase services
├── stores/           # Zustand stores
└── types/            # TypeScript types
```

### Naming Conventions
- Components: PascalCase (e.g., `QueryBuilder.tsx`)
- Hooks: camelCase with 'use' prefix (e.g., `useProject.ts`)
- Services: camelCase (e.g., `projectService.ts`)
- Types: PascalCase with 'T' prefix for generics (e.g., `TProject`)

### Component Guidelines
```typescript
// Always use functional components with TypeScript
interface ComponentProps {
  title: string;
  onAction: () => void;
}

export const Component: React.FC<ComponentProps> = ({ title, onAction }) => {
  // Hook calls at the top
  const { data, isLoading } = useQuery();
  
  // Early returns for loading/error states
  if (isLoading) return <Spinner />;
  
  // Main render
  return <div>{/* content */}</div>;
};
```

## Sprint-Specific Guidelines

### Sprint 0 (Current): Foundation
1. Set up authentication flow with Supabase Auth
2. Create responsive three-panel layout
3. Implement basic project CRUD operations
4. Set up CI/CD with Netlify

### Sprint 1: Core Platform
1. Implement guided scoping with streaming AI responses
2. Build protocol generation and lock-in mechanism
3. Create project dashboard with real-time updates
4. Add comprehensive error handling

### Sprint 2: Query Building
1. Implement multi-database query builder
2. Add real-time count checking
3. Build query history and versioning
4. Create query templates system

### Sprint 3: Data Pipeline
1. Implement robust PDF processing pipeline
2. Add progress tracking for long operations
3. Build deduplication UI with similarity scores
4. Create queueing system for batch operations

### Sprint 4: Extraction & Export
1. Build flexible extraction template system
2. Implement validation UI with source highlighting
3. Create comprehensive export system
4. Add data quality checks

## Testing Requirements

### Unit Tests (Required for):
- All service functions
- Complex utility functions
- State management logic
- Custom hooks

### Integration Tests (Required for):
- Authentication flows
- Project CRUD operations
- Data extraction pipeline
- Export functionality

### E2E Tests (Critical Paths):
1. New user signup → create project → export
2. Guided scoping → query building → fetch abstracts
3. Upload PDFs → extract data → validate → export

## Performance Targets
- Initial page load: < 3s
- API response time: < 500ms (excluding AI calls)
- AI response streaming: Start < 1s
- PDF processing: < 30s per document
- Export generation: < 10s for 100 articles

## Security Checklist
- [ ] RLS policies on all tables
- [ ] Storage bucket policies configured
- [ ] API keys in environment variables only
- [ ] Input validation on all forms
- [ ] XSS protection in user content display
- [ ] Rate limiting on Edge Functions

## Deployment Checklist
- [ ] Environment variables configured in Netlify
- [ ] Build optimization enabled
- [ ] Error tracking configured (Sentry)
- [ ] Analytics configured
- [ ] SEO meta tags updated
- [ ] Performance monitoring enabled

## AI Integration Guidelines

### LLM Prompt Engineering
- Use system prompts for consistent behavior
- Include examples in prompts
- Stream responses for better UX
- Handle token limits gracefully

### Error Handling
- Always provide fallback behavior
- Log errors for debugging
- Show user-friendly error messages
- Implement retry logic for transient failures

## Database Design Principles
- Use UUIDs for all primary keys
- Add created_at/updated_at to all tables
- Index columns used in WHERE clauses
- Use JSONB for flexible data structures
- Implement soft deletes where appropriate

## Quick Commands
```bash
# Development
npm run dev              # Start dev server
npm run test            # Run tests
npm run test:e2e        # Run E2E tests
npm run lint            # Lint code
npm run type-check      # Check TypeScript

# Database
npm run db:migrate      # Run migrations
npm run db:seed         # Seed test data
npm run db:reset        # Reset database

# Deployment
npm run build           # Production build
npm run preview         # Preview production build
```

## Common Pitfalls to Avoid
1. Don't store sensitive data in localStorage
2. Don't make direct database calls from frontend
3. Don't ignore loading and error states
4. Don't skip RLS policy testing
5. Don't hardcode API endpoints
6. Don't forget to handle offline scenarios

## Resources
- [Supabase Docs](https://supabase.com/docs)
- [Shadcn/ui Components](https://ui.shadcn.com)
- [React Query Docs](https://tanstack.com/query)
- [Vite Docs](https://vitejs.dev)

## Contact & Support
- Technical issues: Create GitHub issue
- Urgent bugs: Tag with 'critical'
- Feature requests: Use 'enhancement' label
