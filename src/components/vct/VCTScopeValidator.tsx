/**
 * VCT Scope Validator Component
 * Validates features and changes against MVP scope and VCT framework guidelines
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { errorLogger } from '@/lib/error-logger';

// Scope Validation Types
interface ScopeValidation {
  feature: string;
  status: 'approved' | 'rejected' | 'warning' | 'pending';
  reason: string;
  mvpCompliant: boolean;
  vctCompliant: boolean;
  suggestions: string[];
  blockers: string[];
  estimatedImpact: 'low' | 'medium' | 'high';
}

interface MVPScope {
  allowedFeatures: string[];
  restrictedFeatures: string[];
  maxComplexity: number;
  timeConstraints: {
    maxDevelopmentDays: number;
    maxTestingDays: number;
  };
}

interface VCTGuidelines {
  requiredDocs: string[];
  mandatoryTests: string[];
  uiStandards: string[];
  performanceThresholds: {
    maxBundleSize: number;
    maxLoadTime: number;
    minAccessibilityScore: number;
  };
}

interface VCTScopeValidatorProps {
  currentFeature?: string;
  onValidationComplete?: (validation: ScopeValidation) => void;
  className?: string;
}

export const VCTScopeValidator: React.FC<VCTScopeValidatorProps> = ({
  currentFeature,
  onValidationComplete,
  className
}) => {
  const [validations, setValidations] = useState<ScopeValidation[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [mvpScope] = useState<MVPScope>(getDefaultMVPScope());
  const [vctGuidelines] = useState<VCTGuidelines>(getDefaultVCTGuidelines());
  const [selectedValidation, setSelectedValidation] = useState<ScopeValidation | null>(null);

  // Validate feature against MVP scope
  const validateMVPCompliance = useCallback((feature: string): {
    compliant: boolean;
    violations: string[];
    warnings: string[];
  } => {
    const violations: string[] = [];
    const warnings: string[] = [];

    // Check if feature is explicitly restricted
    if (mvpScope.restrictedFeatures.some(restricted => 
      feature.toLowerCase().includes(restricted.toLowerCase())
    )) {
      violations.push(`Feature contains restricted element: ${feature}`);
    }

    // Check if feature is in allowed list (if feature not in allowed, it's a warning)
    if (!mvpScope.allowedFeatures.some(allowed => 
      feature.toLowerCase().includes(allowed.toLowerCase())
    )) {
      warnings.push(`Feature not explicitly in MVP scope: ${feature}`);
    }

    // Check complexity indicators
    const complexityIndicators = [
      'advanced', 'complex', 'ai-powered', 'machine-learning', 
      'real-time', 'streaming', 'collaboration', 'multi-user'
    ];
    
    if (complexityIndicators.some(indicator => 
      feature.toLowerCase().includes(indicator)
    )) {
      warnings.push(`Feature may exceed MVP complexity: ${feature}`);
    }

    return {
      compliant: violations.length === 0,
      violations,
      warnings
    };
  }, [mvpScope]);

  // Validate feature against VCT guidelines
  const validateVCTCompliance = useCallback((feature: string): {
    compliant: boolean;
    violations: string[];
    requirements: string[];
  } => {
    const violations: string[] = [];
    const requirements: string[] = [];

    // Check if feature requires documentation
    if (feature.toLowerCase().includes('new') || feature.toLowerCase().includes('add')) {
      requirements.push('Update claude.md with feature documentation');
      requirements.push('Update mvpscope.md if scope changes');
    }

    // Check if feature requires testing
    if (feature.toLowerCase().includes('ui') || feature.toLowerCase().includes('component')) {
      requirements.push('Add visual regression tests');
      requirements.push('Verify accessibility compliance');
    }

    // Check if feature affects architecture
    if (feature.toLowerCase().includes('database') || feature.toLowerCase().includes('api')) {
      requirements.push('Update architecture.md');
      requirements.push('Run schema validation');
    }

    // Check VCT agent requirements
    const agentTriggers = {
      'ui': ['UXAgent', 'VisualAgent'],
      'test': ['TestAgent'],
      'database': ['SchemaAgent'],
      'error': ['ErrorAgent'],
      'docs': ['DocAgent']
    };

    Object.entries(agentTriggers).forEach(([keyword, agents]) => {
      if (feature.toLowerCase().includes(keyword)) {
        requirements.push(`Trigger ${agents.join(', ')} for validation`);
      }
    });

    return {
      compliant: true, // VCT is more about requirements than restrictions
      violations,
      requirements
    };
  }, [vctGuidelines]);

  // Main validation function
  const validateFeature = useCallback(async (feature: string): Promise<ScopeValidation> => {
    setIsValidating(true);

    try {
      errorLogger.logInfo('[VCT-Scope] Starting feature validation');

      // Simulate validation delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mvpValidation = validateMVPCompliance(feature);
      const vctValidation = validateVCTCompliance(feature);

      // Determine overall status
      let status: ScopeValidation['status'] = 'approved';
      let reason = 'Feature approved for development';

      if (mvpValidation.violations.length > 0) {
        status = 'rejected';
        reason = `MVP violations: ${mvpValidation.violations.join(', ')}`;
      } else if (mvpValidation.warnings.length > 0 || vctValidation.requirements.length > 3) {
        status = 'warning';
        reason = `Warnings detected - proceed with caution`;
      }

      // Estimate impact
      let estimatedImpact: ScopeValidation['estimatedImpact'] = 'low';
      if (vctValidation.requirements.length > 5) estimatedImpact = 'high';
      else if (vctValidation.requirements.length > 2) estimatedImpact = 'medium';

      const validation: ScopeValidation = {
        feature,
        status,
        reason,
        mvpCompliant: mvpValidation.compliant,
        vctCompliant: vctValidation.compliant,
        suggestions: [
          ...mvpValidation.warnings,
          ...vctValidation.requirements
        ],
        blockers: mvpValidation.violations,
        estimatedImpact
      };

      setValidations(prev => [...prev, validation]);
      onValidationComplete?.(validation);

      errorLogger.logInfo('[VCT-Scope] Feature validation completed');

      return validation;
    } catch (error) {
      errorLogger.logError('[VCT-Scope] Feature validation failed', error);
      throw error;
    } finally {
      setIsValidating(false);
    }
  }, [validateMVPCompliance, validateVCTCompliance, onValidationComplete]);

  // Auto-validate current feature when it changes
  useEffect(() => {
    if (currentFeature && !isValidating) {
      validateFeature(currentFeature);
    }
  }, [currentFeature, validateFeature, isValidating]);

  // Validation Summary Component
  const ValidationSummary = () => {
    const approvedCount = validations.filter(v => v.status === 'approved').length;
    const rejectedCount = validations.filter(v => v.status === 'rejected').length;
    const warningCount = validations.filter(v => v.status === 'warning').length;
    const pendingCount = validations.filter(v => v.status === 'pending').length;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>VCT Scope Validation</CardTitle>
            <CardDescription>
              Validates features against MVP scope and VCT framework guidelines
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
                <div className="text-sm text-muted-foreground">Approved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
                <div className="text-sm text-muted-foreground">Rejected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
                <div className="text-sm text-muted-foreground">Warnings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{pendingCount}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </div>

            {isValidating && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Validating feature...</span>
                  <span>{currentFeature}</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Validations */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Validations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {validations.slice(-5).map((validation, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                    selectedValidation === validation ? "bg-muted" : "hover:bg-muted/50"
                  )}
                  onClick={() => setSelectedValidation(validation)}
                >
                  <div className="flex items-center gap-3">
                    <div className="font-medium text-sm">{validation.feature}</div>
                    <Badge variant={
                      validation.status === 'approved' ? 'default' :
                      validation.status === 'rejected' ? 'destructive' :
                      validation.status === 'warning' ? 'secondary' :
                      'outline'
                    }>
                      {validation.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {validation.estimatedImpact}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Validation Details Component
  const ValidationDetails = () => (
    <div className="space-y-6">
      {selectedValidation ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {selectedValidation.feature}
                <Badge variant={
                  selectedValidation.status === 'approved' ? 'default' :
                  selectedValidation.status === 'rejected' ? 'destructive' :
                  selectedValidation.status === 'warning' ? 'secondary' :
                  'outline'
                }>
                  {selectedValidation.status}
                </Badge>
              </CardTitle>
              <CardDescription>{selectedValidation.reason}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium">MVP Compliant:</span>
                    <Badge 
                      variant={selectedValidation.mvpCompliant ? 'default' : 'destructive'}
                      className="ml-2"
                    >
                      {selectedValidation.mvpCompliant ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm font-medium">VCT Compliant:</span>
                    <Badge 
                      variant={selectedValidation.vctCompliant ? 'default' : 'destructive'}
                      className="ml-2"
                    >
                      {selectedValidation.vctCompliant ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Impact:</span>
                    <Badge 
                      variant={
                        selectedValidation.estimatedImpact === 'high' ? 'destructive' :
                        selectedValidation.estimatedImpact === 'medium' ? 'secondary' :
                        'outline'
                      }
                      className="ml-2"
                    >
                      {selectedValidation.estimatedImpact}
                    </Badge>
                  </div>
                </div>

                {selectedValidation.blockers.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-red-600">Blockers:</span>
                    <div className="mt-1 space-y-1">
                      {selectedValidation.blockers.map((blocker, index) => (
                        <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          {blocker}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedValidation.suggestions.length > 0 && (
                  <div>
                    <span className="text-sm font-medium">Suggestions:</span>
                    <div className="mt-1 space-y-1">
                      {selectedValidation.suggestions.map((suggestion, index) => (
                        <div key={index} className="text-sm bg-blue-50 p-2 rounded">
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Select a validation to view details
          </CardContent>
        </Card>
      )}
    </div>
  );

  // MVP & VCT Configuration Component
  const ScopeConfiguration = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>MVP Scope Configuration</CardTitle>
          <CardDescription>Define what's allowed in MVP development</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="allowed" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="allowed">Allowed</TabsTrigger>
              <TabsTrigger value="restricted">Restricted</TabsTrigger>
              <TabsTrigger value="limits">Limits</TabsTrigger>
            </TabsList>
            
            <TabsContent value="allowed" className="space-y-2">
              {mvpScope.allowedFeatures.map((feature, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">{feature}</span>
                  <Badge variant="default">Allowed</Badge>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="restricted" className="space-y-2">
              {mvpScope.restrictedFeatures.map((feature, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">{feature}</span>
                  <Badge variant="destructive">Restricted</Badge>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="limits" className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Max Complexity:</span>
                  <span className="ml-2">{mvpScope.maxComplexity}/10</span>
                </div>
                <div>
                  <span className="font-medium">Dev Days:</span>
                  <span className="ml-2">{mvpScope.timeConstraints.maxDevelopmentDays}</span>
                </div>
                <div>
                  <span className="font-medium">Test Days:</span>
                  <span className="ml-2">{mvpScope.timeConstraints.maxTestingDays}</span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>VCT Guidelines</CardTitle>
          <CardDescription>Framework compliance requirements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <span className="text-sm font-medium">Required Documentation:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {vctGuidelines.requiredDocs.map((doc, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {doc}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <span className="text-sm font-medium">Mandatory Tests:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {vctGuidelines.mandatoryTests.map((test, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {test}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <span className="text-sm font-medium">Performance Thresholds:</span>
              <div className="mt-1 grid grid-cols-3 gap-2 text-xs">
                <div>Bundle: &lt;{vctGuidelines.performanceThresholds.maxBundleSize}KB</div>
                <div>Load: &lt;{vctGuidelines.performanceThresholds.maxLoadTime}ms</div>
                <div>A11y: &gt;{vctGuidelines.performanceThresholds.minAccessibilityScore}%</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ValidationSummary />
        </div>
        <div className="lg:col-span-1">
          <ValidationDetails />
        </div>
        <div className="lg:col-span-1">
          <ScopeConfiguration />
        </div>
      </div>
    </div>
  );
};

// Default MVP scope configuration
function getDefaultMVPScope(): MVPScope {
  return {
    allowedFeatures: [
      'authentication',
      'basic-crud',
      'simple-ui',
      'core-navigation', 
      'essential-forms',
      'basic-search',
      'simple-export',
      'user-profiles'
    ],
    restrictedFeatures: [
      'advanced-ai',
      'real-time-collaboration',
      'complex-animations',
      'multi-tenant',
      'advanced-analytics',
      'third-party-integrations',
      'advanced-permissions',
      'custom-themes'
    ],
    maxComplexity: 6,
    timeConstraints: {
      maxDevelopmentDays: 30,
      maxTestingDays: 7
    }
  };
}

// Default VCT guidelines
function getDefaultVCTGuidelines(): VCTGuidelines {
  return {
    requiredDocs: [
      'claude.md',
      'brief.md', 
      'mvpscope.md',
      'architecture.md',
      'story.md'
    ],
    mandatoryTests: [
      'unit-tests',
      'integration-tests',
      'e2e-tests',
      'accessibility-tests',
      'visual-regression-tests'
    ],
    uiStandards: [
      'responsive-design',
      'accessibility-compliance',
      'consistent-spacing',
      'color-contrast',
      'semantic-html'
    ],
    performanceThresholds: {
      maxBundleSize: 500,
      maxLoadTime: 3000,
      minAccessibilityScore: 95
    }
  };
}

export default VCTScopeValidator;