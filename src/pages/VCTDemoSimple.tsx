/**
 * VCT Demo Page - Simplified Version
 * Demonstrates the Visual Claude Toolkit framework integration
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VCTSimpleDemo } from '@/components/vct/VCTSimpleDemo';

const VCTDemoSimple: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState<'journey' | 'framework' | 'principles'>('journey');

  // Framework Overview Tab
  const FrameworkOverview = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>VCT Framework Architecture</CardTitle>
          <CardDescription>
            Visual Claude Toolkit - Comprehensive AI-driven development framework
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Core Components */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Core Components</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Three-Panel Layout</span>
                    <Badge variant="default">✓</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>User Journey Tracking</span>
                    <Badge variant="default">✓</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Agent Orchestration</span>
                    <Badge variant="default">✓</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Scope Validation</span>
                    <Badge variant="default">✓</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* VCT Agents */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">VCT Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>SpecAgent</span>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>TestAgent</span>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>VisualAgent</span>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>UXAgent</span>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quality Assurance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quality Assurance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Visual Regression</span>
                    <Badge variant="default">✓</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Accessibility Testing</span>
                    <Badge variant="default">✓</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Performance Monitoring</span>
                    <Badge variant="default">✓</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Error Tracking</span>
                    <Badge variant="default">✓</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Key Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm">🎯 Visual Awareness</h4>
                <p className="text-sm text-muted-foreground">Screenshot capture, comparison, and regression detection</p>
              </div>
              <div>
                <h4 className="font-medium text-sm">📊 Schema Intelligence</h4>
                <p className="text-sm text-muted-foreground">Live database schema fetching and validation</p>
              </div>
              <div>
                <h4 className="font-medium text-sm">🤖 Subagent Architecture</h4>
                <p className="text-sm text-muted-foreground">Specialized agents for different responsibilities</p>
              </div>
              <div>
                <h4 className="font-medium text-sm">⚡ Slash Command Interface</h4>
                <p className="text-sm text-muted-foreground">Interactive workflow orchestration</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integration Benefits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm">🚀 Faster Development</h4>
                <p className="text-sm text-muted-foreground">Automated code generation and validation</p>
              </div>
              <div>
                <h4 className="font-medium text-sm">🔍 Better Quality</h4>
                <p className="text-sm text-muted-foreground">Continuous testing and quality checks</p>
              </div>
              <div>
                <h4 className="font-medium text-sm">📈 Consistent UI/UX</h4>
                <p className="text-sm text-muted-foreground">Design system enforcement and consistency</p>
              </div>
              <div>
                <h4 className="font-medium text-sm">🎯 MVP Focus</h4>
                <p className="text-sm text-muted-foreground">Scope validation and feature control</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // VCT Principles Tab
  const VCTPrinciples = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>VCT Framework Principles</CardTitle>
          <CardDescription>
            Core principles that guide the Visual Claude Toolkit framework
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {[
              {
                title: "Three-Panel UI Architecture",
                description: "Every screen follows the main content + protocol panel + AI chat layout",
                details: [
                  "Main Content: Primary work area (flexible width)",
                  "Protocol Panel: Reference and documentation (fixed width)",
                  "AI Chat: Assistant interaction (fixed width)"
                ]
              },
              {
                title: "Progressive Enhancement", 
                description: "Start with basic functionality, enhance with AI",
                details: [
                  "Always provide fallbacks for AI failures",
                  "Show loading states and progress indicators", 
                  "Graceful degradation when services are unavailable"
                ]
              },
              {
                title: "Agent Orchestration",
                description: "Specialized agents handle different aspects of development",
                details: [
                  "SpecAgent: Requirements analysis and specification",
                  "TestAgent: Automated testing and validation",
                  "VisualAgent: UI testing and screenshot comparison",
                  "UXAgent: Design consistency and accessibility"
                ]
              },
              {
                title: "MVP Scope Enforcement",
                description: "Prevent feature creep and maintain focus on MVP",
                details: [
                  "Validate all features against mvpscope.md",
                  "Automatic scope violation detection",
                  "Guided feature implementation within constraints"
                ]
              },
              {
                title: "Data Security First",
                description: "Security built into every layer",
                details: [
                  "All data access through RLS policies",
                  "Never expose service keys to frontend",
                  "Use Edge Functions for sensitive operations"
                ]
              },
              {
                title: "Performance Guidelines",
                description: "Optimize for speed and user experience",
                details: [
                  "Lazy load heavy components",
                  "Implement virtual scrolling for large lists",
                  "Cache API responses with React Query"
                ]
              }
            ].map((principle, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{principle.title}</CardTitle>
                  <CardDescription>{principle.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {principle.details.map((detail, idx) => (
                      <div key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-muted-foreground">•</span>
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">VCT Framework Demo</h1>
        <p className="text-muted-foreground">
          Visual Claude Toolkit - Comprehensive AI-driven development framework
        </p>
        <div className="flex justify-center gap-2">
          <Badge variant="default">Three-Panel Layout</Badge>
          <Badge variant="secondary">Agent Orchestration</Badge>
          <Badge variant="outline">MVP Focused</Badge>
        </div>
      </div>

      <Tabs value={activeDemo} onValueChange={(value) => setActiveDemo(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="journey">User Journey Demo</TabsTrigger>
          <TabsTrigger value="framework">Framework Overview</TabsTrigger>
          <TabsTrigger value="principles">VCT Principles</TabsTrigger>
        </TabsList>

        <TabsContent value="journey" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Interactive User Journey</CardTitle>
              <CardDescription>
                Experience the VCT framework's three-panel layout and user journey tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  This demo showcases the VCT framework's core principles:
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">✓ Three-panel layout</Badge>
                  <Badge variant="outline">✓ User journey tracking</Badge>
                  <Badge variant="outline">✓ Progressive enhancement</Badge>
                  <Badge variant="outline">✓ Real-time status updates</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          <VCTSimpleDemo />
        </TabsContent>

        <TabsContent value="framework" className="space-y-6">
          <FrameworkOverview />
        </TabsContent>

        <TabsContent value="principles" className="space-y-6">
          <VCTPrinciples />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VCTDemoSimple;