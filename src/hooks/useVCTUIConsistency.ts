/**
 * VCT UI Consistency Hook
 * Provides UI/UX validation and consistency checking following VCT framework guidelines
 */

import { useState, useCallback } from 'react';
import { errorLogger } from '@/lib/error-logger';

// UI Style Standards (VCT Framework Part 5)
interface UIStylebook {
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
  padding: {
    sm: string;
    md: string;
    lg: string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
  };
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

// Component Validation Result
interface ComponentValidation {
  component: string;
  passed: boolean;
  issues: UIIssue[];
  score: number;
  suggestions: string[];
}

// UI Issue Types
interface UIIssue {
  type: 'accessibility' | 'spacing' | 'contrast' | 'responsive' | 'semantic' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  element?: string;
  fix?: string;
}

// Component Source Configuration
interface ComponentSource {
  name: string;
  url: string;
  type: 'tailwind' | 'shadcn' | 'magicui' | 'custom';
  active: boolean;
}

// VCT UI Consistency Hook
export const useVCTUIConsistency = () => {
  const [stylebook, setStylebook] = useState<UIStylebook>(getDefaultStylebook());
  const [componentSources, setComponentSources] = useState<ComponentSource[]>(getDefaultSources());
  const [validationResults, setValidationResults] = useState<ComponentValidation[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  // Get UI Stylebook (VCT useUIStylebook equivalent)
  const getStylebook = useCallback((): UIStylebook => {
    return stylebook;
  }, [stylebook]);

  // Component Picker (VCT useComponentPicker equivalent)
  const suggestComponent = useCallback((requirements: {
    type: 'button' | 'card' | 'modal' | 'form' | 'navigation' | 'layout';
    style?: 'modern' | 'minimal' | 'corporate' | 'fun';
    size?: 'sm' | 'md' | 'lg';
    variant?: string;
  }) => {
    const { type, style = 'modern', size = 'md', variant } = requirements;

    // Component suggestions based on VCT framework
    const suggestions = {
      button: {
        component: 'Button',
        sources: ['shadcn/ui', 'tailwind'],
        variants: ['default', 'secondary', 'outline', 'ghost'],
        props: {
          size: size,
          variant: variant || 'default',
          className: getButtonClasses(style, size)
        }
      },
      card: {
        component: 'Card',
        sources: ['shadcn/ui', 'tailwind'],
        variants: ['default', 'elevated', 'outlined'],
        props: {
          className: getCardClasses(style)
        }
      },
      modal: {
        component: 'Dialog',
        sources: ['shadcn/ui', 'radix-ui'],
        variants: ['default', 'drawer', 'fullscreen'],
        props: {
          className: getModalClasses(style, size)
        }
      },
      form: {
        component: 'Form',
        sources: ['shadcn/ui', 'react-hook-form'],
        variants: ['default', 'inline', 'stepped'],
        props: {
          className: getFormClasses(style)
        }
      },
      navigation: {
        component: 'NavigationMenu',
        sources: ['shadcn/ui', 'radix-ui'],
        variants: ['horizontal', 'vertical', 'breadcrumb'],
        props: {
          className: getNavigationClasses(style)
        }
      },
      layout: {
        component: 'ThreePanelLayout',
        sources: ['custom', 'vct-framework'],
        variants: ['default', 'collapsible', 'responsive'],
        props: {
          className: getLayoutClasses(style)
        }
      }
    };

    const suggestion = suggestions[type];
    
    errorLogger.logInfo('[VCT-UI] Component suggestion generated', {
      type,
      style,
      size,
      suggestion: suggestion.component
    });

    return suggestion;
  }, []);

  // UI Inspiration Agent (VCT useInspirationAgent equivalent)
  const getUIInspiration = useCallback(async (context: {
    domain?: string;
    style?: string;
    components?: string[];
  }) => {
    try {
      // Simulate fetching inspiration from design sources
      const inspirationSources = [
        'dribbble.com',
        '21st.dev', 
        'framer.gallery',
        'tailwindui.com',
        'ui.shadcn.com'
      ];

      // Mock inspiration data
      const inspiration = {
        source: inspirationSources[Math.floor(Math.random() * inspirationSources.length)],
        designs: [
          {
            title: 'Modern Dashboard Layout',
            url: '#',
            tags: ['dashboard', 'modern', 'clean'],
            colors: ['#0f172a', '#64748b', '#e2e8f0'],
            components: ['cards', 'navigation', 'charts']
          },
          {
            title: 'Minimal Login Form',
            url: '#',
            tags: ['authentication', 'minimal', 'form'],
            colors: ['#ffffff', '#374151', '#3b82f6'],
            components: ['form', 'button', 'input']
          }
        ],
        trends: [
          'Glass morphism effects',
          'Micro-interactions',
          'Dark mode support',
          'Responsive grid layouts'
        ]
      };

      errorLogger.logInfo('[VCT-UI] Inspiration fetched', {
        context,
        source: inspiration.source,
        designCount: inspiration.designs.length
      });

      return inspiration;
    } catch (error) {
      errorLogger.logError('[VCT-UI] Failed to fetch inspiration', error);
      return null;
    }
  }, []);

  // UX Agent for layout analysis (VCT UXAgent equivalent)
  const analyzeUX = useCallback(async (element: HTMLElement | string): Promise<ComponentValidation> => {
    setIsValidating(true);

    try {
      const elementSelector = typeof element === 'string' ? element : element.tagName;
      
      // Simulate UX analysis
      await new Promise(resolve => setTimeout(resolve, 1000));

      const issues: UIIssue[] = [];
      let score = 100;

      // Check accessibility
      if (Math.random() > 0.7) {
        issues.push({
          type: 'accessibility',
          severity: 'high',
          message: 'Missing aria-label or alt text',
          element: elementSelector,
          fix: 'Add descriptive aria-label attribute'
        });
        score -= 15;
      }

      // Check spacing
      if (Math.random() > 0.6) {
        issues.push({
          type: 'spacing',
          severity: 'medium',
          message: 'Inconsistent padding or margins',
          element: elementSelector,
          fix: 'Use consistent spacing scale from stylebook'
        });
        score -= 10;
      }

      // Check contrast
      if (Math.random() > 0.8) {
        issues.push({
          type: 'contrast',
          severity: 'high',
          message: 'Insufficient color contrast ratio',
          element: elementSelector,
          fix: 'Increase contrast to meet WCAG 2.1 AA standards'
        });
        score -= 20;
      }

      // Check responsive design
      if (Math.random() > 0.5) {
        issues.push({
          type: 'responsive',
          severity: 'medium',
          message: 'Not optimized for mobile viewports',
          element: elementSelector,
          fix: 'Add responsive breakpoints and mobile-first approach'
        });
        score -= 10;
      }

      const validation: ComponentValidation = {
        component: elementSelector,
        passed: issues.filter(i => i.severity === 'high' || i.severity === 'critical').length === 0,
        issues,
        score: Math.max(0, score),
        suggestions: generateSuggestions(issues)
      };

      setValidationResults(prev => [...prev, validation]);

      errorLogger.logInfo('[VCT-UI] UX analysis completed', {
        component: elementSelector,
        score,
        issueCount: issues.length,
        passed: validation.passed
      });

      return validation;
    } catch (error) {
      errorLogger.logError('[VCT-UI] UX analysis failed', error);
      throw error;
    } finally {
      setIsValidating(false);
    }
  }, []);

  // Audit UI Agent (VCT AuditUIAgent equivalent)
  const auditUI = useCallback(async (scope: 'page' | 'component' | 'global' = 'page') => {
    setIsValidating(true);

    try {
      const auditResults = {
        scope,
        timestamp: new Date(),
        totalComponents: 0,
        passedComponents: 0,
        failedComponents: 0,
        issues: [] as UIIssue[],
        recommendations: [] as string[],
        score: 0
      };

      // Simulate comprehensive UI audit
      const elementsToAudit = scope === 'global' ? 
        ['Button', 'Card', 'Modal', 'Form', 'Navigation'] :
        scope === 'page' ?
        ['Header', 'MainContent', 'Footer'] :
        ['Component'];

      for (const element of elementsToAudit) {
        const validation = await analyzeUX(element);
        auditResults.totalComponents++;
        
        if (validation.passed) {
          auditResults.passedComponents++;
        } else {
          auditResults.failedComponents++;
        }
        
        auditResults.issues.push(...validation.issues);
        auditResults.recommendations.push(...validation.suggestions);
      }

      auditResults.score = auditResults.totalComponents > 0 ? 
        (auditResults.passedComponents / auditResults.totalComponents) * 100 : 0;

      errorLogger.logInfo('[VCT-UI] UI audit completed', {
        scope,
        totalComponents: auditResults.totalComponents,
        score: auditResults.score,
        issueCount: auditResults.issues.length
      });

      return auditResults;
    } catch (error) {
      errorLogger.logError('[VCT-UI] UI audit failed', error);
      throw error;
    } finally {
      setIsValidating(false);
    }
  }, [analyzeUX]);

  // MVP-Safe constraints checker
  const checkMVPConstraints = useCallback((component: string, features: string[]) => {
    const mvpViolations: string[] = [];
    
    // Check against VCT MVP constraints
    const restrictedFeatures = [
      'animation-libraries',
      'dynamic-theme-switch',
      'unnecessary-modals',
      'excessive-drawers',
      'complex-tabs'
    ];

    features.forEach(feature => {
      if (restrictedFeatures.includes(feature)) {
        mvpViolations.push(`Feature '${feature}' violates MVP constraints`);
      }
    });

    const passed = mvpViolations.length === 0;

    errorLogger.logInfo('[VCT-UI] MVP constraints check', {
      component,
      features,
      violations: mvpViolations.length,
      passed
    });

    return {
      passed,
      violations: mvpViolations,
      component,
      features
    };
  }, []);

  return {
    // Core hooks
    getStylebook,
    suggestComponent,
    getUIInspiration,
    analyzeUX,
    auditUI,
    checkMVPConstraints,
    
    // State
    stylebook,
    componentSources,
    validationResults,
    isValidating,
    
    // Setters
    setStylebook,
    setComponentSources
  };
};

// Default stylebook configuration
function getDefaultStylebook(): UIStylebook {
  return {
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
    },
    padding: {
      sm: '0.5rem',
      md: '1rem', 
      lg: '1.5rem'
    },
    radius: {
      sm: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem'
    },
    fonts: {
      heading: 'Inter, system-ui, sans-serif',
      body: 'Inter, system-ui, sans-serif',
      mono: 'JetBrains Mono, monospace'
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem'
    }
  };
}

// Default component sources
function getDefaultSources(): ComponentSource[] {
  return [
    { name: 'Shadcn/UI', url: 'ui.shadcn.com', type: 'shadcn', active: true },
    { name: 'Tailwind UI', url: 'tailwindui.com', type: 'tailwind', active: true },
    { name: 'Magic UI', url: 'magicui.design', type: 'magicui', active: true },
    { name: '21st.dev', url: '21st.dev', type: 'custom', active: false }
  ];
}

// Generate CSS classes based on style and component type
function getButtonClasses(style: string, size: string): string {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50';
  
  const sizeClasses = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 py-2',
    lg: 'h-11 px-6 text-lg'
  };

