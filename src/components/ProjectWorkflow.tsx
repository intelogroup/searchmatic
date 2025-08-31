// Project Workflow Component - Connects Project Creation to Protocol Generation
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { 
  Plus, 
  ChevronRight, 
  CheckCircle, 
  Clock, 
  FileText, 
  Search, 
  Filter, 
  Download,
  Settings,
  Lightbulb,
  BookOpen,
  Users,
  Target,
  Database
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  createProtocol, 
  generateFramework, 
  getProtocol,
  saveProtocol,
  getReviewTypes,
  getFocusAreas 
} from '@/services/protocolGuidanceService';
import { 
  searchAndImportArticles,
  getProjectArticles,
  type PubMedSearchRequest 
} from '@/services/pubmedService';
import ArticleScreening from './ArticleScreening';

interface Project {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface Protocol {
  id?: string;
  project_id: string;
  framework_type: 'pico' | 'spider' | 'other';
  research_question: string;
  protocol_data: any;
  ai_guidance?: string;
  status: 'draft' | 'active' | 'locked';
}

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'in-progress' | 'completed';
  component?: React.ReactNode;
}

const ProjectWorkflow: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // New project form
  const [newProjectData, setNewProjectData] = useState({
    title: '',
    description: '',
    researchQuestion: '',
    reviewType: 'systematic_review' as 'systematic_review' | 'meta_analysis' | 'scoping_review'
  });

  // Protocol data
  const [protocolData, setProtocolData] = useState<Protocol | null>(null);
  const [generatingProtocol, setGeneratingProtocol] = useState(false);
  
  // Search data
  const [searchQuery, setSearchQuery] = useState('');
  const [searchingArticles, setSearchingArticles] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [articles, setArticles] = useState<any[]>([]);

  // Workflow steps
  const getWorkflowSteps = (project: Project | null): WorkflowStep[] => [
    {
      id: 'project-setup',
      title: 'Project Setup',
      description: 'Create and configure your systematic review project',
      icon: <Settings className="h-5 w-5" />,
      status: project ? 'completed' : 'pending',
      component: <ProjectSetupStep />
    },
    {
      id: 'protocol-creation',
      title: 'Protocol Development', 
      description: 'Generate research protocol with AI assistance',
      icon: <FileText className="h-5 w-5" />,
      status: project && protocolData ? 'completed' : project ? 'in-progress' : 'pending',
      component: <ProtocolCreationStep />
    },
    {
      id: 'literature-search',
      title: 'Literature Search',
      description: 'Search databases and import relevant articles',
      icon: <Search className="h-5 w-5" />,
      status: 'pending',
      component: <LiteratureSearchStep />
    },
    {
      id: 'article-screening',
      title: 'Article Screening',
      description: 'Screen articles using inclusion/exclusion criteria',
      icon: <Filter className="h-5 w-5" />,
      status: 'pending',
      component: <ArticleScreeningStep />
    },
    {
      id: 'data-extraction',
      title: 'Data Extraction',
      description: 'Extract data from included articles',
      icon: <Database className="h-5 w-5" />,
      status: 'pending'
    },
    {
      id: 'analysis-report',
      title: 'Analysis & Report',
      description: 'Analyze results and generate final report',
      icon: <Download className="h-5 w-5" />,
      status: 'pending'
    }
  ];

  const steps = getWorkflowSteps(selectedProject);

  useEffect(() => {
    loadProjects();
  }, [user]);

  useEffect(() => {
    if (selectedProject) {
      loadProtocol();
      loadArticles();
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
      
      // Auto-select most recent project
      if (data && data.length > 0) {
        setSelectedProject(data[0]);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProtocol = async () => {
    if (!selectedProject) return;

    try {
      const data = await getProtocol(selectedProject.id);
      setProtocolData(data as any);
    } catch (error) {
      console.error('Error loading protocol:', error);
    }
  };

  const loadArticles = async () => {
    if (!selectedProject) return;

    try {
      const response = await getProjectArticles(selectedProject.id);
      setArticles(response.articles);
    } catch (error) {
      console.error('Error loading articles:', error);
    }
  };

  const createProject = async () => {
    if (!user || !newProjectData.title.trim()) return;

    try {
      setCreating(true);

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert([{
          title: newProjectData.title.trim(),
          description: newProjectData.description.trim(),
          status: 'active',
          user_id: user.id
        }])
        .select()
        .single();

      if (projectError) throw projectError;

      // Generate protocol with AI assistance if research question provided
      if (newProjectData.researchQuestion.trim()) {
        await generateProtocolFromQuestion(project.id);
      }

      // Refresh projects and select the new one
      await loadProjects();
      setSelectedProject(project);
      setCurrentStep(1); // Move to protocol step

      // Clear form
      setNewProjectData({
        title: '',
        description: '',
        researchQuestion: '',
        reviewType: 'systematic_review'
      });

    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setCreating(false);
    }
  };

  const generateProtocolFromQuestion = async (projectId: string) => {
    if (!newProjectData.researchQuestion.trim()) return;

    try {
      setGeneratingProtocol(true);
      const response = await createProtocol(
        newProjectData.researchQuestion.trim(),
        newProjectData.reviewType,
        undefined,
        projectId
      );

      if (response.success) {
        // Save the protocol to database
        await saveProtocol(projectId, response.protocol, response.guidance);
        
        // Refresh protocol data
        await loadProtocol();
      }
    } catch (error) {
      console.error('Protocol generation error:', error);
    } finally {
      setGeneratingProtocol(false);
    }
  };

  const searchArticles = async () => {
    if (!selectedProject || !searchQuery.trim()) return;

    try {
      setSearchingArticles(true);
      const request: PubMedSearchRequest = {
        projectId: selectedProject.id,
        query: searchQuery.trim(),
        maxResults: 50
      };

      const response = await searchAndImportArticles(request);
      setSearchResults(response);
      
      // Refresh articles
      await loadArticles();
    } catch (error) {
      console.error('Error searching articles:', error);
    } finally {
      setSearchingArticles(false);
    }
  };

  // Step Components
  function ProjectSetupStep() {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Create New Project
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Effectiveness of Mindfulness Interventions for Anxiety"
                value={newProjectData.title}
                onChange={(e) => setNewProjectData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of your systematic review project..."
                value={newProjectData.description}
                onChange={(e) => setNewProjectData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="research-question">Research Question (Optional)</Label>
              <Textarea
                id="research-question"
                placeholder="What is your main research question? This will be used to generate your protocol automatically."
                value={newProjectData.researchQuestion}
                onChange={(e) => setNewProjectData(prev => ({ ...prev, researchQuestion: e.target.value }))}
                rows={2}
              />
              <p className="text-xs text-gray-500 mt-1">
                <Lightbulb className="h-3 w-3 inline mr-1" />
                Providing a research question will automatically generate a protocol using AI
              </p>
            </div>

            <div>
              <Label htmlFor="review-type">Review Type</Label>
              <Select
                value={newProjectData.reviewType}
                onValueChange={(value: any) => setNewProjectData(prev => ({ ...prev, reviewType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select review type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="systematic_review">Systematic Review</SelectItem>
                  <SelectItem value="meta_analysis">Meta-Analysis</SelectItem>
                  <SelectItem value="scoping_review">Scoping Review</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={createProject} 
              disabled={!newProjectData.title.trim() || creating}
              className="w-full"
            >
              {creating ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  function ProtocolCreationStep() {
    if (!selectedProject) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Protocol Development
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {protocolData ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Protocol Generated
                </Badge>
                <Button variant="outline" size="sm">
                  Edit Protocol
                </Button>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Research Question</h4>
                <p className="text-sm text-gray-700">{protocolData.research_question}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Framework</h4>
                <Badge variant="secondary">{protocolData.framework_type.toUpperCase()}</Badge>
              </div>

              {protocolData.ai_guidance && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2 flex items-center">
                    <Lightbulb className="h-4 w-4 mr-1" />
                    AI Guidance
                  </h4>
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {protocolData.ai_guidance}
                  </p>
                </div>
              )}

              <Button className="w-full" onClick={() => setCurrentStep(2)}>
                <ChevronRight className="h-4 w-4 mr-2" />
                Proceed to Literature Search
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Protocol Yet</h3>
              <p className="text-gray-600 mb-4">
                Generate a research protocol to continue with your systematic review.
              </p>
              <Button>
                <Lightbulb className="h-4 w-4 mr-2" />
                Generate Protocol with AI
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  function LiteratureSearchStep() {
    if (!selectedProject || !protocolData) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Literature Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {articles.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Search Results</h3>
                <Badge variant="secondary">{articles.length} articles imported</Badge>
              </div>
              
              {searchResults && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="font-medium text-green-900">Search Completed</span>
                  </div>
                  <div className="text-sm text-green-700">
                    <p>Query: "{searchResults.searchQuery}"</p>
                    <p>Found {searchResults.totalResults} results, imported {searchResults.importedCount} articles</p>
                    {searchResults.duplicatesSkipped > 0 && (
                      <p>Skipped {searchResults.duplicatesSkipped} duplicates</p>
                    )}
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="search-query">New Search Query</Label>
                <div className="flex gap-2">
                  <Input
                    id="search-query"
                    placeholder="Enter search terms..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !searchingArticles && searchArticles()}
                  />
                  <Button 
                    onClick={searchArticles} 
                    disabled={searchingArticles || !searchQuery.trim()}
                  >
                    {searchingArticles ? (
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    Search
                  </Button>
                </div>
              </div>
              
              <Button 
                onClick={() => setCurrentStep(3)} 
                className="w-full mt-4"
              >
                Proceed to Article Screening
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          ) : (
            <div className="text-center py-6">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Search Academic Databases</h3>
              <p className="text-gray-600 mb-6">
                Search PubMed using your protocol criteria to find relevant articles.
              </p>
              
              <div className="space-y-4 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="search-input">Search Query</Label>
                  <Input
                    id="search-input"
                    placeholder="Enter search terms based on your PICO/SPIDER framework..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !searchingArticles && searchArticles()}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <BookOpen className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <h4 className="font-medium">PubMed</h4>
                    <p className="text-xs text-gray-600">MEDLINE database</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <Target className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                    <h4 className="font-medium">Protocol-Based</h4>
                    <p className="text-xs text-gray-600">Uses your research criteria</p>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={searchArticles} 
                disabled={searchingArticles || !searchQuery.trim()}
                className="w-full"
              >
                {searchingArticles ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Searching Articles...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Start Literature Search
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  function ArticleScreeningStep() {
    if (!selectedProject) return null;
    
    return (
      <div>
        <ArticleScreening 
          projectId={selectedProject.id}
          criteria={protocolData?.protocol_data?.inclusionCriteria && protocolData?.protocol_data?.exclusionCriteria ? {
            inclusion: protocolData.protocol_data.inclusionCriteria,
            exclusion: protocolData.protocol_data.exclusionCriteria
          } : undefined}
          onScreeningComplete={(articleId, decision, notes) => {
            console.log(`Article ${articleId} screened: ${decision}`, notes);
          }}
        />
      </div>
    );
  }

  const getStepStatus = (index: number) => {
    if (index < currentStep) return 'completed';
    if (index === currentStep) return 'in-progress';
    return 'pending';
  };

  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Systematic Review Workflow</h1>
        <p className="text-gray-600 mt-2">
          Complete your systematic literature review step by step
        </p>
      </div>

      {/* Project Selection */}
      {projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Select Project</span>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Card 
                  key={project.id}
                  className={`cursor-pointer transition-all ${
                    selectedProject?.id === project.id 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedProject(project)}
                >
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-2 line-clamp-2">{project.title}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                        {project.status}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Progress Overview</span>
            <span className="text-sm font-normal text-gray-600">
              {Math.round(progressPercentage)}% Complete
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercentage} className="mb-4" />
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`text-center p-4 rounded-lg border cursor-pointer transition-all ${
                  getStepStatus(index) === 'completed'
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : getStepStatus(index) === 'in-progress'
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-gray-50 border-gray-200 text-gray-500'
                }`}
                onClick={() => setCurrentStep(index)}
              >
                <div className="flex justify-center mb-2">
                  {getStepStatus(index) === 'completed' ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : getStepStatus(index) === 'in-progress' ? (
                    <Clock className="h-6 w-6 text-blue-600" />
                  ) : (
                    step.icon
                  )}
                </div>
                <h3 className="font-medium text-sm mb-1">{step.title}</h3>
                <p className="text-xs opacity-75 line-clamp-2">{step.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Step */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Step {currentStep + 1}: {steps[currentStep]?.title}
        </h2>
        {steps[currentStep]?.component}
      </div>
    </div>
  );
};

export default ProjectWorkflow;