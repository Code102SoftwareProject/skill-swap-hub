import { SearchService } from '@/app/services/SearchService';

async function setupElasticsearch() {
  try {
    const searchService = SearchService.getInstance();
    await searchService.initialize();  // Add initialization step
    console.log('Connection successful, setting up index...');
    await searchService.setupIndex(true);
    console.log('Elasticsearch setup completed successfully');
  } catch (error) {
    console.error('Elasticsearch setup failed:', error);
    process.exit(1);
  }
}

setupElasticsearch();