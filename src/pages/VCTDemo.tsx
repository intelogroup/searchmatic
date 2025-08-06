/**
 * VCT Demo Page
 * Demonstrates the Visual Claude Toolkit framework integration
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VCTUserJourney, createVCTJourney } from '@/components/vct/VCTUserJourney';
import { VCTScopeValidator } from '@/components/vct/VCTScopeValidator';
import { useVCTAgent } from '@/hooks/useVCTAgent';
import { useVCTUIConsistency } from '@/hooks/useVCTUIConsistency';
import { errorLogger } from '@/lib/error-logger';

const VCTDemo: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState<'journey' | 'validation' | 'agents' | 'ui'>('journey');
  const [currentFeature, setCurrentFeature] = useState<string>('');

  // VCT Agents
  const specAgent = useVCTAgent('SpecAgent');
  const testAgent = useVCTAgent('TestAgent');
  const visualAgent = useVCTAgent('VisualAgent');
  const orchestrator = useVCTAgent('Orchestrator');

  // VCT UI Consistency
  const {
    getStylebook,
    suggestComponent,
    getUIInspiration,
    analyzeUX,
    auditUI,
    checkMVPConstraints,
    isValidating
  } = useVCTUIConsistency();

  // Sample user journey
  const sampleJourney = createVCTJourney({
    name: 'Searchmatic User Onboarding',
    description: 'Complete user journey from signup to first project creation',
    environment: 'local',
    steps: [
      {
        title: 'Navigate to Landing',
        description: 'User visits the landing page',
        status: 'pending',
        agent: 'VisualAgent'
      },
      {
        title: 'Click Sign Up',
        description: 'User clicks on the sign up button',
        status: 'pending',
        agent: 'TestAgent'
      },
      {
        title: 'Fill Registration Form',
        description: 'User completes the registration form',
        status: 'pending',
        agent: 'TestAgent'
      },
      {
        title: 'Email Verification',
        description: 'User verifies their email address',
        status: 'pending',
        agent: 'TestAgent'
      },
      {
        title: 'Login and Dashboard',
        description: 'User logs in and reaches dashboard',
        status: 'pending',
        agent: 'VisualAgent'
      },
      {
        title: 'Create First Project',
        description: 'User creates their first research project',
        status: 'pending',
        agent: 'SpecAgent'
      },
      {
        title: 'AI Chat Interaction',
        description: 'User interacts with AI assistant',
        status: 'pending',
        agent: 'SpecAgent'
      }
    ]
  });

  // Handle agent task execution
  const executeAgentTask = useCallback(async (agentType: string, taskType: string) => {
    try {
      let taskId: string;
      
      switch (agentType) {
        case 'SpecAgent':
          taskId = specAgent.queueTask(taskType, {
            requirements: 'Analyze user journey requirements',
            title: 'User Onboarding'
          });
          break;
          
        case 'TestAgent':
          taskId = testAgent.queueTask(taskType, {
            testSuite: 'user-journey',
            environment: 'local'
          });
          break;
          
        case 'VisualAgent':
          taskId = visualAgent.queueTask(taskType, {
            page: 'dashboard',
            viewport: '1280x720'
          });
          break;
          
        case 'Orchestrator':
          taskId = orchestrator.queueTask(taskType, {
            workflow: 'complete-user-journey',
            agents: ['SpecAgent', 'TestAgent', 'VisualAgent']
          });
          break;
          
        default:
          throw new Error(`Unknown agent type: ${agentType}`);
      }

      errorLogger.logInfo('[VCT-Demo] Agent task queued', {
        agent: agentType,
        task: taskType,
        taskId
      });

    } catch (error) {
      errorLogger.logError('[VCT-Demo] Failed to execute agent task', error);
    }
  }, [specAgent, testAgent, visualAgent, orchestrator]);

  // Handle UI component suggestion
  const handleComponentSuggestion = useCallback(async (componentType: string) => {
    try {
      const suggestion = suggestComponent({
        type: componentType as any,
        style: 'modern',
        size: 'md'
      });

      errorLogger.logInfo('[VCT-Demo] Component suggestion generated', {
        type: componentType,
        suggestion: suggestion.component
      });

      // Trigger UX analysis
      await analyzeUX(suggestion.component);
      
    } catch (error) {
      errorLogger.logError('[VCT-Demo] Component suggestion failed', error);
    }
  }, [suggestComponent, analyzeUX]);

  // Handle scope validation
  const handleScopeValidation = useCallback((feature: string) => {
    setCurrentFeature(feature);
    errorLogger.logInfo('[VCT-Demo] Scope validation triggered', { feature });
  }, []);

  // Journey Demo Tab
  const JourneyDemo = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>VCT User Journey Framework</CardTitle>
          <CardDescription>
            Comprehensive user journey testing with visual verification and agent orchestration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-lg font-semibold">7</div>
              <div className="text-sm text-muted-foreground">Total Steps</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">3</div>
              <div className="text-sm text-muted-foreground">Active Agents</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">0</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">Local</div>
              <div className="text-sm text-muted-foreground">Environment</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <VCTUserJourney
        journey={sampleJourney}
        onStepStart={(stepId) => 
          errorLogger.logInfo('[VCT-Demo] Journey step started', { stepId })
        }
        onStepComplete={(stepId, result) => 
          errorLogger.logInfo('[VCT-Demo] Journey step completed', { stepId, result })
        }
        onJourneyComplete={(journey) => 
          errorLogger.logInfo('[VCT-Demo] Journey completed', { journey: journey.name })
        }
      />
    </div>
  );

  // Agents Demo Tab
  const AgentsDemo = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>VCT Agent Orchestration</CardTitle>
          <CardDescription>
            Demonstrate specialized agents working together to complete tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Agent Status Cards */}
            {[
              { agent: specAgent, name: 'SpecAgent', tasks: ['analyze_requirements', 'generate_spec'] },
              { agent: testAgent, name: 'TestAgent', tasks: ['run_tests', 'generate_test'] },
              { agent: visualAgent, name: 'VisualAgent', tasks: ['capture_screenshot', 'compare_visuals'] },
              { agent: orchestrator, name: 'Orchestrator', tasks: ['coordinate_agents'] }
            ].map(({ agent, name, tasks }) => (
              <Card key={name}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg">
                    {name}
                    <Badge variant={
                      agent.status.status === 'busy' ? 'secondary' :
                      agent.status.status === 'completed' ? 'default' :
                      agent.status.status === 'error' ? 'destructive' :
                      'outline'
                    }>
                      {agent.status.status}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {agent.status.currentTask || 'Idle'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="font-medium">Queue:</span>
                      <span className="ml-2">{agent.taskQueue.length} tasks</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {tasks.map(task => (
                        <Button
                          key={task}
                          size="sm"
                          variant="outline"
                          onClick={() => executeAgentTask(name, task)}
                          disabled={agent.isProcessing}
                        >
                          {task.replace('_', ' ')}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // UI Consistency Demo Tab
  const UIConsistencyDemo = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>VCT UI Consistency Framework</CardTitle>
          <CardDescription>
            UI/UX validation, component suggestions, and design consistency checking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Component Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Component Picker</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    Generate component suggestions based on VCT guidelines
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['button', 'card', 'modal', 'form', 'navigation'].map(component => (
                      <Button
                        key={component}
                        size="sm"
                        variant="outline"
                        onClick={() => handleComponentSuggestion(component)}
                        disabled={isValidating}
                      >
                        {component}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* UI Audit */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">UI Audit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    Run comprehensive UI/UX audits
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['page', 'component', 'global'].map(scope => (
                      <Button
                        key={scope}
                        size="sm"
                        variant="outline"
                        onClick={() => auditUI(scope as any)}
                        disabled={isValidating}
                      >
                        {scope} audit
                      </Button>
                    ))}
                  </div>
                  {isValidating && (
                    <div className="text-sm text-blue-600">
                      Running UI audit...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stylebook */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">UI Stylebook</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {Object.entries(getStylebook()).map(([category, values]) => (
                    <div key={category}>
                      <span className="font-medium capitalize">{category}:</span>
                      <div className="ml-2 text-muted-foreground">
                        {Object.keys(values).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* MVP Constraints */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">MVP Constraints</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    Check features against MVP constraints
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'animation-library',
                      'theme-switch', 
                      'complex-modal',
                      'simple-button'
                    ].map(feature => (
                      <Button
                        key={feature}
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const result = checkMVPConstraints('test-component', [feature]);
                          errorLogger.logInfo('[VCT-Demo] MVP constraint check', result);
                        }}
                      >
                        {feature}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Scope Validation Demo Tab
  const ScopeValidationDemo = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>VCT Scope Validation</CardTitle>
          <CardDescription>
            Validate features against MVP scope and VCT framework compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="text-sm font-medium mb-2">Test Features:</div>
            <div className="flex flex-wrap gap-2">
              {[
                'Add user authentication',
                'Advanced AI chat system',
                'Real-time collaboration',
                'Simple project creation',
                'Basic export functionality',
                'Complex animation library'
              ].map(feature => (
                <Button
                  key={feature}
                  size="sm"
                  variant="outline"
                  onClick={() => handleScopeValidation(feature)}
                >
                  {feature}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <VCTScopeValidator
        currentFeature={currentFeature}
        onValidationComplete={(validation) => 
          errorLogger.logInfo('[VCT-Demo] Scope validation completed', validation)
        }
      />
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">VCT Framework Demo</h1>
        <p className="text-muted-foreground">
          Visual Claude Toolkit - Comprehensive AI-driven development framework
        </p>
      </div>

      <Tabs value={activeDemo} onValueChange={(value) => setActiveDemo(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="journey">User Journeys</TabsTrigger>
          <TabsTrigger value="agents">Agent Orchestra</TabsTrigger>
          <TabsTrigger value="ui">UI Consistency</TabsTrigger>
          <TabsTrigger value="validation">Scope Validation</TabsTrigger>
        </TabsList>

        <TabsContent value="journey" className="space-y-6">
          <JourneyDemo />
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <AgentsDemo />
        </TabsContent>

        <TabsContent value="ui" className="space-y-6">
          <UIConsistencyDemo />
        </TabsContent>

        <TabsContent value="validation" className="space-y-6">
          <ScopeValidationDemo />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VCTDemo;