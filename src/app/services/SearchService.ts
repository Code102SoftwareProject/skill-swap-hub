import { elasticClient, testConnection } from '@/config/elasticsearch';
import { Forum, IForum } from '@/models/Forum';
import mongoose from 'mongoose';

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

    // Test Elasticsearch connection
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to Elasticsearch Cloud');
    }

    // Connect to MongoDB
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI!);
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
        await this.syncMongoDataToElasticsearch();
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
          number_of_replicas: 1,
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
            mongoId: { type: 'keyword' },
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
            posts: { type: 'integer' },
            replies: { type: 'integer' },
            lastActive: { type: 'keyword' },
            image: { type: 'keyword' },
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

  async searchForums(query: string): Promise<IForum[]> {
    try {
      await this.initialize();
      
      // Search in Elasticsearch
      const response = await elasticClient.search({
        index: this.indexName,
        body: {
          query: {
            bool: {
              should: [
                {
                  multi_match: {
                    query,
                    fields: ['title^2', 'description'],
                    type: 'best_fields',
                    fuzziness: 'AUTO'
                  }
                },
                {
                  match_phrase_prefix: {
                    title: {
                      query,
                      boost: 3
                    }
                  }
                }
              ]
            }
          },
          highlight: {
            fields: {
              title: {},
              description: {}
            },
            pre_tags: ['<mark>'],
            post_tags: ['</mark>']
          }
        }
      });

      // Get MongoDB IDs from Elasticsearch results
      const mongoIds = response.hits.hits.map((hit: any) => hit._source.mongoId);

      // Fetch full documents from MongoDB
      const forums = await Forum.find({
        _id: { $in: mongoIds }
      });

      // Merge MongoDB data with Elasticsearch highlights
      return response.hits.hits.map((hit: any) => {
        const mongoDoc = forums.find(f => f._id.toString() === hit._source.mongoId);
        return {
          id: mongoDoc?._id.toString() || '',
          ...mongoDoc?.toObject(),
          score: hit._score || 1.0,
          title: hit.highlight?.title?.[0] || mongoDoc?.title,
          description: hit.highlight?.description?.[0] || mongoDoc?.description
        };
      });
    } catch (error) {
      console.error('Search error:', error);
      throw new Error('Search failed');
    }
  }

  // Sync MongoDB data to Elasticsearch
  private async syncMongoDataToElasticsearch(): Promise<void> {
    const forums = await Forum.find();
    
    const body = forums.flatMap(forum => [
      { index: { _index: this.indexName } },
      {
        mongoId: (forum._id as mongoose.Types.ObjectId).toString(),
        ...forum.toObject()
      }
    ]);

    if (body.length > 0) {
      await elasticClient.bulk({ refresh: true, body });
      console.log('MongoDB data synchronized with Elasticsearch');
    }
  }

  // Method to keep Elasticsearch in sync with MongoDB changes
  async syncDocument(forum: IForum & { _id: mongoose.Types.ObjectId }, operation: 'index' | 'delete'): Promise<void> {
    if (operation === 'index') {
      await elasticClient.index({
        index: this.indexName,
        body: {
          mongoId: (forum._id as mongoose.Types.ObjectId).toString(),
          ...forum.toObject()
        }
      });
    } else if (operation === 'delete') {
      await elasticClient.deleteByQuery({
        index: this.indexName,
        body: {
          query: {
            term: { mongoId: forum._id.toString() }
          }
        }
      });
    }
  }
}