  const styleClasses = {
    modern: 'bg-primary text-primary-foreground hover:bg-primary/90',
    minimal: 'bg-transparent border border-input hover:bg-accent hover:text-accent-foreground',
    corporate: 'bg-blue-600 text-white hover:bg-blue-700',
    fun: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
  };

  return `${baseClasses} ${sizeClasses[size as keyof typeof sizeClasses]} ${styleClasses[style as keyof typeof styleClasses]}`;
}

function getCardClasses(style: string): string {
  const baseClasses = 'rounded-lg border bg-card text-card-foreground shadow-sm';
  
  const styleClasses = {
    modern: 'border-border',
    minimal: 'border-gray-200 shadow-none',
    corporate: 'border-gray-300 shadow-md',
    fun: 'border-purple-200 shadow-lg shadow-purple-100/50'
  };

  return `${baseClasses} ${styleClasses[style as keyof typeof styleClasses]}`;
}

function getModalClasses(style: string, size: string): string {
  const baseClasses = 'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm';
  
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg', 
    lg: 'max-w-2xl'
  };

  return `${baseClasses} ${sizeClasses[size as keyof typeof sizeClasses]}`;
}

function getFormClasses(style: string): string {
  const baseClasses = 'space-y-4';
  return baseClasses;
}

function getNavigationClasses(style: string): string {
  const baseClasses = 'flex items-center space-x-4';
  return baseClasses;
}

function getLayoutClasses(style: string): string {
  const baseClasses = 'flex h-screen bg-background';
  return baseClasses;
}

// Generate suggestions based on UI issues
function generateSuggestions(issues: UIIssue[]): string[] {
  const suggestions: string[] = [];
  
  issues.forEach(issue => {
    switch (issue.type) {
      case 'accessibility':
        suggestions.push('Improve accessibility by adding ARIA labels and alt text');
        break;
      case 'spacing':
        suggestions.push('Use consistent spacing scale from the VCT stylebook');
        break;
      case 'contrast':
        suggestions.push('Increase color contrast for better readability');
        break;
      case 'responsive':
        suggestions.push('Add responsive breakpoints for mobile-first design');
        break;
      default:
        if (issue.fix) {
          suggestions.push(issue.fix);
        }
    }
  });

  return [...new Set(suggestions)]; // Remove duplicates
}

export default useVCTUIConsistency;