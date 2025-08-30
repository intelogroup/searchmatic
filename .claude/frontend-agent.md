# Frontend Agent Configuration

## Role & Responsibilities
The Frontend Agent specializes in React development, TypeScript, UI/UX implementation, and client-side state management.

## Tech Stack
- **Framework**: React 18
- **Language**: TypeScript (strict mode)
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: React Context + Hooks
- **Data Fetching**: @tanstack/react-query
- **Routing**: React Router v6
- **UI Components**: Custom + Headless UI

## Project Structure
```
src/
├── components/       # Reusable components
├── pages/           # Page components
├── services/        # API services
├── hooks/           # Custom React hooks
├── utils/           # Utility functions
├── types/           # TypeScript types
├── styles/          # Global styles
└── db/             # Database schema & client
```

## Component Guidelines

### Component Template
```tsx
import { FC, useState, useEffect } from 'react';

interface ComponentProps {
  // Props definition
}

export const Component: FC<ComponentProps> = ({ ...props }) => {
  // State and hooks
  const [state, setState] = useState();
  
  // Effects
  useEffect(() => {
    // Side effects
  }, []);
  
  // Event handlers
  const handleEvent = () => {
    // Logic
  };
  
  // Render
  return (
    <div className="tailwind-classes">
      {/* JSX */}
    </div>
  );
};
```

## State Management Patterns

### Context Provider
```tsx
import { createContext, useContext, useState, ReactNode } from 'react';

interface ContextType {
  // Context shape
}

const Context = createContext<ContextType | undefined>(undefined);

export const Provider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState();
  
  return (
    <Context.Provider value={{ state, setState }}>
      {children}
    </Context.Provider>
  );
};

export const useCustomContext = () => {
  const context = useContext(Context);
  if (!context) throw new Error('useContext must be used within Provider');
  return context;
};
```

## Supabase Integration

### Client Setup
```tsx
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### Authentication Hook
```tsx
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);
  
  return { user, loading };
};
```

## Styling Guidelines

### TailwindCSS Classes
```tsx
// Layout
<div className="container mx-auto px-4">

// Flexbox
<div className="flex items-center justify-between">

// Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Typography
<h1 className="text-3xl font-bold text-gray-900">

// Buttons
<button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">

// Cards
<div className="bg-white rounded-lg shadow-md p-6">
```

## Performance Optimization

### Code Splitting
```tsx
import { lazy, Suspense } from 'react';

const LazyComponent = lazy(() => import('./LazyComponent'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </Suspense>
  );
}
```

### Memoization
```tsx
import { memo, useMemo, useCallback } from 'react';

const MemoizedComponent = memo(({ data }) => {
  const processedData = useMemo(() => 
    expensiveOperation(data), [data]
  );
  
  const handleClick = useCallback(() => {
    // Handler logic
  }, [dependency]);
  
  return <div>{processedData}</div>;
});
```

## Testing

### Component Testing
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Component } from './Component';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
  
  it('handles user interaction', () => {
    render(<Component />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Updated Text')).toBeInTheDocument();
  });
});
```

## Build & Development

### Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

## Environment Variables
```env
VITE_SUPABASE_URL=https://qzvfufadiqmizrozejci.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS
VITE_OPENAI_API_KEY=your-key
VITE_DEEPSEEK_API_KEY=your-key
VITE_GEMINI_API_KEY=your-key
```

## Common Patterns

### Protected Routes
```tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  return children;
};
```

### Error Boundary
```tsx
import { Component, ErrorInfo, ReactNode } from 'react';

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <div>Something went wrong</div>;
    }
    return this.props.children;
  }
}
```

## Best Practices
1. Use TypeScript strict mode
2. Keep components small and focused
3. Extract reusable logic to hooks
4. Implement proper error handling
5. Optimize bundle size
6. Use semantic HTML
7. Ensure accessibility (a11y)
8. Follow React 18 best practices