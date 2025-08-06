/**
 * VCT User Journey Component
 * Manages user journey tracking and visualization within the VCT framework
 */

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ThreePanelLayout } from '@/components/layout/ThreePanelLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// VCT Journey Step Interface
interface JourneyStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  agent?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
  screenshot?: string;
  errors?: string[];
}

// VCT User Journey Interface
interface UserJourney {
  id: string;
  name: string;
  description: string;
  steps: JourneyStep[];
  currentStep: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  environment: 'local' | 'staging' | 'prod';
  startTime?: Date;
  endTime?: Date;
  metrics?: JourneyMetrics;
}

interface JourneyMetrics {
  totalDuration?: number;
  stepDurations: Record<string, number>;
  errorCount: number;
  screenshotCount: number;
  agentSwitches: number;
}

interface VCTUserJourneyProps {
  journey: UserJourney;
  onStepStart?: (stepId: string) => void;
  onStepComplete?: (stepId: string, result: any) => void;
  onJourneyComplete?: (journey: UserJourney) => void;
  className?: string;
}

export const VCTUserJourney: React.FC<VCTUserJourneyProps> = ({
  journey,
  onStepStart,
  onStepComplete,
  onJourneyComplete,
  className
}) => {
  const [activeJourney, setActiveJourney] = useState<UserJourney>(journey);
  const [selectedStep, setSelectedStep] = useState<JourneyStep | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Calculate journey progress
  const progress = (activeJourney.steps.filter(step => step.status === 'completed').length / activeJourney.steps.length) * 100;

  // Handle step execution
  const executeStep = useCallback(async (stepId: string) => {
    const step = activeJourney.steps.find(s => s.id === stepId);
    if (!step || isRunning) return;

    setIsRunning(true);
    onStepStart?.(stepId);

    // Update step status to in_progress
    setActiveJourney(prev => ({
      ...prev,
      steps: prev.steps.map(s => 
        s.id === stepId 
          ? { ...s, status: 'in_progress', timestamp: new Date() }
          : s
      )
    }));

    try {
      // Simulate step execution with VCT agent orchestration
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mark step as completed
      setActiveJourney(prev => ({
        ...prev,
        steps: prev.steps.map(s => 
          s.id === stepId 
            ? { ...s, status: 'completed', timestamp: new Date() }
            : s
        )
      }));

      onStepComplete?.(stepId, { success: true });
    } catch (error) {
      // Mark step as failed
      setActiveJourney(prev => ({
        ...prev,
        steps: prev.steps.map(s => 
          s.id === stepId 
            ? { 
                ...s, 
                status: 'failed', 
                timestamp: new Date(),
                errors: [...(s.errors || []), String(error)]
              }
            : s
        )
      }));
    } finally {
      setIsRunning(false);
    }
  }, [activeJourney.steps, isRunning, onStepStart, onStepComplete]);

  // Run entire journey
  const runJourney = useCallback(async () => {
    if (isRunning) return;

    setActiveJourney(prev => ({
      ...prev,
      status: 'running',
      startTime: new Date()
    }));

    for (const step of activeJourney.steps) {
      if (step.status === 'completed') continue;
      await executeStep(step.id);
    }

    const completedSteps = activeJourney.steps.filter(s => s.status === 'completed').length;
    const journeyStatus = completedSteps === activeJourney.steps.length ? 'completed' : 'failed';

    setActiveJourney(prev => ({
      ...prev,
      status: journeyStatus,
      endTime: new Date()
    }));

    if (journeyStatus === 'completed') {
      onJourneyComplete?.(activeJourney);
    }
  }, [activeJourney, executeStep, isRunning, onJourneyComplete]);

  // Journey Overview Panel
  const JourneyOverview = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {activeJourney.name}
            <Badge variant={
              activeJourney.status === 'completed' ? 'default' :
              activeJourney.status === 'running' ? 'secondary' :
              activeJourney.status === 'failed' ? 'destructive' :
              'outline'
            }>
              {activeJourney.status}
            </Badge>
          </CardTitle>
          <CardDescription>{activeJourney.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Environment:</span>
                <Badge variant="outline" className="ml-2">{activeJourney.environment}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Steps:</span>
                <span className="ml-2">{activeJourney.steps.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Current Step:</span>
                <span className="ml-2">{activeJourney.currentStep + 1}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Errors:</span>
                <span className="ml-2 text-red-500">
                  {activeJourney.steps.reduce((acc, step) => acc + (step.errors?.length || 0), 0)}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={runJourney}
                disabled={isRunning || activeJourney.status === 'running'}
                size="sm"
              >
                {isRunning ? 'Running...' : 'Run Journey'}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setActiveJourney(prev => ({ ...prev, status: 'pending' }))}
              >
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Journey Steps List */}
      <Card>
        <CardHeader>
          <CardTitle>Journey Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {activeJourney.steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                  selectedStep?.id === step.id ? "bg-muted" : "hover:bg-muted/50"
                )}
                onClick={() => setSelectedStep(step)}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                    step.status === 'completed' ? 'bg-green-100 text-green-700' :
                    step.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    step.status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  )}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{step.title}</div>
                    {step.agent && (
                      <Badge variant="outline" className="text-xs">{step.agent}</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {step.status === 'in_progress' && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  )}
                  <Badge variant={
                    step.status === 'completed' ? 'default' :
                    step.status === 'in_progress' ? 'secondary' :
                    step.status === 'failed' ? 'destructive' :
                    'outline'
                  }>
                    {step.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Step Details Panel
  const StepDetails = () => (
    <div className="space-y-6">
      {selectedStep ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {selectedStep.title}
                <Badge variant={
                  selectedStep.status === 'completed' ? 'default' :
                  selectedStep.status === 'in_progress' ? 'secondary' :
                  selectedStep.status === 'failed' ? 'destructive' :
                  'outline'
                }>
                  {selectedStep.status}
                </Badge>
              </CardTitle>
              <CardDescription>{selectedStep.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedStep.agent && (
                  <div>
                    <span className="text-sm font-medium">Agent:</span>
                    <Badge variant="outline" className="ml-2">{selectedStep.agent}</Badge>
                  </div>
                )}
                
                {selectedStep.timestamp && (
                  <div>
                    <span className="text-sm font-medium">Timestamp:</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {selectedStep.timestamp.toLocaleString()}
                    </span>
                  </div>
                )}

                {selectedStep.errors && selectedStep.errors.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-red-600">Errors:</span>
                    <div className="mt-1 space-y-1">
                      {selectedStep.errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedStep.metadata && (
                  <div>
                    <span className="text-sm font-medium">Metadata:</span>
                    <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-auto">
                      {JSON.stringify(selectedStep.metadata, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => executeStep(selectedStep.id)}
                    disabled={isRunning || selectedStep.status === 'in_progress'}
                  >
                    {selectedStep.status === 'in_progress' ? 'Running...' : 'Execute Step'}
                  </Button>
                  {selectedStep.screenshot && (
                    <Button variant="outline" size="sm">
                      View Screenshot
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Select a step to view details
          </CardContent>
        </Card>
      )}
    </div>
  );

  // VCT Agent Panel
  const VCTAgentPanel = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>VCT Agents</CardTitle>
          <CardDescription>Active agents orchestrating this journey</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="space-y-2">
              {['SpecAgent', 'TestAgent', 'VisualAgent'].map(agent => (
                <div key={agent} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm font-medium">{agent}</span>
                  <Badge variant="secondary">Active</Badge>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="completed" className="space-y-2">
              {['SchemaAgent', 'DocAgent'].map(agent => (
                <div key={agent} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm font-medium">{agent}</span>
                  <Badge variant="default">Completed</Badge>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="logs" className="space-y-2">
              <div className="text-xs font-mono bg-black text-green-400 p-4 rounded max-h-64 overflow-y-auto">
                <div>[VCT] Journey started: {activeJourney.name}</div>
                <div>[SpecAgent] Analyzing user requirements...</div>
                <div>[TestAgent] Preparing test scenarios...</div>
                <div>[VisualAgent] Setting up screenshot capture...</div>
                <div>[VCT] Ready for execution</div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Journey Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Journey Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Total Steps:</span>
              <span>{activeJourney.steps.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Completed:</span>
              <span className="text-green-600">
                {activeJourney.steps.filter(s => s.status === 'completed').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Failed:</span>
              <span className="text-red-600">
                {activeJourney.steps.filter(s => s.status === 'failed').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Success Rate:</span>
              <span>
                {Math.round((activeJourney.steps.filter(s => s.status === 'completed').length / activeJourney.steps.length) * 100)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className={cn("h-full", className)}>
      <ThreePanelLayout
        mainContent={<JourneyOverview />}
        protocolPanel={<StepDetails />}
        aiChatPanel={<VCTAgentPanel />}
      />
    </div>
  );
};

// VCT Journey Factory
export const createVCTJourney = (config: {
  name: string;
  description: string;
  steps: Omit<JourneyStep, 'id'>[];
  environment?: 'local' | 'staging' | 'prod';
}): UserJourney => {
  return {
    id: `journey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: config.name,
    description: config.description,
    steps: config.steps.map((step, index) => ({
      ...step,
      id: `step_${index + 1}_${Date.now()}`
    })),
    currentStep: 0,
    status: 'pending',
    environment: config.environment || 'local',
    metrics: {
      stepDurations: {},
      errorCount: 0,
      screenshotCount: 0,
      agentSwitches: 0
    }
  };
};

export default VCTUserJourney;