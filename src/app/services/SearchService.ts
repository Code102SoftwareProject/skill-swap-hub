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
      // Use the connect function from db.ts
      await connect();
      this.isInitialized = true;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  async searchForums(query: string): Promise<IForum[]> {
    try {
      await this.initialize();
      
      // Normalize the query: trim whitespace, convert to lowercase
      const normalizedQuery = query.trim().toLowerCase();
      console.log('Searching with normalized query:', normalizedQuery);
      
      // If query is empty, return recent forums
      if (!normalizedQuery) {
        const recentForums = await Forum.find({}).sort({ createdAt: -1 }).limit(10);
        return recentForums.map(doc => doc.toObject());
      }

      // Use MongoDB's built-in text search if index exists (faster than regex)
      try {
        // Try text search first (requires text index on title and description)
        const textSearchResults = await Forum.find(
          { $text: { $search: normalizedQuery } },
          { score: { $meta: "textScore" } }
        ).sort({ score: { $meta: "textScore" } });
        
        if (textSearchResults.length > 0) {
          console.log(`Found ${textSearchResults.length} results with text search`);
          return this.processSearchResults(textSearchResults, normalizedQuery);
        }
      } catch (textSearchError) {
        console.log('Text search not available, falling back to regex');
      }
      
      // Create a single regex pattern for better performance
      // This matches any of the words in the query
      const queryTerms = normalizedQuery.split(/\s+/).filter(term => term.length > 0);
      
      // Optimize the MongoDB query - use a single regex that combines all terms
      // This is more efficient than running separate queries for each term
      const combinedRegex = new RegExp(
        queryTerms.map(term => 
          term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        ).join('|'), 
        'i'
      );
      
      // Find documents that match any of the query terms
      const results = await Forum.find({
        $or: [
          { title: combinedRegex },
          { description: combinedRegex }
        ]
      }).limit(50); // Limit to improve performance
      
      console.log(`Found ${results.length} results with regex search`);
      
      return this.processSearchResults(results, normalizedQuery);
    } catch (error) {
      console.error('Search error:', error);
      
      // Return empty results instead of crashing with 500
      return [];
    }
  }
  
  // Simplified method to process search results without scoring
  private processSearchResults(results: any[], normalizedQuery: string): IForum[] {
    const queryTerms = normalizedQuery.split(/\s+/).filter(term => term.length > 0);
    
    // Convert results to plain objects
    const processedResults = results.map(doc => {
      const result = doc.toObject ? doc.toObject() : doc;
      let titleHighlighted = result.title;
      let descriptionHighlighted = result.description;
      
      // Build a single regex for all terms (more efficient)
      const escapedTerms = queryTerms.map(term => 
        term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      );
      
      if (escapedTerms.length > 0) {
        const combinedRegex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');
        
        // Apply highlighting
        titleHighlighted = titleHighlighted.replace(
          combinedRegex,
          '<mark class="bg-yellow-200">$1</mark>'
        );
        
        descriptionHighlighted = descriptionHighlighted.replace(
          combinedRegex,
          '<mark class="bg-yellow-200">$1</mark>'
        );
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
      
      // First try to check if any documents exist
      const docCount = await Forum.countDocuments();
      console.log(`Total documents in Forum collection: ${docCount}`);
      
      if (docCount === 0) {
        console.log('No documents in collection to search');
        return false;
      }
      
      // Try text index first (most efficient if available)
      try {
        const indexInfo = await Forum.collection.indexInformation();
        const hasTextIndex = Object.values(indexInfo).some(
          index => index.some(field => field[0] === 'title_text' || field[0] === 'description_text')
        );
        
        if (hasTextIndex) {
          console.log('MongoDB text index is available');
          return true;
        }
      } catch (indexError) {
        console.log('Unable to check for text index:', indexError);
      }
      
      // If we can query the collection at all, report that search is "working"
      const basicQuery = await Forum.find().limit(1);
      return basicQuery.length > 0;
    } catch (error) {
      console.error('Search system check failed completely:', error);
      return false;
    }
  }
}