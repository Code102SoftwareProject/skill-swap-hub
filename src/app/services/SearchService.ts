import mongoose from 'mongoose';
import { Forum, IForum } from '@/models/Forum';

export class SearchService {
  private static instance: SearchService;
  private isInitialized = false;
  private readonly dbName: string;

  private constructor() {
    const mongoUri = process.env.MONGODB_URI;
    this.dbName = mongoUri ? 
      mongoUri.split('/').pop()?.split('?')[0] || 'skillSwapHub' : 
      'skillSwapHub';
  }

  public static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  async initialize() {
    if (this.isInitialized) return;
  
    try {
      if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is not defined in environment variables');
      }

      if (!mongoose.connection.readyState) {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
          dbName: this.dbName
        });
        console.log(`Connected successfully to database: ${this.dbName}`);
      }
      this.isInitialized = true;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  async searchForums(query: string): Promise<IForum[]> {
    try {
      await this.initialize();
      
      console.log('Searching with query:', query);

      try {
        const searchResults = await Forum.aggregate([
          {
            $search: {
              index: "default",
              compound: {
                should: [
                  {
                    text: {
                      query: query,
                      path: "title",
                      score: { boost: { value: 2 } },
                      highlighting: { maxCharsToExamine: 500, maxNumPassages: 5 }
                    }
                  },
                  {
                    text: {
                      query: query,
                      path: "description",
                      highlighting: { maxCharsToExamine: 1000, maxNumPassages: 5 }
                    }
                  }
                ]
              }
            }
          },
          {
            $addFields: {
              score: { $meta: "searchScore" },
              highlights: { $meta: "searchHighlights" }
            }
          },
          {
            $sort: { score: -1 }
          }
        ]);

        console.log('Atlas Search results with highlights:', searchResults);

        // Process the results to add highlighting
        const processedResults = searchResults.map(result => {
          let titleHighlighted = result.title;
          let descriptionHighlighted = result.description;

          // Process highlights if they exist
          if (result.highlights) {
            result.highlights.forEach((highlight: any) => {
              const texts = highlight.texts;
              texts.forEach((text: any) => {
                if (text.type === 'hit') {
                  const regex = new RegExp(text.value, 'gi');
                  if (highlight.path === 'title') {
                    titleHighlighted = titleHighlighted.replace(
                      regex,
                      `<mark class="bg-yellow-200">${text.value}</mark>`
                    );
                  } else if (highlight.path === 'description') {
                    descriptionHighlighted = descriptionHighlighted.replace(
                      regex,
                      `<mark class="bg-yellow-200">${text.value}</mark>`
                    );
                  }
                }
              });
            });
          }

          return {
            ...result,
            title: titleHighlighted,
            description: descriptionHighlighted,
            score: Math.round((result.score || 0) * 100) / 100
          };
        });

        return processedResults;
      } catch (searchError) {
        console.error('Atlas Search error:', searchError);
        
        // Fallback to regex search with basic highlighting
        console.log('Falling back to regex search');
        const regex = new RegExp(`(${query})`, 'gi');
        const fallbackResults = await Forum.find({
          $or: [
            { title: { $regex: regex } },
            { description: { $regex: regex } }
          ]
        });

        // Add basic highlighting to fallback results
        const processedFallbackResults = fallbackResults.map(doc => {
          const result = doc.toObject();
          result.title = result.title.replace(
            regex,
            '<mark class="bg-yellow-200">$1</mark>'
          );
          result.description = result.description.replace(
            regex,
            '<mark class="bg-yellow-200">$1</mark>'
          );
          return result;
        });

        console.log('Fallback search results:', processedFallbackResults);
        return processedFallbackResults;
      }
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  async checkSearchIndex(): Promise<boolean> {
    try {
      const results = await Forum.aggregate([
        {
          $search: {
            index: "default",
            text: {
              query: "test",
              path: ["title", "description"]
            }
          }
        },
        { $limit: 1 }
      ]);
      return true;
    } catch (error) {
      console.error('Search index check failed:', error);
      return false;
    }
  }
}