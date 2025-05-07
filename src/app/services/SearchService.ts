import { Forum, IForum } from '@/lib/models/Forum';
import connect from '@/lib/db';

export class SearchService {
  private static instance: SearchService;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  async initialize() {
    if (this.isInitialized) return;
    try {
      await connect();
      this.isInitialized = true;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  async searchForums(query: string): Promise<IForum[]> {
    const normalizedQuery = query.trim();
    try {
      await this.initialize();

      console.log('Searching with normalized query:', normalizedQuery);

      if (!normalizedQuery) {
        const recentForums = await Forum.find({}).sort({ createdAt: -1 }).limit(10);
        return recentForums.map(doc => doc.toObject());
      }

      // Simple Atlas Search query that should work with any index configuration
      const results = await Forum.aggregate([
        {
          $search: {
            index: 'forums_search',
            text: {
              query: normalizedQuery,
              path: {
                wildcard: '*'  // Search across all indexed fields
              }
            }
          }
        },
        {
          $limit: 50
        },
        {
          // Include ALL fields from the Forum model
          $project: {
            _id: 1,
            title: 1,
            description: 1,
            createdAt: 1,
            updatedAt: 1,
            posts: 1,
            replies: 1,
            lastActive: 1,
            image: 1,
            __v: 1,
          
          }
        },
        {
          // Sort by search relevance score
          $sort: { score: -1 }
        }
      ]);

      console.log(`Found ${results.length} results using Atlas Search`);
      return this.processSearchResults(results, normalizedQuery.toLowerCase());
    } catch (error) {
      console.error('Atlas Search error:', error);
      // Fallback to basic search if Atlas Search fails
      return this.fallbackSearch(normalizedQuery);
    }
  }

  // Fallback search method when Atlas Search fails
  private async fallbackSearch(query: string): Promise<IForum[]> {
    try {
      if (!query) {
        const recentForums = await Forum.find({}).sort({ createdAt: -1 }).limit(10);
        return recentForums.map(doc => doc.toObject());
      }

      // Basic regex search - works well for single letter searches too
      const regex = new RegExp(query, 'i');
      const results = await Forum.find({
        $or: [
          { title: regex },
          { description: regex }
        ]
      }).sort({ createdAt: -1 }).limit(50);

      console.log(`Found ${results.length} results using fallback search`);
      return this.processSearchResults(results, query.toLowerCase());
    } catch (error) {
      console.error('Fallback search error:', error);
      return [];
    }
  }

  private processSearchResults(results: any[], normalizedQuery: string): IForum[] {
    const queryTerms = normalizedQuery.split(/\s+/).filter(term => term.length > 0);

    const processedResults = results.map(doc => {
      const result = doc.toObject ? doc.toObject() : doc;
      let titleHighlighted = result.title || '';
      let descriptionHighlighted = result.description || '';

      // Only highlight if we have search terms
      if (queryTerms.length > 0) {
        const escapedTerms = queryTerms.map(term =>
          term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        );

        if (escapedTerms.length > 0) {
          const combinedRegex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');

          titleHighlighted = titleHighlighted.replace(
            combinedRegex,
            '<mark class="bg-yellow-200">$1</mark>'
          );

          descriptionHighlighted = descriptionHighlighted.replace(
            combinedRegex,
            '<mark class="bg-yellow-200">$1</mark>'
          );
        }
      }

      return {
        ...result,
        title: titleHighlighted,
        description: descriptionHighlighted
      };
    });

    return processedResults;
  }

  async checkSearchIndex(): Promise<boolean> {
    try {
      await this.initialize();
      const docCount = await Forum.countDocuments();
      if (docCount === 0) return false;

      const indexes = await Forum.collection.indexInformation();
      console.log('Index info:', indexes);
      return true; // We assume Atlas Search works if connection succeeds
    } catch (error) {
      console.error('Search system check failed:', error);
      return false;
    }
  }
}