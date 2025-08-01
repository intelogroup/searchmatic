# Searchmatic MVP

An AI-powered systematic literature review tool that streamlines the research process for academics.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/searchmatic-mvp.git
cd searchmatic-mvp
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
```

## 🏗️ Project Structure

```
searchmatic-mvp/
├── src/
│   ├── components/
│   │   ├── ui/          # Shadcn/ui components
│   │   ├── layout/      # Layout components
│   │   └── features/    # Feature-specific components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities and configs
│   ├── pages/           # Route components
│   ├── services/        # API and Supabase services
│   ├── stores/          # Zustand state management
│   └── types/           # TypeScript types
├── supabase/
│   ├── functions/       # Edge Functions
│   └── migrations/      # Database migrations
├── public/              # Static assets
└── tests/               # Test files
```

## 🧪 Testing

Run tests:
```bash
npm run test
```

Run tests with UI:
```bash
npm run test:ui
```

Run tests with coverage:
```bash
npm run test:coverage
```

## 📦 Deployment

### Netlify Deployment

1. Connect your GitHub repository to Netlify
2. Set environment variables in Netlify dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy settings are configured in `netlify.toml`

### Supabase Setup

1. Create a new Supabase project
2. Run the migration:
   - Go to SQL Editor in Supabase dashboard
   - Copy contents of `supabase/migrations/20250801_initial_schema.sql`
   - Execute the SQL
3. Enable required extensions:
   - pgvector
   - pg_trgm
4. Set up storage buckets:
   - Create `pdfs` bucket for PDF storage
   - Create `exports` bucket for export files
5. Configure Edge Functions environment variables

## 🛠️ Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Type checking
npm run type-check

# Run tests
npm run test
```

## 🔑 Key Features

- **Three-Panel UI**: Main content, protocol panel, and AI chat assistant
- **AI-Guided Scoping**: Professor persona helps define research scope
- **Interactive Query Building**: Test and refine search queries
- **Smart Deduplication**: AI-assisted duplicate detection
- **PDF Processing**: Extract structured data from research papers
- **Export Functionality**: Generate comprehensive Excel reports

## 🏛️ Architecture

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + Shadcn/ui
- **State Management**: Zustand + React Query
- **Backend**: Supabase (Auth, Database, Storage, Edge Functions)
- **Testing**: Vitest + React Testing Library
- **Deployment**: Netlify

## 🔒 Security

- Row Level Security (RLS) policies on all tables
- Secure authentication with Supabase Auth
- Environment variables for sensitive data
- Input validation and sanitization

## 📝 Database Schema

Key tables:
- `profiles`: User profiles
- `projects`: Research projects
- `articles`: Research articles and papers
- `conversations`: AI chat conversations
- `messages`: Chat messages
- `extraction_templates`: Data extraction templates

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with [Supabase](https://supabase.com)
- UI components from [Shadcn/ui](https://ui.shadcn.com)
- Deployed on [Netlify](https://netlify.com)
