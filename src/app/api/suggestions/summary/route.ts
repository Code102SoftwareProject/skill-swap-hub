import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import Suggestion from '@/lib/models/Suggestion';
import Fuse from 'fuse.js';
import { removeStopwords } from 'stopword';

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

interface SummaryInsights {
  totalPending: number;
  categoryBreakdown: CategoryAnalysis[];
  topCategories: string[];
  urgentCategories: string[];
  commonThemes: string[];
  actionRecommendations: string[];
  processingTime: number;
}

export async function GET() {
  try {
    await connect();

    // Fetch pending suggestions and populate user info to check blocked status
    const suggestions = await Suggestion.find({ status: 'Pending' }).populate('userId', 'isBlocked');
    
    // Filter out suggestions from blocked users
    const filteredSuggestions = suggestions.filter(suggestion => {
      // If userId is populated and user is blocked, exclude the suggestion
      if (suggestion.userId && typeof suggestion.userId === 'object' && 'isBlocked' in suggestion.userId) {
        return !suggestion.userId.isBlocked;
      }
      // If userId is not populated or doesn't have isBlocked field, include the suggestion
      return true;
    });

    // If no pending suggestions from non-blocked users, return empty summary
    if (filteredSuggestions.length === 0) {
      return NextResponse.json({ 
        totalGroups: 0, 
        summary: [],
        message: 'No pending suggestions from active users found',
        insights: null
      });
    }

    // STEP 1: Category Analysis
    const categoryStats = filteredSuggestions.reduce((acc: Record<string, { suggestions: any[], totalLength: number, words: Set<string> }>, suggestion) => {
      if (!acc[suggestion.category]) {
        acc[suggestion.category] = {
          suggestions: [],
          totalLength: 0,
          words: new Set<string>()
        };
      }
      
      const text = `${suggestion.title} ${suggestion.description}`;
      acc[suggestion.category].suggestions.push(suggestion);
      acc[suggestion.category].totalLength += text.length;
      
      // Extract words for analysis
      const words = text.toLowerCase()
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .split(' ')
        .filter(word => word.length > 2);
      
      words.forEach(word => acc[suggestion.category].words.add(word));
      
      return acc;
    }, {});

    // STEP 2: Generate Category Analysis
    const categoryAnalysis: CategoryAnalysis[] = Object.entries(categoryStats).map(([category, stats]) => {
      const typedStats = stats as { suggestions: any[], totalLength: number, words: Set<string> };
      const count = typedStats.suggestions.length;
      const percentage = (count / filteredSuggestions.length) * 100;
      const avgLength = Math.round(typedStats.totalLength / count);
      
      // Find common words in this category
      const allWords = Array.from(typedStats.words);
      const wordFrequency = allWords.reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const commonWords = Object.entries(wordFrequency)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([word]) => word);

      // Calculate urgency score based on various factors
      const urgencyScore = calculateUrgencyScore(typedStats.suggestions, category, count);
      const priority = urgencyScore > 7 ? 'high' : urgencyScore > 4 ? 'medium' : 'low';
      
      // Generate recommendations
      const recommendations = generateRecommendations(category, count, urgencyScore, commonWords);

      return {
        category,
        count,
        percentage,
        avgLength,
        commonWords,
        urgencyScore,
        priority,
        recommendations
      };
    });

    // STEP 3: Generate Overall Insights
    const insights: SummaryInsights = {
      totalPending: filteredSuggestions.length,
      categoryBreakdown: categoryAnalysis.sort((a, b) => b.count - a.count),
      topCategories: categoryAnalysis.slice(0, 3).map(c => c.category),
      urgentCategories: categoryAnalysis.filter(c => c.priority === 'high').map(c => c.category),
      commonThemes: extractCommonThemes(filteredSuggestions),
      actionRecommendations: generateActionRecommendations(categoryAnalysis),
      processingTime: Date.now()
    };

    // STEP 4: Similarity Analysis (Enhanced)
    const similarityGroups = performSimilarityAnalysis(filteredSuggestions);

    return NextResponse.json({ 
      totalGroups: similarityGroups.length, 
      summary: similarityGroups,
      totalPending: filteredSuggestions.length,
      insights
    });
  } catch (error) {
    console.error('Summary generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// Helper Functions
function calculateUrgencyScore(suggestions: any[], category: string, count: number): number {
  let score = 0;
  
  // Higher count = higher urgency
  score += Math.min(count / 5, 3);
  
  // Category-specific urgency
  const urgentCategories = ['bug', 'error', 'issue', 'problem', 'critical', 'urgent'];
  if (urgentCategories.some(word => category.toLowerCase().includes(word))) {
    score += 2;
  }
  
  // Recent suggestions get higher priority
  const recentSuggestions = suggestions.filter(s => {
    const daysAgo = (Date.now() - new Date(s.date).getTime()) / (1000 * 60 * 60 * 24);
    return daysAgo < 7;
  });
  score += recentSuggestions.length * 0.5;
  
  return Math.min(score, 10);
}

function generateRecommendations(category: string, count: number, urgencyScore: number, commonWords: string[]): string[] {
  const recommendations = [];
  
  if (count > 10) {
    recommendations.push(`High volume: Consider batch processing for ${count} suggestions`);
  }
  
  if (urgencyScore > 7) {
    recommendations.push('High priority: Review immediately');
  }
  
  if (commonWords.length > 0) {
    recommendations.push(`Common themes: ${commonWords.slice(0, 3).join(', ')}`);
  }
  
  if (count < 3) {
    recommendations.push('Low volume: Can be processed individually');
  }
  
  return recommendations;
}

function extractCommonThemes(suggestions: any[]): string[] {
  const allText = suggestions.map(s => `${s.title} ${s.description}`).join(' ');
  const words = allText.toLowerCase()
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(' ')
    .filter(word => word.length > 3);
  
  const wordFrequency = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(wordFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8)
    .map(([word]) => word);
}

function generateActionRecommendations(categoryAnalysis: CategoryAnalysis[]): string[] {
  const recommendations = [];
  
  const highPriority = categoryAnalysis.filter(c => c.priority === 'high');
  if (highPriority.length > 0) {
    recommendations.push(`Focus on ${highPriority.length} high-priority categories first`);
  }
  
  const largeCategories = categoryAnalysis.filter(c => c.count > 5);
  if (largeCategories.length > 0) {
    recommendations.push(`Batch process ${largeCategories.length} categories with high volume`);
  }
  
  const totalSuggestions = categoryAnalysis.reduce((sum, c) => sum + c.count, 0);
  if (totalSuggestions > 20) {
    recommendations.push('Consider implementing automated categorization');
  }
  
  return recommendations;
}

function performSimilarityAnalysis(suggestions: any[]): any[] {
  // Professional similarity analysis with intelligent clustering
  const processedSuggestions = suggestions.map((s) => {
    const combined = `${s.title} ${s.description}`;
    const processed = preprocessText(combined);
    
    return {
      id: s._id,
      originalTitle: s.title,
      originalDescription: s.description,
      processedText: processed,
      category: s.category,
      date: s.date,
      wordCount: processed.split(' ').length
    };
  });

  // Build TF-IDF matrix for better similarity calculation
  const tfidfMatrix = buildTFIDFMatrix(processedSuggestions);
  
  // Perform intelligent clustering
  const clusters = performClustering(processedSuggestions, tfidfMatrix);
  
  return clusters.map((cluster: any) => ({
    groupTitle: generateGroupTitle(cluster.suggestions),
    count: cluster.suggestions.length,
    examples: cluster.suggestions.map((s: any) => s.originalTitle),
    categories: [...new Set(cluster.suggestions.map((s: any) => s.category))],
    dateRange: {
      oldest: new Date(Math.min(...cluster.suggestions.map((s: any) => new Date(s.date).getTime()))),
      newest: new Date(Math.max(...cluster.suggestions.map((s: any) => new Date(s.date).getTime())))
    },
    similarityScore: cluster.avgSimilarity,
    commonWords: cluster.topKeywords,
    clusterType: cluster.type,
    confidence: cluster.confidence
  }));
}

function preprocessText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation but keep spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .split(' ')
    .filter(word => word.length > 2 && !isStopWord(word))
    .join(' ');
}

function isStopWord(word: string): boolean {
  const stopWords = new Set([
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
    'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their',
    'can', 'get', 'like', 'want', 'need', 'use', 'make', 'see', 'know', 'think'
  ]);
  return stopWords.has(word);
}

function buildTFIDFMatrix(suggestions: any[]): { [key: string]: { [key: string]: number } } {
  // Calculate term frequency for each document
  const tf: { [key: string]: { [key: string]: number } } = {};
  const wordCount: { [key: string]: number } = {};
  
  suggestions.forEach((suggestion, docIndex) => {
    const words = suggestion.processedText.split(' ');
    const wordFreq: { [key: string]: number } = {};
    
    words.forEach((word: string) => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    tf[docIndex] = wordFreq;
  });
  
  // Calculate TF-IDF
  const tfidf: { [key: string]: { [key: string]: number } } = {};
  const totalDocs = suggestions.length;
  
  suggestions.forEach((_, docIndex) => {
    tfidf[docIndex] = {};
    Object.keys(tf[docIndex]).forEach(word => {
      const tf_score = tf[docIndex][word] / Object.keys(tf[docIndex]).length;
      const idf_score = Math.log(totalDocs / wordCount[word]);
      tfidf[docIndex][word] = tf_score * idf_score;
    });
  });
  
  return tfidf;
}

function performClustering(suggestions: any[], tfidfMatrix: { [key: string]: { [key: string]: number } }): any[] {
  const clusters: any[] = [];
  const visited = new Set();
  
  // Phase 1: Find exact duplicates and near-duplicates
  const exactClusters = findExactDuplicates(suggestions);
  exactClusters.forEach(cluster => {
    clusters.push(cluster);
    cluster.suggestions.forEach((s: any) => visited.add(s.id));
  });
  
  // Phase 2: Semantic clustering using cosine similarity
  const remainingSuggestions = suggestions.filter((s: any) => !visited.has(s.id));
  const semanticClusters = performSemanticClustering(remainingSuggestions, tfidfMatrix);
  clusters.push(...semanticClusters);
  
  // Phase 3: Theme-based grouping for remaining items
  const unclustered = suggestions.filter((s: any) => !visited.has(s.id));
  const themeClusters = performThemeClustering(unclustered);
  clusters.push(...themeClusters);
  
  return clusters.sort((a, b) => b.suggestions.length - a.suggestions.length);
}

function findExactDuplicates(suggestions: any[]): any[] {
  const duplicates: { [key: string]: any[] } = {};
  
  suggestions.forEach(suggestion => {
    const key = suggestion.processedText.toLowerCase();
    if (!duplicates[key]) {
      duplicates[key] = [];
    }
    duplicates[key].push(suggestion);
  });
  
  return Object.values(duplicates)
    .filter(group => group.length > 1)
    .map(group => ({
      suggestions: group,
      type: 'exact',
      confidence: 1.0,
      avgSimilarity: 1.0,
      topKeywords: extractTopKeywords(group)
    }));
}

function performSemanticClustering(suggestions: any[], tfidfMatrix: { [key: string]: { [key: string]: number } }): any[] {
  const clusters: any[] = [];
  const visited = new Set();
  
  suggestions.forEach((suggestion, i) => {
    if (visited.has(suggestion.id)) return;
    
    const similarSuggestions = [suggestion];
    visited.add(suggestion.id);
    
    // Find semantically similar suggestions
    suggestions.forEach((otherSuggestion, j) => {
      if (i === j || visited.has(otherSuggestion.id)) return;
      
      const similarity = calculateCosineSimilarity(tfidfMatrix[i], tfidfMatrix[j]);
      if (similarity > 0.6) { // High similarity threshold
        similarSuggestions.push(otherSuggestion);
        visited.add(otherSuggestion.id);
      }
    });
    
    if (similarSuggestions.length > 1) {
      const avgSimilarity = calculateAverageSimilarity(similarSuggestions, tfidfMatrix);
      clusters.push({
        suggestions: similarSuggestions,
        type: 'semantic',
        confidence: Math.min(avgSimilarity * 1.2, 0.95),
        avgSimilarity,
        topKeywords: extractTopKeywords(similarSuggestions)
      });
    }
  });
  
  return clusters;
}

function performThemeClustering(suggestions: any[]): any[] {
  const clusters: any[] = [];
  const visited = new Set();
  
  // Extract themes using keyword frequency
  const themes = extractThemes(suggestions);
  
  themes.forEach(theme => {
    const themeSuggestions = suggestions.filter(s => 
      !visited.has(s.id) && hasThemeKeywords(s, theme.keywords)
    );
    
    if (themeSuggestions.length > 1) {
      themeSuggestions.forEach(s => visited.add(s.id));
      clusters.push({
        suggestions: themeSuggestions,
        type: 'theme',
        confidence: 0.7,
        avgSimilarity: 0.6,
        topKeywords: theme.keywords
      });
    }
  });
  
  return clusters;
}

function calculateCosineSimilarity(vec1: any, vec2: any): number {
  const words = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  words.forEach(word => {
    const val1 = vec1[word] || 0;
    const val2 = vec2[word] || 0;
    dotProduct += val1 * val2;
    norm1 += val1 * val1;
    norm2 += val2 * val2;
  });
  
  if (norm1 === 0 || norm2 === 0) return 0;
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

function calculateAverageSimilarity(suggestions: any[], tfidfMatrix: { [key: string]: { [key: string]: number } }): number {
  let totalSimilarity = 0;
  let pairCount = 0;
  
  for (let i = 0; i < suggestions.length; i++) {
    for (let j = i + 1; j < suggestions.length; j++) {
      const similarity = calculateCosineSimilarity(tfidfMatrix[i], tfidfMatrix[j]);
      totalSimilarity += similarity;
      pairCount++;
    }
  }
  
  return pairCount > 0 ? totalSimilarity / pairCount : 0;
}

function extractTopKeywords(suggestions: any[]): string[] {
  const wordFreq: { [key: string]: number } = {};
  
  suggestions.forEach(suggestion => {
    const words = suggestion.processedText.split(' ');
    words.forEach((word: string) => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
  });
  
  return Object.entries(wordFreq)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([word]) => word);
}

function extractThemes(suggestions: any[]): { keywords: string[] }[] {
  const allWords = suggestions.flatMap(s => s.processedText.split(' '));
  const wordFreq: { [key: string]: number } = {};
  
  allWords.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });
  
  // Find common themes (words that appear in multiple suggestions)
  const themes = Object.entries(wordFreq)
    .filter(([, count]) => (count as number) > 1)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 10)
    .map(([word]) => ({ keywords: [word] }));
  
  return themes;
}

function hasThemeKeywords(suggestion: any, keywords: string[]): boolean {
  const suggestionWords = suggestion.processedText.split(' ');
  return keywords.some(keyword => suggestionWords.includes(keyword));
}

function generateGroupTitle(suggestions: any[]): string {
  // Smart title generation based on content
  if (suggestions.length === 0) return 'Unknown Group';
  
  // Use the most descriptive title (longest with most keywords)
  const bestTitle = suggestions.reduce((best, current) => {
    const currentScore = current.originalTitle.length + current.processedText.split(' ').length;
    const bestScore = best.originalTitle.length + best.processedText.split(' ').length;
    return currentScore > bestScore ? current : best;
  });
  
  return bestTitle.originalTitle;
}
