// components/admin/SuggestionSummaryModal.tsx
import React, { useEffect, useState } from 'react';
import { Loader2, X, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface SummaryItem {
  groupTitle: string;
  count: number;
  examples: string[];
  categories?: string[];
  dateRange?: {
    oldest: Date;
    newest: Date;
  };
  similarityScore?: number;
  commonWords?: string[];
  clusterType?: 'exact' | 'semantic' | 'theme';
  confidence?: number;
}

interface CategoryAnalysis {
  category: string;
  count: number;
  percentage: number;
  avgLength: number;
  commonWords: string[];
  urgencyScore: number;
  priority: 'high' | 'medium' | 'low';
  recommendations: string[];
}

interface SummaryData {
  totalGroups: number;
  summary: SummaryItem[];
  totalPending: number;
  insights?: {
    totalPending: number;
    categoryBreakdown: CategoryAnalysis[];
    topCategories: string[];
    urgentCategories: string[];
    commonThemes: string[];
    actionRecommendations: string[];
    processingTime: number;
  };
  message?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

const SuggestionSummaryModal: React.FC<Props> = ({ open, onClose }) => {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'similarity' | 'insights'>('insights');

  useEffect(() => {
    if (open) {
      setLoading(true);
      setError(null);
      
      fetch('/api/suggestions/summary')
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          if (data.error) {
            throw new Error(data.error);
          }
          setSummaryData(data);
        })
        .catch((err) => {
          console.error('Summary fetch error:', err);
          setError(err.message || 'Failed to load summary');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open]);

  if (!open) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <Clock className="w-4 h-4" />;
      case 'low': return <CheckCircle className="w-4 h-4" />;
      default: return <TrendingUp className="w-4 h-4" />;
    }
  };

  const getClusterTypeInfo = (type?: string) => {
    switch (type) {
      case 'exact':
        return { label: 'Exact Match', color: 'bg-green-100 text-green-700', icon: '🎯' };
      case 'semantic':
        return { label: 'Semantic', color: 'bg-blue-100 text-blue-700', icon: '🧠' };
      case 'theme':
        return { label: 'Theme', color: 'bg-purple-100 text-purple-700', icon: '🎨' };
      default:
        return { label: 'Unknown', color: 'bg-gray-100 text-gray-700', icon: '❓' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-center items-center px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">Pending Suggestions Summary</h2>
              <p className="text-sm opacity-90 mt-1">Comprehensive analysis </p>
            </div>
            <button
              className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('insights')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'insights'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Insights & Analysis
            </button>
            <button
              onClick={() => setActiveTab('similarity')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'similarity'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Similarity Groups
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
              <p className="text-gray-500">Analyzing pending suggestions...</p>
              <p className="text-sm text-gray-400 mt-2">This may take a few moments</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
                <div className="flex items-center gap-2 text-red-600 mb-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Error</span>
                </div>
                <p className="text-red-700 text-sm">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : !summaryData || (summaryData.summary.length === 0 && !summaryData.insights) ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No pending suggestions to summarize</h3>
                <p className="text-gray-500">
                  {summaryData?.message || "There are currently no pending suggestions in the system to analyze."}
                </p>
              </div>
            </div>
          ) : activeTab === 'insights' && summaryData.insights ? (
            <div className="space-y-8">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total Pending</p>
                      <p className="text-2xl font-bold text-blue-900">{summaryData.insights.totalPending}</p>
                    </div>
                    <div className="p-2 bg-blue-200 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-600">High Priority</p>
                      <p className="text-2xl font-bold text-red-900">{summaryData.insights.urgentCategories.length}</p>
                    </div>
                    <div className="p-2 bg-red-200 rounded-lg">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Categories</p>
                      <p className="text-2xl font-bold text-purple-900">{summaryData.insights.categoryBreakdown.length}</p>
                    </div>
                    <div className="p-2 bg-purple-200 rounded-lg">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Similar Groups</p>
                      <p className="text-2xl font-bold text-green-900">{summaryData.totalGroups}</p>
                    </div>
                    <div className="p-2 bg-green-200 rounded-lg">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Recommendations */}
              {summaryData.insights.actionRecommendations.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-yellow-700 mb-3">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium">Action Recommendations</span>
                  </div>
                  <ul className="space-y-2">
                    {summaryData.insights.actionRecommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 text-yellow-700 text-sm">
                        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Category Analysis */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Analysis</h3>
                <div className="space-y-4">
                  {summaryData.insights.categoryBreakdown.map((category, index) => (
                    <div key={index} className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-gray-900">{category.category}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(category.priority)}`}>
                            {getPriorityIcon(category.priority)}
                            <span className="ml-1">{category.priority}</span>
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">{category.count}</div>
                          <div className="text-xs text-gray-500">{category.percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div className="text-center">
                          <div className="text-sm text-gray-500">Avg Length</div>
                          <div className="font-medium text-gray-900">{category.avgLength} chars</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-500">Urgency Score</div>
                          <div className="font-medium text-gray-900">{category.urgencyScore}/10</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-500">Common Words</div>
                          <div className="font-medium text-gray-900 text-xs">
                            {category.commonWords.slice(0, 3).join(', ')}
                          </div>
                        </div>
                      </div>

                      {category.recommendations.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs font-medium text-gray-600 mb-2">Recommendations:</div>
                          <ul className="space-y-1">
                            {category.recommendations.map((rec, recIndex) => (
                              <li key={recIndex} className="text-xs text-gray-700 flex items-start gap-2">
                                <span className="w-1 h-1 bg-blue-400 rounded-full mt-1.5 flex-shrink-0"></span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Common Themes */}
              {summaryData.insights.commonThemes.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Common Themes</h3>
                  <div className="flex flex-wrap gap-2">
                    {summaryData.insights.commonThemes.map((theme, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-700 mb-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Similarity Groups Overview</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-blue-600 text-sm">
                      Total pending suggestions: <span className="font-semibold">{summaryData?.totalPending}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-600 text-sm">
                      Similar groups found: <span className="font-semibold">{summaryData?.totalGroups}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary Groups */}
              <div className="space-y-4">
                {summaryData?.summary.map((item, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {item.groupTitle}
                      </h3>
                      <div className="flex items-center gap-2">
                        {item.clusterType && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getClusterTypeInfo(item.clusterType).color}`}>
                            {getClusterTypeInfo(item.clusterType).icon} {getClusterTypeInfo(item.clusterType).label}
                          </span>
                        )}
                        {item.categories && item.categories.length > 0 && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                            {item.categories.join(', ')}
                          </span>
                        )}
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          {item.count} {item.count === 1 ? 'suggestion' : 'suggestions'}
                        </span>
                        {item.similarityScore && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                            {(item.similarityScore * 100).toFixed(0)}% similar
                          </span>
                        )}
                        {item.confidence && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700">
                            {(item.confidence * 100).toFixed(0)}% confidence
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {item.dateRange && (
                      <div className="text-xs text-gray-500 mb-3">
                        Date range: {new Date(item.dateRange.oldest).toLocaleDateString()} - {new Date(item.dateRange.newest).toLocaleDateString()}
                      </div>
                    )}
                    
                    {item.commonWords && item.commonWords.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs text-gray-500 mb-1">Common keywords:</div>
                        <div className="flex flex-wrap gap-1">
                          {item.commonWords.map((word, wordIndex) => (
                            <span key={wordIndex} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                              {word}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      {item.examples.map((example, j) => (
                        <div key={j} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-gray-700 text-sm leading-relaxed">{example}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuggestionSummaryModal;
