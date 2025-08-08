# 🤖 Stack-Aware Agents System

## Overview
The 15 specialized subagents now automatically detect and adapt to your technology stack, intelligently selecting the best MCP tools for your specific setup.

## 🔍 **AUTOMATIC STACK DETECTION**

### **Database Stack Detection**
```typescript
// Agent detects stack from:
- package.json dependencies
- Environment variables (SUPABASE_URL, DATABASE_URL)  
- Config files (prisma/schema.prisma, convex/schema.ts)
- Connection strings patterns

// Example auto-detection:
if (hasSupabaseUrl) → Use: supabase-db, supabase-admin, postgres
if (hasNeonUrl) → Use: postgres, typescript, filesystem
if (hasPrismaSchema) → Use: postgres, typescript, filesystem
if (hasConvexConfig) → Use: typescript, filesystem, memory
```

### **Frontend Framework Detection**  
```typescript
// Agent detects from package.json dependencies:
"react" → Tools: typescript, storybook, eslint, figma
"vue" → Tools: typescript, storybook-alt, eslint-server, figma
"svelte" → Tools: typescript, playwright, eslint, figma
"@nuxt/core" → Tools: typescript, playwright, eslint-server, figma

// Styling system detection:
"tailwindcss" → Tools: figma, typescript, eslint
"styled-components" → Tools: typescript, storybook, eslint
"@mui/material" → Tools: typescript, storybook, figma
```

### **Deployment Platform Detection**
```typescript
// Agent detects from:
- netlify.toml → Use: netlify-cli, github, git
- vercel.json → Use: github, git, filesystem, docker
- railway.toml → Use: docker, github, git, filesystem
- Dockerfile → Use: docker, kubernetes, terraform, aws
- .github/workflows → Use: github, git, filesystem, docker
```

## 🎯 **ENHANCED AGENTS WITH STACK AWARENESS**

### **1. database-migration-agent** 🗄️
```yaml
stack_aware: true
adaptive_tools:
  supabase: [supabase-db, supabase-admin, postgres]
  neon: [postgres, typescript, filesystem]
  convex: [typescript, filesystem, memory]
  prisma: [postgres, typescript, filesystem]
  drizzle: [postgres, typescript, filesystem]
  planetscale: [postgres, typescript, filesystem]
```

**Auto-Detection Logic:**
- Supabase: `SUPABASE_URL` or `@supabase/supabase-js` dependency
- Neon: `neon.tech` in connection string
- Convex: `convex/schema.ts` file exists
- Prisma: `prisma/schema.prisma` file exists
- Drizzle: `drizzle.config.ts` file exists

### **2. frontend-ui-agent** 🎨  
```yaml
stack_aware: true
adaptive_tools:
  react: [typescript, storybook, eslint, figma]
  vue: [typescript, storybook-alt, eslint-server, figma]
  svelte: [typescript, playwright, eslint, figma]
  tailwind: [figma, typescript, eslint]
  mui: [typescript, storybook, figma]
  chakra: [typescript, storybook, figma]
```

### **3. deployment-devops-agent** 🚀
```yaml
stack_aware: true
adaptive_tools:
  netlify: [netlify-cli, github, git, filesystem]
  vercel: [github, git, filesystem, docker]
  railway: [docker, github, git, filesystem]
  aws: [aws, docker, github, terraform]
  kubernetes: [kubernetes, docker, terraform, aws]
```

### **4. auth-security-agent** 🔐
```yaml
stack_aware: true
adaptive_tools:
  supabase: [supabase-admin, sentry, playwright, postgres]
  auth0: [fetch, sentry, playwright, memory]
  firebase: [typescript, sentry, playwright, filesystem]
  clerk: [typescript, playwright, sentry, filesystem]
```

### **5. testing-qa-agent** 🧪
```yaml
stack_aware: true  
adaptive_tools:
  react: [playwright, testsprite, eslint, sentry]
  vue: [playwright, puppeteer, eslint-server, sentry]
  vitest: [playwright, eslint, typescript, sentry]
  jest: [playwright, testsprite, eslint, sentry]
  cypress: [puppeteer, playwright, eslint, sentry]
```

## 🚀 **INTELLIGENT ORCHESTRATION EXAMPLES**

### **React + Vite + Supabase + Netlify Stack**
```typescript
// Claude Code automatically detects and orchestrates:

1. database-migration-agent
   → Detected: Supabase (SUPABASE_URL found)
   → Tools: supabase-db → supabase-admin → postgres
   → Action: "supabase db pull" to get schema

2. frontend-ui-agent  
   → Detected: React + Vite (react + vite in package.json)
   → Tools: typescript → storybook → eslint → figma
   → Action: React component patterns with TypeScript

3. deployment-devops-agent
   → Detected: Netlify (netlify.toml found)
   → Tools: netlify-cli → github → git → filesystem
   → Action: "netlify deploy" with proper build config
```

