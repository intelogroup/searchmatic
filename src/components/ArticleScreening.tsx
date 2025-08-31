// Article Screening Interface for Systematic Literature Reviews
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';
import { 
  CheckCircle, 
  XCircle, 
  HelpCircle, 
  ExternalLink, 
  BookOpen, 
  Users, 
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter
} from 'lucide-react';
import { 
  getProjectArticles, 
  updateArticleScreening,
  type PubMedArticle 
} from '@/services/pubmedService';

// Use the PubMedArticle interface from the service
type Article = PubMedArticle & {
  id: string;
  status: 'pending' | 'included' | 'excluded' | 'maybe';
  screening_decision?: 'include' | 'exclude' | 'maybe';
  screening_notes?: string;
}

interface ScreeningCriteria {
  inclusion: string[];
  exclusion: string[];
}

interface ArticleScreeningProps {
  projectId: string;
  criteria?: ScreeningCriteria;
  onScreeningComplete?: (articleId: string, decision: 'include' | 'exclude' | 'maybe', notes?: string) => void;
}

const ArticleScreening: React.FC<ArticleScreeningProps> = ({ 
  projectId, 
  criteria,
  onScreeningComplete 
}) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [screeningNotes, setScreeningNotes] = useState('');
  const [showAbstract, setShowAbstract] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'screened'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [statistics, setStatistics] = useState({
    pending: 0,
    included: 0,
    excluded: 0,
    maybe: 0
  });

  const currentArticle = articles[currentIndex];
  
  // Screening statistics
  const stats = {
    total: articles.length,
    pending: statistics.pending,
    included: statistics.included,
    excluded: statistics.excluded,
    maybe: statistics.maybe
  };

  useEffect(() => {
    loadArticles();
  }, [projectId]);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const response = await getProjectArticles(projectId, {
        status: filterStatus === 'pending' ? 'pending' : undefined
      });
      
      setArticles(response.articles as Article[]);
      setStatistics(response.statistics);
      
      // Find first unscreened article
      const firstUnscreened = response.articles.findIndex(article => !article.screening_decision);
      if (firstUnscreened !== -1) {
        setCurrentIndex(firstUnscreened);
      }
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScreeningDecision = async (decision: 'include' | 'exclude' | 'maybe') => {
    if (!currentArticle) return;

    try {
      await updateArticleScreening(currentArticle.id, decision, screeningNotes);

      // Update local state
      setArticles(prev => prev.map(article => 
        article.id === currentArticle.id 
          ? { ...article, screening_decision: decision, screening_notes: screeningNotes.trim() || null }
          : article
      ));

      // Update statistics
      setStatistics(prev => ({
        ...prev,
        pending: prev.pending - (currentArticle.screening_decision ? 0 : 1),
        [decision]: prev[decision] + 1
      }));

      // Clear notes and move to next article
      setScreeningNotes('');
      
      // Move to next unscreened article
      const nextUnscreened = articles.slice(currentIndex + 1).findIndex(a => !a.screening_decision);
      if (nextUnscreened !== -1) {
        setCurrentIndex(currentIndex + 1 + nextUnscreened);
      } else {
        // If no more unscreened articles, stay at current or move to next
        if (currentIndex < articles.length - 1) {
          setCurrentIndex(currentIndex + 1);
        }
      }

      // Callback for parent component
      onScreeningComplete?.(currentArticle.id, decision, screeningNotes.trim() || undefined);

    } catch (error) {
      console.error('Error updating screening decision:', error);
    }
  };

  const navigateToArticle = (index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, articles.length - 1)));
    setScreeningNotes(articles[index]?.screening_notes || '');
  };

  const getDecisionIcon = (decision?: string) => {
    switch (decision) {
      case 'include': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'exclude': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'maybe': return <HelpCircle className="h-4 w-4 text-yellow-600" />;
      default: return null;
    }
  };

  const getDecisionColor = (decision?: string) => {
    switch (decision) {
      case 'include': return 'bg-green-100 text-green-800 border-green-300';
      case 'exclude': return 'bg-red-100 text-red-800 border-red-300';
      case 'maybe': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatAuthors = (authors: string[] | string) => {
    if (Array.isArray(authors)) {
      return authors.slice(0, 3).join(', ') + (authors.length > 3 ? ' et al.' : '');
    }
    return typeof authors === 'string' ? authors : 'Unknown authors';
  };

  const formatDate = (date: string) => {
    if (!date) return 'Unknown date';
    try {
      return new Date(date).getFullYear().toString();
    } catch {
      return date;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading articles for screening...</p>
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <Card className="p-8 text-center">
        <CardContent>
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Articles Found</h3>
          <p className="text-gray-600 mb-4">
            No articles have been imported for this project yet.
          </p>
          <Button>
            <Search className="h-4 w-4 mr-2" />
            Search Articles
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress and Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Article Screening Progress</span>
            <span className="text-sm font-normal text-gray-600">
              {currentIndex + 1} of {articles.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.included}</div>
              <div className="text-sm text-gray-600">Included</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.excluded}</div>
              <div className="text-sm text-gray-600">Excluded</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.maybe}</div>
              <div className="text-sm text-gray-600">Maybe</div>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${((stats.included + stats.excluded + stats.maybe) / stats.total) * 100}%` }}
            ></div>
          </div>
          <div className="text-sm text-gray-600 mt-2 text-center">
            {Math.round(((stats.included + stats.excluded + stats.maybe) / stats.total) * 100)}% Complete
          </div>
        </CardContent>
      </Card>

      {currentArticle && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Article Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg leading-tight mb-3">
                      {currentArticle.title}
                    </CardTitle>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {formatAuthors(currentArticle.authors)}
                      </div>
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-1" />
                        {currentArticle.journal}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(currentArticle.publication_year?.toString() || '')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {currentArticle.screening_decision && (
                      <Badge className={`${getDecisionColor(currentArticle.screening_decision)}`}>
                        {getDecisionIcon(currentArticle.screening_decision)}
                        <span className="ml-1 capitalize">{currentArticle.screening_decision}</span>
                      </Badge>
                    )}
                    {currentArticle.pdf_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={currentArticle.pdf_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Article metadata */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Source: PubMed</Badge>
                    {currentArticle.pmid && <Badge variant="outline">PMID: {currentArticle.pmid}</Badge>}
                    {currentArticle.doi && <Badge variant="outline">DOI: {currentArticle.doi}</Badge>}
                    {currentArticle.metadata?.publicationType?.map((type, index) => (
                      <Badge key={index} variant="secondary">{type}</Badge>
                    ))}
                  </div>

                  {/* Abstract */}
                  {showAbstract && currentArticle.abstract && (
                    <div>
                      <h4 className="font-medium mb-2">Abstract</h4>
                      <ScrollArea className="h-40 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {currentArticle.abstract}
                        </p>
                      </ScrollArea>
                    </div>
                  )}

                  {/* MeSH Terms */}
                  {currentArticle.metadata?.meshTerms && currentArticle.metadata.meshTerms.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">MeSH Terms</h4>
                      <div className="flex flex-wrap gap-1">
                        {currentArticle.metadata.meshTerms.slice(0, 10).map((mesh, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {typeof mesh === 'string' ? mesh : mesh.descriptorName}
                          </Badge>
                        ))}
                        {currentArticle.metadata.meshTerms.length > 10 && (
                          <Badge variant="outline" className="text-xs">
                            +{currentArticle.metadata.meshTerms.length - 10} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Screening Panel */}
          <div className="space-y-4">
            {/* Screening Criteria */}
            {criteria && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Screening Criteria</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {criteria.inclusion.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium text-green-700 mb-1">Inclusion</h5>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {criteria.inclusion.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="h-3 w-3 text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {criteria.exclusion.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium text-red-700 mb-1">Exclusion</h5>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {criteria.exclusion.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <XCircle className="h-3 w-3 text-red-500 mr-1 mt-0.5 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Screening Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Screening Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Add notes about your screening decision..."
                  value={screeningNotes}
                  onChange={(e) => setScreeningNotes(e.target.value)}
                  className="min-h-[100px] text-sm"
                />
              </CardContent>
            </Card>

            {/* Screening Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Screening Decision</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <Button 
                    onClick={() => handleScreeningDecision('include')} 
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={currentArticle.screening_decision === 'include'}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Include
                  </Button>
                  <Button 
                    onClick={() => handleScreeningDecision('exclude')} 
                    variant="destructive"
                    disabled={currentArticle.screening_decision === 'exclude'}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Exclude
                  </Button>
                  <Button 
                    onClick={() => handleScreeningDecision('maybe')} 
                    variant="outline"
                    className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                    disabled={currentArticle.screening_decision === 'maybe'}
                  >
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Maybe / Uncertain
                  </Button>
                </div>

                <Separator />

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateToArticle(currentIndex - 1)}
                    disabled={currentIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-xs text-gray-600">
                    {currentIndex + 1} / {articles.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateToArticle(currentIndex + 1)}
                    disabled={currentIndex === articles.length - 1}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleScreening;