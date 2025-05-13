import { Forum, IForum } from '@/lib/models/Forum';
import connect from '@/lib/db';

// Initialize database connection
export async function initializeDB() {
  try {
    await connect();
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Main search function
export async function searchForums(query: string): Promise<IForum[]> {
  const normalizedQuery = query.trim();
  
  try {
    await initializeDB();
    console.log('Searching with normalized query:', normalizedQuery);

    // Return recent forums if query is empty
    if (!normalizedQuery) {
      const recentForums = await Forum.find({}).sort({ createdAt: -1 }).limit(10);
      return recentForums.map(doc => doc.toObject());
    }

    // Use Atlas Search
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
      { $limit: 50 },
      {
        // Include all fields from the Forum model
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
      { $sort: { score: -1 } }
    ]);

    console.log(`Found ${results.length} results using Atlas Search`);
    return processSearchResults(results, normalizedQuery.toLowerCase());
  } catch (error) {
    console.error('Atlas Search error:', error);
    // Fallback to basic search if Atlas Search fails
    return fallbackSearch(normalizedQuery);
  }
}

// Fallback search function
export async function fallbackSearch(query: string): Promise<IForum[]> {
  try {
    if (!query) {
      const recentForums = await Forum.find({}).sort({ createdAt: -1 }).limit(10);
      return recentForums.map(doc => doc.toObject());
    }

    // Basic regex search
    const regex = new RegExp(query, 'i');
    const results = await Forum.find({
      $or: [
        { title: regex },
        { description: regex }
      ]
    }).sort({ createdAt: -1 }).limit(50);

    console.log(`Found ${results.length} results using fallback search`);
    return processSearchResults(results, query.toLowerCase());
  } catch (error) {
    console.error('Fallback search error:', error);
    return [];
  }
}

// Process and highlight search results
export function processSearchResults(results: any[], normalizedQuery: string): IForum[] {
  const queryTerms = normalizedQuery.split(/\s+/).filter(term => term.length > 0);

  return results.map(doc => {
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
}

// Check search index status
export async function checkSearchIndex(): Promise<boolean> {
  try {
    await initializeDB();
    const docCount = await Forum.countDocuments();
    if (docCount === 0) return false;

    const indexes = await Forum.collection.indexInformation();
    console.log('Index info:', indexes);
    return true; // assume Atlas Search works if connection succeeds
  } catch (error) {
    console.error('Search system check failed:', error);
    return false;
  }
}