### **Vue + Nuxt + Neon + Vercel Stack**
```typescript
1. database-migration-agent
   → Detected: Neon (neon.tech in DATABASE_URL)
   → Tools: postgres → typescript → filesystem
   → Action: Direct postgres connection + custom migrations

2. frontend-ui-agent
   → Detected: Vue + Nuxt (@nuxt/core in deps)
   → Tools: typescript → storybook-alt → eslint-server → figma
   → Action: Vue component development with Nuxt patterns

3. deployment-devops-agent  
   → Detected: Vercel (vercel.json found)
   → Tools: github → git → filesystem → docker
   → Action: Vercel deployment with edge functions
```

### **Svelte + SvelteKit + Convex + Railway Stack**
```typescript
1. database-migration-agent
   → Detected: Convex (convex/schema.ts found)
   → Tools: typescript → filesystem → memory
   → Action: TypeScript schema changes, no SQL migrations

2. frontend-ui-agent
   → Detected: Svelte + SvelteKit (svelte in deps)
   → Tools: typescript → playwright → eslint → figma  
   → Action: Svelte component development with SvelteKit patterns

3. deployment-devops-agent
   → Detected: Railway (railway.toml found)  
   → Tools: docker → github → git → filesystem
   → Action: Docker containerization + Railway deployment
```

## 🔧 **CLAUDE CODE USAGE PATTERNS**

### **Automatic Stack-Aware Invocation**
```python
# Claude Code automatically detects stack and invokes appropriate agent
def handle_database_issue():
    stack = detect_stack()  # Auto-detects Supabase/Neon/Convex etc.
    
    if stack.database == "supabase":
        Task(
            subagent_type="database-migration-agent",
            prompt="Fix schema using Supabase tools",
            # Agent auto-selects: supabase-db, supabase-admin, postgres
        )
    elif stack.database == "neon": 
        Task(
            subagent_type="database-migration-agent", 
            prompt="Fix schema using Neon postgres connection",
            # Agent auto-selects: postgres, typescript, filesystem
        )

def handle_frontend_issue():
    stack = detect_stack()
    
    if stack.frontend == "react":
        Task(
            subagent_type="frontend-ui-agent",
            prompt="Fix React component with TypeScript",
            # Agent auto-selects: typescript, storybook, eslint, figma
        )
    elif stack.frontend == "vue":
        Task(
            subagent_type="frontend-ui-agent",
            prompt="Fix Vue component with composition API", 
            # Agent auto-selects: typescript, storybook-alt, eslint-server
        )
```

### **Multi-Stack Project Support**
```python
# Agent handles complex multi-stack projects
def handle_fullstack_issue():
    # Each agent detects its relevant stack components
    
    Task(subagent_type="database-migration-agent")
    # Auto-detects: Supabase + Prisma → Uses both supabase-db AND postgres
    
    Task(subagent_type="frontend-ui-agent") 
    # Auto-detects: React + Tailwind → Uses typescript + figma + eslint
    
    Task(subagent_type="deployment-devops-agent")
    # Auto-detects: Netlify + Docker → Uses netlify-cli + docker + github
```

## 📊 **STACK DETECTION PRIORITY MATRIX**

| Stack Component | Detection Method | Priority Tools |
|-----------------|------------------|----------------|
| **Supabase** | SUPABASE_URL, @supabase deps | supabase-db, supabase-admin, postgres |
| **Neon** | neon.tech in DATABASE_URL | postgres, typescript, filesystem |
| **Convex** | convex/schema.ts exists | typescript, filesystem, memory |
| **React** | "react" in package.json | typescript, storybook, eslint, figma |
| **Vue** | "vue" in dependencies | typescript, storybook-alt, eslint-server |
| **Svelte** | "svelte" in dependencies | typescript, playwright, eslint |
| **Netlify** | netlify.toml exists | netlify-cli, github, git |
| **Vercel** | vercel.json exists | github, git, filesystem |
| **Tailwind** | "tailwindcss" in deps | figma, typescript, eslint |
| **Prisma** | prisma/schema.prisma | postgres, typescript, filesystem |

## ✅ **BENEFITS OF STACK-AWARE AGENTS**

1. **🎯 Intelligent Tool Selection**: Always uses the right tools for your stack
2. **⚡ Faster Development**: No manual tool configuration needed  
3. **🔄 Seamless Adaptation**: Works with any tech stack combination
4. **📈 Better Performance**: Optimized workflows for each platform
5. **🛡️ Reduced Errors**: Stack-appropriate patterns and validations
6. **🚀 Future-Proof**: Easily extensible to new frameworks and tools

The agents are now **truly intelligent** and will automatically adapt to your project's technology stack, making development faster and more efficient across any combination of technologies!

---

**Status: 🟢 ALL 15 AGENTS NOW STACK-AWARE AND PRODUCTION-READY**