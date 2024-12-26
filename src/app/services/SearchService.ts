import { elasticClient, testConnection } from '@/config/elasticsearch';
import { Forum } from '@/models/Forum';

export class SearchService {
  private static instance: SearchService;
  private readonly indexName = 'forums';
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

    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to Elasticsearch');
    }

    this.isInitialized = true;
  }

  async setupIndex(deleteExisting = false): Promise<void> {
    try {
      await this.initialize();

      const indexExists = await elasticClient.indices.exists({
        index: this.indexName
      });

      if (indexExists && deleteExisting) {
        await elasticClient.indices.delete({ index: this.indexName });
      }

      if (!indexExists || deleteExisting) {
        await this.createIndex();
        await this.seedSampleData();
      }
    } catch (error) {
      console.error('Setup error:', error);
      throw new Error(`Index setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async createIndex(): Promise<void> {
    await elasticClient.indices.create({
      index: this.indexName,
      body: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0,
          analysis: {
            analyzer: {
              custom_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'stop', 'snowball']
              }
            }
          }
        },
        mappings: {
          properties: {
            title: {
              type: 'text',
              analyzer: 'custom_analyzer',
              fields: {
                keyword: {
                  type: 'keyword',
                  ignore_above: 256
                }
              }
            },
            description: {
              type: 'text',
              analyzer: 'custom_analyzer'
            },
            posts: { 
              type: 'integer' 
            },
            replies: { 
              type: 'integer' 
            },
            lastActive: { 
              type: 'keyword' 
            },
            image: { 
              type: 'keyword' 
            },
            createdAt: { 
              type: 'date',
              format: 'strict_date_optional_time||epoch_millis'
            },
            updatedAt: { 
              type: 'date',
              format: 'strict_date_optional_time||epoch_millis'
            }
          }
        }
      }
    });
  }

  async searchForums(query: string): Promise<Forum[]> {
    const response = await elasticClient.search({
      index: this.indexName,
      body: {
        query: {
          multi_match: {
            query,
            fields: ['title^2', 'description'], // Boost title field in query instead of mapping
            fuzziness: 'AUTO'
          }
        }
      }
    });

    return response.hits.hits.map((hit: any) => ({
      id: hit._id,
      ...hit._source
    }));
  }

  private async seedSampleData(): Promise<void> {
    const sampleData: Omit<Forum, 'id'>[] = [
      {
        title: 'REACT JS Community Forums',
        description: 'Discuss the latest React.js frameworks, libraries, and best practices with the React developer community.',
        posts: 14,
        replies: 22,
        lastActive: '10 months',
        image: '/api/placeholder/80/80',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Add more sample data as needed
    ];

    const body = sampleData.flatMap(doc => [
      { index: { _index: this.indexName } },
      doc
    ]);

    await elasticClient.bulk({ refresh: true, body });
  }
}