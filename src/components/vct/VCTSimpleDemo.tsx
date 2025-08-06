/**
 * VCT Simple Demo Component
 * Simplified version for demonstration without complex error logging
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ThreePanelLayout } from '@/components/layout/ThreePanelLayout';

// Simplified VCT Journey Step
interface SimpleJourneyStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

// Simplified VCT User Journey
interface SimpleUserJourney {
  id: string;
  name: string;
  description: string;
  steps: SimpleJourneyStep[];
  status: 'pending' | 'running' | 'completed';
}

export const VCTSimpleDemo: React.FC = () => {
  const [journey, setJourney] = useState<SimpleUserJourney>({
    id: 'demo-journey-1',
    name: 'Searchmatic User Onboarding',
    description: 'Complete user journey from signup to first project creation',
    status: 'pending',
    steps: [
      {
        id: 'step-1',
        title: 'Navigate to Landing',
        description: 'User visits the landing page',
        status: 'pending'
      },
      {
        id: 'step-2', 
        title: 'Sign Up',
        description: 'User creates a new account',
        status: 'pending'
      },
      {
        id: 'step-3',
        title: 'Dashboard Access',
        description: 'User reaches the dashboard',
        status: 'pending'
      },
      {
        id: 'step-4',
        title: 'Create Project',
        description: 'User creates their first project',
        status: 'pending'
      }
    ]
  });

  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  // Calculate progress
  const completedSteps = journey.steps.filter(step => step.status === 'completed').length;
  const progress = (completedSteps / journey.steps.length) * 100;

  // Execute single step
  const executeStep = async (stepId: string) => {
    setJourney(prev => ({
      ...prev,
      steps: prev.steps.map(step => 
        step.id === stepId ? { ...step, status: 'running' } : step
      )
    }));

    // Simulate execution
    await new Promise(resolve => setTimeout(resolve, 2000));

    setJourney(prev => ({
      ...prev,
      steps: prev.steps.map(step => 
        step.id === stepId ? { ...step, status: 'completed' } : step
      )
    }));
  };

  // Execute entire journey
  const executeJourney = async () => {
    setJourney(prev => ({ ...prev, status: 'running' }));

    for (const step of journey.steps) {
      await executeStep(step.id);
    }

    setJourney(prev => ({ ...prev, status: 'completed' }));
  };

  // Reset journey
  const resetJourney = () => {
    setJourney(prev => ({
      ...prev,
      status: 'pending',
      steps: prev.steps.map(step => ({ ...step, status: 'pending' }))
    }));
    setSelectedStepId(null);
  };

  // Journey Overview Panel
  const JourneyOverview = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {journey.name}
            <Badge variant={
              journey.status === 'completed' ? 'default' :
              journey.status === 'running' ? 'secondary' :
              'outline'
            }>
              {journey.status}
            </Badge>
          </CardTitle>
          <CardDescription>{journey.description}</CardDescription>
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
                <span className="text-muted-foreground">Total Steps:</span>
                <span className="ml-2">{journey.steps.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Completed:</span>
                <span className="ml-2 text-green-600">{completedSteps}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={executeJourney}
                disabled={journey.status === 'running'}
                size="sm"
              >
                {journey.status === 'running' ? 'Running...' : 'Run Journey'}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={resetJourney}
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
            {journey.steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedStepId === step.id ? "bg-muted" : "hover:bg-muted/50"
                }`}
                onClick={() => setSelectedStepId(step.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    step.status === 'completed' ? 'bg-green-100 text-green-700' :
                    step.status === 'running' ? 'bg-blue-100 text-blue-700' :
                    step.status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="font-medium text-sm">{step.title}</div>
                </div>
                <div className="flex items-center gap-2">
                  {step.status === 'running' && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  )}
                  <Badge variant={
                    step.status === 'completed' ? 'default' :
                    step.status === 'running' ? 'secondary' :
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
  const StepDetails = () => {
    const selectedStep = selectedStepId ? 
      journey.steps.find(step => step.id === selectedStepId) : null;

    return (
      <div className="space-y-6">
        {selectedStep ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {selectedStep.title}
                <Badge variant={
                  selectedStep.status === 'completed' ? 'default' :
                  selectedStep.status === 'running' ? 'secondary' :
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
                <Button
                  size="sm"
                  onClick={() => executeStep(selectedStep.id)}
                  disabled={selectedStep.status === 'running' || selectedStep.status === 'completed'}
                >
                  {selectedStep.status === 'running' ? 'Running...' : 
                   selectedStep.status === 'completed' ? 'Completed' : 'Execute Step'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Select a step to view details
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // VCT Agents Panel
  const VCTAgentsPanel = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>VCT Framework Status</CardTitle>
          <CardDescription>Visual Claude Toolkit integration status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Framework Status:</span>
              <Badge variant="default">Active</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Three-Panel Layout:</span>
              <Badge variant="default">✓ Enabled</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">User Journey Tracking:</span>
              <Badge variant="default">✓ Active</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">UI Consistency:</span>
              <Badge variant="default">✓ Monitored</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Scope Validation:</span>
              <Badge variant="default">✓ Enforced</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>VCT Principles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>• Three-panel UI architecture</div>
            <div>• Progressive enhancement</div>
            <div>• Agent orchestration</div>
            <div>• MVP scope enforcement</div>
            <div>• Visual regression testing</div>
            <div>• Automated quality checks</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="h-screen">
      <ThreePanelLayout
        mainContent={<JourneyOverview />}
        protocolPanel={<StepDetails />}
        aiChatPanel={<VCTAgentsPanel />}
      />
    </div>
  );
};

export default VCTSimpleDemo;