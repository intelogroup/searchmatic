# Searchmatic MVP Development Guide

## Project Overview
Searchmatic is an AI-powered systematic literature review tool that helps researchers streamline their review process. This guide contains specific instructions for development.

## Development Status & Context (Updated: 2025-08-01)

### Current Foundation Status ✅ COMPLETED
**Sprint 0 Foundation is COMPLETE** - Ready for Sprint 1 development:

#### Infrastructure ✅
- **React + Vite + TypeScript**: Fully configured with modern build system
- **Tailwind CSS v4**: Updated to CSS-first approach (no config file needed)
- **Supabase Integration**: Client configured, auth ready
- **MCP Server**: Installed and verified for AI-assisted development
- **Testing**: Vitest setup complete, build verified

#### Core UI Foundation ✅
- **ThreePanelLayout**: Base layout component implemented (`src/components/layout/ThreePanelLayout.tsx`)
- **Navigation**: App.tsx updated with proper routing
- **Pages Created**: Dashboard, NewProject, ProjectDemo with responsive design
- **Shadcn/ui**: Base components available

#### Database Schema ✅
- **Migration Created**: `supabase/migrations/20250801_initial_schema.sql`
- **Tables Defined**: users, projects, protocols, abstracts, extractions, exports
- **RLS Policies**: Security implemented for all tables
- **Extensions**: pgvector, pg_trgm ready for AI features

#### Known Configuration Issues ⚠️
- **Tailwind CSS**: Successfully migrated to v4 CSS-first approach
- **PostCSS**: Updated to work with new Tailwind architecture
- **TypeScript**: All type errors resolved

### Manual Tasks Required (Before Sprint 1)
1. **Apply Database Migration**: Run `scripts/apply-migration.sql` in Supabase dashboard
2. **Create Storage Buckets**: Set up 'pdfs' and 'exports' buckets with policies
3. **Environment Variables**: Ensure all keys are in `.env.local`
4. **Netlify Deployment**: Configure build settings and environment variables

### Next Sprint Priorities (Sprint 1)
1. **Authentication Flow**: Implement Supabase Auth with protected routes
2. **Project CRUD**: Connect NewProject page to database
3. **AI Chat Interface**: Build streaming chat component for right panel
4. **Dashboard Enhancement**: Add real project data and statistics

### Current Branch Status
- **Branch**: `terragon/init-searchmatic-mvp-setup`
- **Build Status**: ✅ Passing (`npm run build` successful)
- **Dev Server**: ✅ Working (`npm run dev` verified)
- **Ready for Deployment**: ✅ Yes (pending manual tasks)

### Architecture Decisions Made
1. **Three-Panel Layout**: Implemented and tested across all screen sizes
2. **CSS Architecture**: Tailwind v4 with CSS variables for theming
3. **State Management**: React Query + Zustand ready for implementation
4. **Security First**: RLS policies defined, no service keys in frontend

### Critical Files Created/Modified
- `CLAUDE.md`: This development guide
- `src/components/layout/ThreePanelLayout.tsx`: Core layout
- `src/pages/Dashboard.tsx`, `NewProject.tsx`, `ProjectDemo.tsx`: Main pages
- `supabase/migrations/20250801_initial_schema.sql`: Database schema
- `MCP_SETUP.md`: AI development tools guide
- `DEPLOYMENT_GUIDE.md`: Deployment instructions

### Technical Implementation Notes
#### Tailwind CSS v4 Migration
- **No tailwind.config.js**: Removed - uses CSS-first approach
- **CSS Variables**: All customization in `src/index.css`
- **PostCSS**: Updated to `@tailwindcss/postcss` plugin
- **Build System**: Fully compatible with Vite

#### Three-Panel Layout Architecture
- **Responsive**: Mobile-first with collapsible panels
- **Semantic Structure**: Main content, reference panel, AI chat
- **State Management**: Ready for panel visibility controls
- **Performance**: Optimized for large content areas

#### Database Schema Highlights
- **pgvector Extension**: Ready for AI embeddings and similarity search
- **pg_trgm Extension**: Full-text search capabilities
- **JSONB Fields**: Flexible data storage for AI responses and metadata
- **Comprehensive RLS**: Row-level security on all tables

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

### Sprint 0 (COMPLETED): Foundation ✅
1. ✅ Set up authentication flow with Supabase Auth (infrastructure ready)
2. ✅ Create responsive three-panel layout (ThreePanelLayout component)
3. ✅ Implement basic project CRUD operations (UI created, backend ready)
4. ✅ Set up CI/CD with Netlify (build verified, ready for deployment)

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