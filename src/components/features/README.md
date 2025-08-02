# Feature Components

This directory contains feature-specific components organized by domain:

## 📁 Directory Structure

- **`auth/`** - Authentication components (login forms, signup, password reset)
- **`projects/`** - Project management components (project cards, forms, lists)
- **`search/`** - Search and query building components (query builder, database connectors)
- **`chat/`** - AI chat and assistant components (chat interface, message components)
- **`protocol/`** - Research protocol components (PICO forms, protocol editors)

## 🏗️ Component Organization

Each feature directory should contain:
- `index.ts` - Export barrel for clean imports
- Component files following PascalCase naming
- Feature-specific hooks and utilities
- Tests co-located with components

## 📋 Coming Soon Components

### Auth Features
- [ ] LoginForm
- [ ] SignupForm
- [ ] PasswordReset
- [ ] ProfileSettings

### Project Features
- [ ] ProjectCard
- [ ] ProjectList
- [ ] ProjectForm
- [ ] ProjectStats

### Search Features
- [ ] QueryBuilder
- [ ] DatabaseConnector
- [ ] ResultsPreview
- [ ] SearchHistory

### Chat Features
- [ ] ChatInterface
- [ ] MessageBubble
- [ ] TypingIndicator
- [ ] ChatHistory

### Protocol Features
- [ ] PICOForm
- [ ] ProtocolEditor
- [ ] ProtocolPreview
- [ ] ProtocolLock

## 🎯 Development Notes

All components should:
- Use TypeScript with proper typing
- Follow our established design patterns
- Include proper error handling
- Be tested with Vitest
- Use our shared UI components from `../ui/`